"use client";

import { useEffect, useState } from "react";
import { BubbleBg } from "@/components/BubbleBg";
import { LoginScreen } from "@/components/LoginScreen";
import { MenuScreen } from "@/components/MenuScreen";
import { getPlayerId, isLoggedIn, logout } from "@/lib/auth";
import { logDogukanLogin, logDogukanVisit } from "@/lib/activityLog";

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const logged = isLoggedIn();
    setAuthed(logged);
    if (logged) logDogukanLogin();
    setReady(true);
  }, []);

  const onLoginSuccess = () => {
    setAuthed(true);
    logDogukanLogin();
    if (getPlayerId() === "dogukan") {
      logDogukanVisit("ana-sayfa", "Ana sayfa");
    }
  };

  if (!ready) return null;

  return (
    <>
      <BubbleBg />
      <div className="sky-gradient" aria-hidden />
      <div className={authed ? "shell shell-menu" : "shell"}>
        {!authed ? (
          <LoginScreen onSuccess={onLoginSuccess} />
        ) : (
          <MenuScreen
            onLogout={() => {
              logout();
              setAuthed(false);
            }}
          />
        )}
      </div>
    </>
  );
}
