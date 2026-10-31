import { act, render } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  GameSessionProvider,
  useGameActive,
  useGamePauseControl,
  useGamePaused,
  useGameRestart,
  useHasRestart,
  useRegisterRestart,
  useRestartRegistry,
  type RestartRegistry,
} from "@/lib/gameSession";

type Snapshot = {
  active: boolean;
  paused: boolean;
  has: boolean;
  ctl: ReturnType<typeof useGamePauseControl>;
  register: ReturnType<typeof useGameRestart>["registerRestart"];
};

/** Kanca değerlerini her commit'ten sonra dışarı bildirir. */
function Probe({ onValue }: { onValue: (s: Snapshot) => void }) {
  const active = useGameActive();
  const paused = useGamePaused();
  const has = useHasRestart();
  const ctl = useGamePauseControl();
  const { registerRestart } = useGameRestart();
  useEffect(() => {
    onValue({ active, paused, has, ctl, register: registerRestart });
  });
  return null;
}

function Shell({
  active,
  onValue,
  onRegistry,
  children,
}: {
  active: boolean;
  onValue: (s: Snapshot) => void;
  onRegistry?: (r: RestartRegistry) => void;
  children?: React.ReactNode;
}) {
  const registry = useRestartRegistry();
  useEffect(() => {
    onRegistry?.(registry);
  });
  return (
    <GameSessionProvider active={active} registry={registry}>
      <Probe onValue={onValue} />
      {children}
    </GameSessionProvider>
  );
}

function capture() {
  const box: { s?: Snapshot; reg?: RestartRegistry } = {};
  return {
    box,
    onValue: (s: Snapshot) => {
      box.s = s;
    },
    onRegistry: (r: RestartRegistry) => {
      box.reg = r;
    },
  };
}

describe("gameSession: duraklatma", () => {
  it("pause() useGameActive()'i false yapar, resume() geri açar", () => {
    const { box, onValue } = capture();
    render(<Shell active onValue={onValue} />);
    expect(box.s!.active).toBe(true);
    expect(box.s!.paused).toBe(false);

    act(() => box.s!.ctl.pause());
    expect(box.s!.paused).toBe(true);
    expect(box.s!.active).toBe(false);

    act(() => box.s!.ctl.resume());
    expect(box.s!.active).toBe(true);
  });

  it("active prop false iken duraklatılmamış olsa da aktif değildir", () => {
    const { box, onValue } = capture();
    render(<Shell active={false} onValue={onValue} />);
    expect(box.s!.active).toBe(false);
    expect(box.s!.paused).toBe(false);
  });

  it("belge gizlenince kendiliğinden duraklar", () => {
    const { box, onValue } = capture();
    render(<Shell active onValue={onValue} />);
    const vis = vi
      .spyOn(document, "visibilityState", "get")
      .mockReturnValue("hidden");
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(box.s!.paused).toBe(true);
    expect(box.s!.active).toBe(false);
    vis.mockRestore();
  });

  it("sağlayıcı dışında varsayılan: aktif, duraklatılmamış, kayıt yok", () => {
    const { box, onValue } = capture();
    render(<Probe onValue={onValue} />);
    expect(box.s!.active).toBe(true);
    expect(box.s!.paused).toBe(false);
    expect(box.s!.has).toBe(false);
    expect(typeof box.s!.register(() => {})).toBe("function");
  });
});

describe("gameSession: yeniden başlatma kaydı", () => {
  it("registerRestart useHasRestart'ı açar, kaldırma kapatır, restart kayıtlı fonksiyonu çağırır", () => {
    const { box, onValue, onRegistry } = capture();
    render(<Shell active onValue={onValue} onRegistry={onRegistry} />);
    expect(box.s!.has).toBe(false);
    expect(box.reg!.has).toBe(false);

    const fn = vi.fn();
    let unregister = () => {};
    act(() => {
      unregister = box.s!.register(fn);
    });
    expect(box.s!.has).toBe(true);
    expect(box.reg!.has).toBe(true);

    act(() => box.reg!.restart());
    expect(fn).toHaveBeenCalledTimes(1);

    act(() => unregister());
    expect(box.s!.has).toBe(false);
    act(() => box.reg!.restart());
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("useRegisterRestart her zaman en güncel fonksiyonu çağırır ve unmount'ta kaydı siler", () => {
    const { box, onValue, onRegistry } = capture();
    const calls: string[] = [];
    function Game({ tag }: { tag: string }) {
      useRegisterRestart(() => calls.push(tag));
      return null;
    }
    const { rerender } = render(
      <Shell active onValue={onValue} onRegistry={onRegistry}>
        <Game tag="a" />
      </Shell>,
    );
    expect(box.s!.has).toBe(true);
    rerender(
      <Shell active onValue={onValue} onRegistry={onRegistry}>
        <Game tag="b" />
      </Shell>,
    );
    act(() => box.reg!.restart());
    expect(calls).toEqual(["b"]);

    rerender(<Shell active onValue={onValue} onRegistry={onRegistry} />);
    expect(box.s!.has).toBe(false);
  });
});
