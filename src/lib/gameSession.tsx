"use client";

import { createContext, useContext, useEffect, useRef } from "react";

type GameSessionValue = {
  /** Oyun döngüsü çalışsın mı (bilgilendirme kapatıldıktan sonra true) */
  active: boolean;
};

const GameSessionContext = createContext<GameSessionValue>({ active: true });

export function GameSessionProvider({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <GameSessionContext.Provider value={{ active }}>
      {children}
    </GameSessionContext.Provider>
  );
}

export function useGameActive() {
  return useContext(GameSessionContext).active;
}

// ---- C0 shim (CONTRACT §10.3) — owner: S4. S4 gerçek duraklatma ve yeniden başlatmayı ekler. ----

const NO_RESTART = { registerRestart: () => () => {} };

/** Oyun duraklatıldı mı (⏸ veya iyi oluş katmanı). */
export function useGamePaused(): boolean {
  return false;
}

/** Amiral oyunlar yeniden başlatma fonksiyonlarını kabuğa kaydeder (RewardSheet "Tekrar"). */
export function useGameRestart(): { registerRestart(fn: () => void): () => void } {
  return NO_RESTART;
}

/** Kabuk tarafı: bir oyun yeniden başlatma kaydettiyse true. */
export function useHasRestart(): boolean {
  return false;
}

/** İlk kez oyun aktif olduğunda bir kere çalışır (talimat ekranı sonrası). */
export function useGameBoot(onBoot: () => void) {
  const active = useGameActive();
  const booted = useRef(false);
  useEffect(() => {
    if (!active || booted.current) return;
    booted.current = true;
    onBoot();
  }, [active, onBoot]);
}
