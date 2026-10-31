"use client"; // Hata sınırları istemci bileşeni olmalı (error.md)

import { useParams } from "next/navigation";
import { useEffect } from "react";
import { ErrorCard } from "@/components/errors/ErrorCard";
import { retry, type RouteErrorProps } from "@/components/errors/retry";
import { recordError } from "@/lib/errors";

/** Etkinlik kabuğunun kendisi çökerse (oyun hataları GameErrorBoundary'de kalır). */
export default function ActivityError(props: RouteErrorProps) {
  const { error } = props;
  const params = useParams<{ slug: string }>();
  const slug = typeof params?.slug === "string" ? params.slug : null;

  useEffect(() => {
    recordError(slug, error);
  }, [slug, error]);

  return (
    <main className="err-page">
      <ErrorCard title="Oyun biraz yoruldu 😴" say="Oyun biraz yoruldu. Tekrar deneyelim mi?" onRetry={() => retry(props)} />
    </main>
  );
}
