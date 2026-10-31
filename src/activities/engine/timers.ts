/** Bileşen ömrüne bağlı zamanlayıcılar; `clear` hepsini iptal eder. */
export type Timers = {
  later(fn: () => void, ms: number): void;
  clear(): void;
};

export function createTimers(): Timers {
  const ids = new Set<ReturnType<typeof setTimeout>>();
  return {
    later(fn, ms) {
      const id = setTimeout(() => {
        ids.delete(id);
        fn();
      }, ms);
      ids.add(id);
    },
    clear() {
      for (const id of ids) clearTimeout(id);
      ids.clear();
    },
  };
}
