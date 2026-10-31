"use client";

import { useSyncExternalStore } from "react";
import { getServerProgress, readProgressSnapshot, subscribeProgress } from "@/lib/progress/store";
import type { Progress } from "@/lib/progress/types";

// --- Doğukan'ın ilerlemesi (salt okunur; çocuk oturumu açık olmasa da) ---------

let version = 0;
let cache: { v: number; p: Progress } | null = null;

function subscribeChild(cb: () => void): () => void {
  const bump = () => {
    version++;
    cb();
  };
  const events = ["dogukan:progress", "dogukan:session", "storage"] as const;
  for (const e of events) window.addEventListener(e, bump);
  const off = subscribeProgress(bump);
  return () => {
    for (const e of events) window.removeEventListener(e, bump);
    off();
  };
}

function getChildSnapshot(): Progress {
  if (!cache || cache.v !== version) cache = { v: version, p: readProgressSnapshot("dogukan") };
  return cache.p;
}

export function useChildProgress(): Progress {
  return useSyncExternalStore(subscribeChild, getChildSnapshot, getServerProgress);
}

// --- dakika hassasiyetinde "şimdi" (render içinde Date.now() çağırmamak için) --------

let now = 0;
const NOW_STEP_MS = 30_000;

function subscribeNow(cb: () => void): () => void {
  const id = setInterval(() => {
    now = Date.now();
    cb();
  }, NOW_STEP_MS);
  return () => clearInterval(id);
}

function getNow(): number {
  if (!now) now = Date.now();
  return now;
}

function getServerNow(): number {
  return 0;
}

export function useNow(): number {
  return useSyncExternalStore(subscribeNow, getNow, getServerNow);
}
