/**
 * Skor tablosu (CONTRACT §4, §16). Sahibi S5.
 *
 * - Yerel öncelikli: `dogukan-scores-{player}` anında okunur/yazılır; sonuçlar
 *   ağı beklemez. Firebase'den gelen yüksek skorlar oraya önbelleklenir.
 * - Firebase SDK yalnızca `await import("./firebase")` ile ve her okuma/abonelik/
 *   yazım `getAuthedDb()` (anonim oturum açıldıktan sonra) üzerinden; sessiz hata.
 * - Çocuğa giden satırlar `praise()`'den gelir: kişi övülmez, babayla
 *   kıyaslanmaz. `rivalVisible` açıkken rakip yalnızca nötr sayı olarak görünür
 *   ("🏆 Baba: N").
 */
import type { Unsubscribe } from "firebase/database";
import type { PlayerId } from "./auth";
import { getPlayerDisplayName, getRivalId } from "./auth";
import { isFirebaseConfigured } from "./firebaseConfig";
import { praise } from "./praise";
import { getSettings } from "./settings";

/** Rakip (baba) sayısı yalnızca ebeveyn `settings.rivalVisible` açtıysa (CONTRACT §4). */
function rivalAllowed(opt?: boolean): boolean {
  return opt ?? getSettings().rivalVisible;
}

type FirebaseModule = typeof import("./firebase");
type AuthedDb = {
  fb: FirebaseModule;
  db: NonNullable<Awaited<ReturnType<FirebaseModule["getAuthedDb"]>>>;
};

/** SDK'yı tembel yükler ve anonim oturumu bekler. Yapılandırma/oturum yoksa `null`; fırlatmaz. */
async function authedDb(): Promise<AuthedDb | null> {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  try {
    const fb = await import("./firebase");
    const db = await fb.getAuthedDb();
    return db ? { fb, db } : null;
  } catch (e) {
    console.warn("Firebase yüklenemedi:", e);
    return null;
  }
}

/** Rakibin nötr etiketi: Doğukan için "Baba". */
export function rivalLabel(rival: PlayerId): string {
  return rival === "serkan" ? "Baba" : getPlayerDisplayName(rival);
}

/** Rakip bilgisi yalnızca nötr sayı: " · 🏆 Baba: N". Övgü ya da kıyas metni yoktur. */
function rivalSuffix(player: PlayerId, rivalScore: number, show: boolean): string {
  return show && rivalScore > 0
    ? ` · 🏆 ${rivalLabel(getRivalId(player))}: ${rivalScore}`
    : "";
}

export type ScoreBoard = Record<string, number>;

const PREFIX = "dogukan-scores";
const PLAYERS: PlayerId[] = ["dogukan", "serkan"];

function localKey(player: PlayerId) {
  return `${PREFIX}-${player}`;
}

export function getScores(player: PlayerId): ScoreBoard {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(localKey(player));
    return raw ? (JSON.parse(raw) as ScoreBoard) : {};
  } catch {
    return {};
  }
}

function setLocalScore(gameSlug: string, player: PlayerId, score: number) {
  const board = getScores(player);
  board[gameSlug] = score;
  try {
    localStorage.setItem(localKey(player), JSON.stringify(board));
  } catch {
    /* kota / gizli gezinme */
  }
}

function localHighs(gameSlug: string): Record<PlayerId, number> {
  return {
    dogukan: getHighScore(gameSlug, "dogukan"),
    serkan: getHighScore(gameSlug, "serkan"),
  };
}

/** Uzak değerleri yerel önbelleğe alır ve `out` içinde max'lar. */
function absorbRemote(
  gameSlug: string,
  val: Partial<Record<PlayerId, unknown>> | null,
  out: Record<PlayerId, number>,
): Record<PlayerId, number> {
  if (!val || typeof val !== "object") return out;
  for (const p of PLAYERS) {
    const v = val[p];
    if (typeof v !== "number" || !Number.isFinite(v)) continue;
    out[p] = Math.max(out[p], v);
    if (v > getHighScore(gameSlug, p)) setLocalScore(gameSlug, p, v);
  }
  return out;
}

export function getHighScore(gameSlug: string, player: PlayerId): number {
  return getScores(player)[gameSlug] ?? 0;
}

/**
 * Yerel yüksek skorlar + (yapılandırılmışsa) Firebase. Ağ yoksa/oturum açılamazsa
 * yerel değerler döner. Çocuk yolu bunu beklememeli (`void …then(…)`).
 */
export async function fetchGameScores(gameSlug: string): Promise<Record<PlayerId, number>> {
  const out = localHighs(gameSlug);
  const conn = await authedDb();
  if (!conn) return out;
  try {
    const snap = await conn.fb.get(conn.fb.ref(conn.db, `leaderboard/${gameSlug}`));
    return absorbRemote(gameSlug, snap.val() as Partial<Record<PlayerId, unknown>> | null, out);
  } catch (e) {
    console.warn("Firebase skor okunamadı:", e);
    return out;
  }
}

/**
 * Abonelik oturum açıldıktan sonra arka planda kurulur. Firebase yapılandırılmamışsa
 * `null`; aksi halde hemen bir iptal işlevi döner.
 */
export function subscribeGameScores(
  gameSlug: string,
  onUpdate: (scores: Record<PlayerId, number>) => void,
): Unsubscribe | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  let cancelled = false;
  let unsub: Unsubscribe | null = null;
  void (async () => {
    const conn = await authedDb();
    if (!conn || cancelled) return;
    try {
      unsub = conn.fb.onValue(
        conn.fb.ref(conn.db, `leaderboard/${gameSlug}`),
        (snap) => {
          const val = snap.val() as Partial<Record<PlayerId, unknown>> | null;
          onUpdate(absorbRemote(gameSlug, val, localHighs(gameSlug)));
        },
        (e) => console.warn("Firebase skor aboneliği:", e),
      );
    } catch (e) {
      console.warn("Firebase skor aboneliği kurulamadı:", e);
    }
  })();
  return () => {
    cancelled = true;
    unsub?.();
  };
}

export function subscribeAllLeaderboards(
  onUpdate: (data: Record<PlayerId, ScoreBoard>) => void,
): Unsubscribe | null {
  if (typeof window === "undefined" || !isFirebaseConfigured()) return null;
  let cancelled = false;
  let unsub: Unsubscribe | null = null;
  void (async () => {
    const conn = await authedDb();
    if (!conn || cancelled) return;
    try {
      unsub = conn.fb.onValue(
        conn.fb.ref(conn.db, "leaderboard"),
        (snap) => {
          const remote = snap.val() as Record<string, Partial<Record<PlayerId, unknown>> | null> | null;
          const merged: Record<PlayerId, ScoreBoard> = {
            dogukan: { ...getScores("dogukan") },
            serkan: { ...getScores("serkan") },
          };
          if (remote && typeof remote === "object") {
            for (const [gameSlug, players] of Object.entries(remote)) {
              const highs = absorbRemote(gameSlug, players, { dogukan: 0, serkan: 0 });
              for (const p of PLAYERS) {
                if (highs[p] > 0) merged[p][gameSlug] = Math.max(merged[p][gameSlug] ?? 0, highs[p]);
              }
            }
          }
          onUpdate(merged);
        },
        (e) => console.warn("Firebase skor tablosu aboneliği:", e),
      );
    } catch (e) {
      console.warn("Firebase skor tablosu aboneliği kurulamadı:", e);
    }
  })();
  return () => {
    cancelled = true;
    unsub?.();
  };
}

export type ScoreResult = {
  score: number;
  isNewRecord: boolean;
  beatRival: boolean;
  celebrate: boolean;
  message: string;
};

/** Yeni rekoru Firebase'e yazar (arka planda; daha yüksek uzak değer ezilmez). */
async function pushHighScore(gameSlug: string, player: PlayerId, score: number): Promise<void> {
  const conn = await authedDb();
  if (!conn) return;
  try {
    const { fb, db } = conn;
    const node = fb.ref(db, `leaderboard/${gameSlug}/${player}`);
    const cur: unknown = (await fb.get(node)).val();
    if (typeof cur === "number" && cur >= score) {
      if (cur > getHighScore(gameSlug, player)) setLocalScore(gameSlug, player, cur);
      return;
    }
    await fb.set(node, score);
  } catch (e) {
    console.warn("Firebase skor yazılamadı:", e);
  }
}

/**
 * Koşu sonu. Yerel yüksek skorlarla (Firebase'den önbelleklenenler dahil) anında
 * karar verir ve ağı beklemez; uzak yazım arka planda yapılır.
 *
 * Mesaj (yalnızca yeni rekorda): "🏆 N! <praise(run_end)>" ve `rivalVisible`
 * açıksa nötr " · 🏆 Baba: M". Babayı geçmek/yakalamak kutlanmaz (`beatRival`
 * yalnızca veri olarak döner).
 */
export async function recordScore(
  gameSlug: string,
  player: PlayerId,
  score: number,
  opts?: { rivalVisible?: boolean },
): Promise<ScoreResult> {
  const scores = localHighs(gameSlug);
  const prev = scores[player];
  const rivalScore = scores[getRivalId(player)];
  const isNewRecord = score > prev;
  const beatRival = score > rivalScore && rivalScore > 0;

  if (isNewRecord) {
    setLocalScore(gameSlug, player, score);
    void pushHighScore(gameSlug, player, score);
  }

  if (!isNewRecord) return { score, isNewRecord, beatRival, celebrate: false, message: "" };
  const message = `🏆 ${score}! ${praise("run_end")}${rivalSuffix(
    player,
    rivalScore,
    rivalAllowed(opts?.rivalVisible),
  )}`;
  return { score, isNewRecord, beatRival, celebrate: true, message };
}

/**
 * Oyun sırasında ara kutlama (yalnızca kendi ilerlemesi): eski rekor aşıldı ya da
 * puan eşiği. Satırlar `praise()`'den gelir. Babayla kıyas kutlaması yoktur;
 * `kind: "rival"` artık üretilmez (tip geriye uyumluluk için duruyor).
 */
export async function checkLiveMilestone(
  gameSlug: string,
  player: PlayerId,
  currentScore: number,
  lastCelebrated: number,
  opts?: { rivalVisible?: boolean },
): Promise<LiveMilestone> {
  void opts;
  const prev = localHighs(gameSlug)[player];

  if (prev > 0 && currentScore > prev && lastCelebrated < prev + 1) {
    return {
      celebrate: true,
      message: `🚀 ${praise("run_end")}`,
      mark: currentScore,
      kind: "record",
    };
  }
  const milestones = [500, 1000, 2500, 5000, 10000];
  for (const m of milestones) {
    if (currentScore >= m && lastCelebrated < m) {
      return {
        celebrate: true,
        message: `⭐ ${m}! ${praise("correct_first")}`,
        mark: m,
        kind: "mark",
      };
    }
  }
  return { celebrate: false, message: "", mark: lastCelebrated, kind: null };
}

export type LiveMilestone = {
  celebrate: boolean;
  message: string;
  mark: number;
  /** S5 (ek): kutlamanın türü; çağıran kendi metnini seçebilsin diye. */
  kind: "record" | "rival" | "mark" | null;
};

export function getAllLeaderboards(): Record<PlayerId, ScoreBoard> {
  return {
    dogukan: getScores("dogukan"),
    serkan: getScores("serkan"),
  };
}
