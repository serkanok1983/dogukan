/**
 * Android/Chrome `beforeinstallprompt` olayını saklar; InstallCard (yalnızca
 * ebeveyn yüzeyinde) bunu tetikler. Olay sayfa ömründe bir kez gelir, bu
 * yüzden dinleyici modül yüklenir yüklenmez bağlanır (PwaRegister içe aktarır).
 */
type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const cb of listeners) cb();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit();
  });
}

export function subscribeInstallPrompt(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function canPromptInstall(): boolean {
  return deferred !== null;
}

/** Kurulum penceresini açar. Kabul edilirse `true`. Asla fırlatmaz. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  deferred = null;
  emit();
  try {
    await event.prompt();
    const choice = await event.userChoice;
    return choice.outcome === "accepted";
  } catch {
    return false;
  }
}
