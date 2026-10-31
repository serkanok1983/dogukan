"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/**
 * Oyun oturumu (CONTRACT §10.3). Sahibi S4.
 *
 * - `active` (prop): kabuk oyunun çalışmasına izin veriyor mu
 *   (StartCard geçildi, iyi oluş katmanı yok, RewardSheet kapalı).
 * - `paused`: ⏸ katmanı. Sağlayıcı tutar; belge gizlenince kendiliğinden
 *   duraklar (arka plana geçen telefon). `useGameActive()` = active && !paused,
 *   böylece göç etmemiş 26 oyun da dokunulmadan duraklar.
 * - Yeniden başlatma kaydı: amiral oyunlar `registerRestart(fn)` ile kabuğa
 *   "Tekrar" fonksiyonunu verir; kabuk RewardSheet'i bununla açar.
 */

export type RestartRegistry = {
  /** Bir oyun yeniden başlatma kaydettirdi mi */
  has: boolean;
  register(fn: () => void): () => void;
  /** Kayıtlı fonksiyonu çalıştırır (yoksa hiçbir şey yapmaz) */
  restart(): void;
};

type GameSessionValue = {
  /** Oyun döngüsü çalışsın mı: active && !paused */
  active: boolean;
  paused: boolean;
  pause(): void;
  resume(): void;
  registerRestart(fn: () => void): () => void;
  hasRestart: boolean;
};

const NOOP = () => {};
const NOOP_UNREGISTER = () => NOOP;

const GameSessionContext = createContext<GameSessionValue>({
  active: true,
  paused: false,
  pause: NOOP,
  resume: NOOP,
  registerRestart: NOOP_UNREGISTER,
  hasRestart: false,
});

/**
 * Kabuk tarafı kayıt defteri. Kabuk RewardSheet kararını sağlayıcının
 * dışında verdiği için kayıt defterini kendisi oluşturup sağlayıcıya verir.
 */
export function useRestartRegistry(): RestartRegistry {
  const fnRef = useRef<(() => void) | null>(null);
  const [has, setHas] = useState(false);

  const register = useCallback((fn: () => void) => {
    fnRef.current = fn;
    setHas(true);
    return () => {
      if (fnRef.current !== fn) return;
      fnRef.current = null;
      setHas(false);
    };
  }, []);

  const restart = useCallback(() => {
    fnRef.current?.();
  }, []);

  return useMemo(() => ({ has, register, restart }), [has, register, restart]);
}

export function GameSessionProvider({
  active,
  children,
  registry,
}: {
  active: boolean;
  children: React.ReactNode;
  /** İsteğe bağlı: kabuğun kayıt defteri. Verilmezse sağlayıcı kendi defterini tutar. */
  registry?: RestartRegistry;
}) {
  const ownRegistry = useRestartRegistry();
  const reg = registry ?? ownRegistry;
  const [paused, setPaused] = useState(false);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  // Telefon kilitlenince / sekme gizlenince oyunu duraklat. Dönüşte ⏸ katmanı
  // "Devam" bekler; setInterval tabanlı sayaçlar (Köstebek) da böylece durur.
  useEffect(() => {
    if (!active) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") setPaused(true);
    };
    const onPageHide = () => setPaused(true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [active]);

  const value = useMemo<GameSessionValue>(
    () => ({
      active: active && !paused,
      paused,
      pause,
      resume,
      registerRestart: reg.register,
      hasRestart: reg.has,
    }),
    [active, paused, pause, resume, reg.register, reg.has],
  );

  return (
    <GameSessionContext.Provider value={value}>
      {children}
    </GameSessionContext.Provider>
  );
}

/** Oyun döngüsü çalışabilir mi: kabuk izin veriyor VE ⏸ değil. */
export function useGameActive(): boolean {
  return useContext(GameSessionContext).active;
}

/** Oyun duraklatıldı mı (⏸ veya belge gizlendi). */
export function useGamePaused(): boolean {
  return useContext(GameSessionContext).paused;
}

/** ⏸ / ▶ denetimi (GameFrame ve oyunlar için). */
export function useGamePauseControl(): {
  paused: boolean;
  pause(): void;
  resume(): void;
} {
  const { paused, pause, resume } = useContext(GameSessionContext);
  return useMemo(() => ({ paused, pause, resume }), [paused, pause, resume]);
}

/** Amiral oyunlar yeniden başlatma fonksiyonlarını kabuğa kaydeder (RewardSheet "Tekrar"). */
export function useGameRestart(): { registerRestart(fn: () => void): () => void } {
  const registerRestart = useContext(GameSessionContext).registerRestart;
  return useMemo(() => ({ registerRestart }), [registerRestart]);
}

/**
 * Kolaylık: `fn` her render'da değişse bile kayıt bir kez yapılır; "Tekrar"
 * her zaman en güncel `fn`'i çağırır. Amiral oyunlar bunu kullanır.
 */
export function useRegisterRestart(fn: () => void): void {
  const { registerRestart } = useGameRestart();
  const latest = useRef(fn);
  useEffect(() => {
    latest.current = fn;
  });
  useEffect(() => registerRestart(() => latest.current()), [registerRestart]);
}

/** Bir oyun yeniden başlatma kaydettiyse true. */
export function useHasRestart(): boolean {
  return useContext(GameSessionContext).hasRestart;
}

/** İlk kez oyun aktif olduğunda bir kere çalışır (StartCard sonrası). */
export function useGameBoot(onBoot: () => void) {
  const active = useGameActive();
  const booted = useRef(false);
  useEffect(() => {
    if (!active || booted.current) return;
    booted.current = true;
    onBoot();
  }, [active, onBoot]);
}
