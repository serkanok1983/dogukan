/**
 * Olay veriyolu (CONTRACT §3.3). DONDURULMUŞ API.
 * Her yazma bir olaydır: damgalanır, reducer'dan geçer, sonra dinleyicilere gider.
 */
import { _applyEvent } from "./store";
import type { Progress, ProgressEvent, ProgressEventInput, ProgressEventType } from "./types";

type Listener = (e: ProgressEvent, next: Progress) => void;

const byType = new Map<ProgressEventType | "*", Set<Listener>>();
let counter = 0;

function newId(): string {
  const c = typeof crypto !== "undefined" ? crypto : undefined;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  counter = (counter + 1) % 1_000_000;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function trackEvent(input: ProgressEventInput): ProgressEvent {
  const e = { ...input, id: newId(), at: Date.now() } as ProgressEvent;
  if (typeof window === "undefined") return e;
  let next: Progress | null = null;
  try {
    next = _applyEvent(e);
  } catch (err) {
    console.warn("trackEvent", err);
    return e;
  }
  if (!next) return e;
  try {
    window.dispatchEvent(new CustomEvent("dogukan:progress", { detail: { type: e.type } }));
  } catch {
    /* yok say */
  }
  const targets = [...(byType.get(e.type) ?? []), ...(byType.get("*") ?? [])];
  for (const cb of targets) {
    try {
      cb(e, next);
    } catch (err) {
      console.warn(`onEvent(${e.type})`, err);
    }
  }
  return e;
}

export function onEvent<T extends ProgressEventType>(
  type: T | "*",
  cb: (e: Extract<ProgressEvent, { type: T }>, next: Progress) => void,
): () => void {
  let set = byType.get(type);
  if (!set) {
    set = new Set();
    byType.set(type, set);
  }
  const listener = cb as Listener;
  set.add(listener);
  return () => {
    set.delete(listener);
  };
}
