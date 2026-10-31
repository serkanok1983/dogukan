"use client"; // Hata sınırları istemci bileşeni olmalı (error.md)

import Link from "next/link";
import { useEffect } from "react";
import { SayButton } from "@/components/SayButton";
import { retry, type RouteErrorProps } from "@/components/errors/retry";
import { recordError } from "@/lib/errors";

const SAY = "Uygulama biraz yoruldu. Tekrar deneyelim mi?";

/**
 * Kök düzen çökerse çizilir; kendi <html>/<body> etiketlerini ve satır içi
 * stillerini taşır (globals.css yüklenmemiş olabilir). Metadata dışa aktaramaz.
 */
const page: React.CSSProperties = {
  margin: 0,
  minHeight: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 24,
  boxSizing: "border-box",
  background: "linear-gradient(165deg, #74ebd5 0%, #9face6 40%, #fecfef 100%)",
  fontFamily: "system-ui, sans-serif",
  color: "#173f5f",
};

const card: React.CSSProperties = {
  width: "min(420px, 100%)",
  padding: "28px 22px",
  textAlign: "center",
  background: "#fff",
  borderRadius: 28,
  boxShadow: "0 16px 48px rgba(30, 64, 120, 0.2)",
};

const button: React.CSSProperties = {
  display: "block",
  width: "100%",
  minHeight: 72,
  marginTop: 14,
  border: "none",
  borderRadius: 999,
  fontSize: 24,
  fontWeight: 800,
  cursor: "pointer",
  textDecoration: "none",
  lineHeight: "72px",
  padding: 0,
};

export default function GlobalError(props: RouteErrorProps) {
  const { error } = props;

  useEffect(() => {
    recordError(null, error);
  }, [error]);

  return (
    <html lang="tr">
      <body style={page}>
        <title>Doğukan&apos;ın Yeri</title>
        <div style={card} role="alert">
          <div style={{ fontSize: 72, lineHeight: 1 }} aria-hidden>
            🐻
          </div>
          <h1 style={{ fontSize: 28, margin: "12px 0 6px" }}>
            Uygulama biraz yoruldu 😴
          </h1>
          <SayButton text={SAY} />
          <button
            type="button"
            style={{ ...button, color: "#fff", background: "#ff6b9d" }}
            onClick={() => retry(props)}
          >
            Tekrar dene 🔁
          </button>
          <Link
            href="/"
            style={{ ...button, color: "#173f5f", background: "#e0f2fe" }}
          >
            Haritaya dön 🗺️
          </Link>
        </div>
      </body>
    </html>
  );
}
