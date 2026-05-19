import { child, get, onValue, set, type Unsubscribe } from "firebase/database";
import type { PlayerId } from "./auth";
import { getPlayerDisplayName, getRivalId } from "./auth";
import { isFirebaseConfigured, leaderboardRef, leaderboardRootRef } from "./firebase";

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
  localStorage.setItem(localKey(player), JSON.stringify(board));
}

export function getHighScore(gameSlug: string, player: PlayerId): number {
  return getScores(player)[gameSlug] ?? 0;
}

export async function fetchGameScores(gameSlug: string): Promise<Record<PlayerId, number>> {
  const out: Record<PlayerId, number> = {
    dogukan: getHighScore(gameSlug, "dogukan"),
    serkan: getHighScore(gameSlug, "serkan"),
  };

  const ref = leaderboardRef(gameSlug);
  if (!ref) return out;

  try {
    const snap = await get(ref);
    const val = snap.val() as Partial<Record<PlayerId, number>> | null;
    if (val) {
      for (const p of PLAYERS) {
        if (typeof val[p] === "number") {
          out[p] = Math.max(out[p], val[p]!);
          if (val[p]! > getHighScore(gameSlug, p)) {
            setLocalScore(gameSlug, p, val[p]!);
          }
        }
      }
    }
  } catch (e) {
    console.warn("Firebase skor okunamadı:", e);
  }
  return out;
}

export function subscribeGameScores(
  gameSlug: string,
  onUpdate: (scores: Record<PlayerId, number>) => void,
): Unsubscribe | null {
  const ref = leaderboardRef(gameSlug);
  if (!ref) return null;

  return onValue(ref, (snap) => {
    const val = snap.val() as Partial<Record<PlayerId, number>> | null;
    const scores: Record<PlayerId, number> = {
      dogukan: getHighScore(gameSlug, "dogukan"),
      serkan: getHighScore(gameSlug, "serkan"),
    };
    if (val) {
      for (const p of PLAYERS) {
        if (typeof val[p] === "number") {
          scores[p] = val[p]!;
          if (val[p]! > getHighScore(gameSlug, p)) setLocalScore(gameSlug, p, val[p]!);
        }
      }
    }
    onUpdate(scores);
  });
}

export function subscribeAllLeaderboards(
  onUpdate: (data: Record<PlayerId, ScoreBoard>) => void,
): Unsubscribe | null {
  const ref = leaderboardRootRef();
  if (!ref) return null;

  return onValue(ref, (snap) => {
    const remote = snap.val() as Record<string, Partial<Record<PlayerId, number>>> | null;
    const merged: Record<PlayerId, ScoreBoard> = {
      dogukan: { ...getScores("dogukan") },
      serkan: { ...getScores("serkan") },
    };
    if (remote) {
      for (const [gameSlug, players] of Object.entries(remote)) {
        if (!players) continue;
        for (const p of PLAYERS) {
          if (typeof players[p] === "number") {
            const v = players[p]!;
            merged[p][gameSlug] = Math.max(merged[p][gameSlug] ?? 0, v);
            if (v > getHighScore(gameSlug, p)) setLocalScore(gameSlug, p, v);
          }
        }
      }
    }
    onUpdate(merged);
  });
}

export type ScoreResult = {
  score: number;
  isNewRecord: boolean;
  beatRival: boolean;
  celebrate: boolean;
  message: string;
};

function buildCelebrateMessage(
  player: PlayerId,
  score: number,
  isNewRecord: boolean,
  beatRival: boolean,
): { celebrate: boolean; message: string } {
  const rival = getRivalId(player);
  if (isNewRecord && beatRival) {
    return {
      celebrate: true,
      message: `Harika ${getPlayerDisplayName(player)}! Yeni rekor ve ${getPlayerDisplayName(rival)}'ı geçtin! 🏆`,
    };
  }
  if (isNewRecord) {
    return {
      celebrate: true,
      message: `Aferin ${getPlayerDisplayName(player)}! Yeni rekor: ${score}! 🎉`,
    };
  }
  if (beatRival) {
    return {
      celebrate: true,
      message: `Süpersin ${getPlayerDisplayName(player)}! ${getPlayerDisplayName(rival)}'ı yakaladın! 🔥`,
    };
  }
  return { celebrate: false, message: "" };
}

export async function recordScore(
  gameSlug: string,
  player: PlayerId,
  score: number,
): Promise<ScoreResult> {
  const scores = await fetchGameScores(gameSlug);
  const prev = scores[player];
  const rival = getRivalId(player);
  const rivalScore = scores[rival];
  const isNewRecord = score > prev;
  const beatRival = score > rivalScore && rivalScore > 0;

  if (isNewRecord) {
    setLocalScore(gameSlug, player, score);
    const ref = leaderboardRef(gameSlug);
    if (ref && isFirebaseConfigured()) {
      try {
        const cur = (await get(ref)).val()?.[player];
        if (cur == null || score > cur) {
          await set(child(ref, player), score);
        }
      } catch (e) {
        console.warn("Firebase skor yazılamadı:", e);
      }
    }
  }

  const { celebrate, message } = buildCelebrateMessage(player, score, isNewRecord, beatRival);
  return { score, isNewRecord, beatRival, celebrate, message };
}

export async function checkLiveMilestone(
  gameSlug: string,
  player: PlayerId,
  currentScore: number,
  lastCelebrated: number,
): Promise<{ celebrate: boolean; message: string; mark: number }> {
  const scores = await fetchGameScores(gameSlug);
  const prev = scores[player];
  const rival = getRivalId(player);
  const rivalScore = scores[rival];

  if (currentScore > prev && lastCelebrated < prev + 1) {
    return {
      celebrate: true,
      message: `Aferin ${getPlayerDisplayName(player)}! Eski rekorunu geçiyorsun! 🚀`,
      mark: currentScore,
    };
  }
  if (rivalScore > 0 && currentScore > rivalScore && lastCelebrated < rivalScore + 1) {
    return {
      celebrate: true,
      message: `Vay be ${getPlayerDisplayName(player)}! ${getPlayerDisplayName(rival)}'ı geçtin! 🏆`,
      mark: currentScore,
    };
  }
  const milestones = [50, 100, 250, 500, 1000];
  for (const m of milestones) {
    if (currentScore >= m && lastCelebrated < m) {
      return {
        celebrate: true,
        message: `Aferin ${getPlayerDisplayName(player)}! ${m} puan! ⭐`,
        mark: m,
      };
    }
  }
  return { celebrate: false, message: "", mark: lastCelebrated };
}

export function getAllLeaderboards(): Record<PlayerId, ScoreBoard> {
  return {
    dogukan: getScores("dogukan"),
    serkan: getScores("serkan"),
  };
}
