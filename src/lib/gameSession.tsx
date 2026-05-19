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
    <GameSessionContext.Provider value={{ active }}>{children}</GameSessionContext.Provider>
  );
}

export function useGameActive() {
  return useContext(GameSessionContext).active;
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
