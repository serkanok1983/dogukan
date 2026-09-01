"use client";

import { useEffect, useState } from "react";
import { BubbleBg } from "@/components/BubbleBg";
import { LoginScreen } from "@/components/LoginScreen";
import { MenuScreen } from "@/components/MenuScreen";
import { getPlayerId, isLoggedIn, logout } from "@/lib/auth";
import { logDogukanLogin, logDogukanVisit } from "@/lib/activityLog";
import type { ActivityLearningPreviews } from "@/lib/activityLearning.types";

type Props = {
  learningPreviews: ActivityLearningPreviews;
};

export function HomeClient({ learningPreviews }: Props) {
  const [session, setSession] = useState({ ready: false, authed: false });

  useEffect(() => {
    const logged = isLoggedIn();
    // Oturum depolaması SSR sırasında okunamaz; ilk tarayıcı eşitlemesi bilinçli olarak burada yapılır.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSession({ ready: true, authed: logged });
    if (logged) logDogukanLogin();
  }, []);

  const onLoginSuccess = () => {
    setSession({ ready: true, authed: true });
    logDogukanLogin();
    if (getPlayerId() === "dogukan") {
      logDogukanVisit("ana-sayfa", "Ana sayfa");
    }
  };

  if (!session.ready) return null;

  return (
    <>
      <BubbleBg />
      <div className="sky-gradient" aria-hidden />
      <div className={session.authed ? "shell shell-menu" : "shell"}>
        {!session.authed ? (
          <LoginScreen onSuccess={onLoginSuccess} />
        ) : (
          <MenuScreen
            learningPreviews={learningPreviews}
            onLogout={() => {
              logout();
              setSession({ ready: true, authed: false });
            }}
          />
        )}
      </div>
    </>
  );
}
