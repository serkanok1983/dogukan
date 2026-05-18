"use client";

import { useState } from "react";
import { checkCredentials, setLoggedIn } from "@/lib/auth";
import { sounds } from "@/lib/sounds";
import { TOTAL_ACTIVITIES } from "@/lib/menu";

type Props = { onSuccess: () => void };

export function LoginScreen({ onSuccess }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const login = () => {
    if (checkCredentials(username, password)) {
      setError("");
      setLoggedIn(remember);
      sounds.success();
      onSuccess();
    } else {
      setError("Hatalı kullanıcı adı veya şifre.");
      sounds.wrong();
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  return (
    <div className={`login-card ${shake ? "shake" : ""}`}>
      <div className="brand">
        <div className="brand-mascot" aria-hidden>
          🚀
        </div>
        <h1>Doğukan&apos;ın Dünyası</h1>
        <p>Okuma · Sayılar · Şekiller · Bilim · Oyunlar</p>
        <p className="login-stat">
          <strong>{TOTAL_ACTIVITIES}</strong> eğlenceli aktivite seni bekliyor!
        </p>
      </div>

      <label className="field">
        <span>Kullanıcı adı</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="Kullanıcı adın"
          autoComplete="username"
        />
      </label>
      <label className="field">
        <span>Şifre</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && login()}
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </label>
      <label className="remember">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        Oturumu açık tut
      </label>
      <button type="button" className="btn-primary" onClick={login}>
        Giriş yap 🎉
      </button>
      {error && (
        <p className="error-msg" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
