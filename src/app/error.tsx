"use client"; // Hata sınırları istemci bileşeni olmalı (error.md)

import { useEffect } from "react";
import { ErrorCard } from "@/components/errors/ErrorCard";
import { retry, type RouteErrorProps } from "@/components/errors/retry";
import { recordError } from "@/lib/errors";

export default function RouteError(props: RouteErrorProps) {
  const { error } = props;

  useEffect(() => {
    recordError(null, error);
  }, [error]);

  return (
    <main className="err-page">
      <ErrorCard title="Burası biraz yoruldu 😴" say="Burası biraz yoruldu. Tekrar deneyelim mi?" onRetry={() => retry(props)} />
    </main>
  );
}
