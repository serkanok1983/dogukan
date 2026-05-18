"use client";

import { useEffect, useState } from "react";
import { BubbleBg } from "@/components/BubbleBg";
import { LoginScreen } from "@/components/LoginScreen";
import { MenuScreen } from "@/components/MenuScreen";
import { isLoggedIn, logout } from "@/lib/auth";

export default function HomePage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAuthed(isLoggedIn());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <>
      <BubbleBg />
      <div className="sky-gradient" aria-hidden />
      <div className={authed ? "shell shell-menu" : "shell"}>
        {!authed ? (
          <LoginScreen onSuccess={() => setAuthed(true)} />
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
