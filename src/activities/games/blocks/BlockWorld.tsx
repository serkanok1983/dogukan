"use client";

import "./blocks.css";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { getPlayerId, type PlayerId } from "@/lib/auth";
import { useGameActive, useGameBoot } from "@/lib/gameSession";
import { haptic } from "@/lib/haptics";
import { trackEvent } from "@/lib/progress/events";
import { sounds } from "@/lib/sounds";
import { speak } from "@/lib/speech";
import { bearPoseAt, nextStep, type Dir } from "./bear";
import {
  BLOCK_NAMES,
  GRID_H,
  GRID_W,
  SOLID_KINDS,
  canUndo,
  createHistory,
  decodeGrid,
  encodeGrid,
  paintLine,
  pushHistory,
  replacePresent,
  starterGrid,
  undoHistory,
  type BlockKind,
  type History,
  type SolidKind,
} from "./engine";
import { sendToGallery } from "./gallery";
import { drawScene, makeThumbnail, paintChip } from "./render";
import {
  SLOT_COUNT,
  defaultWorldName,
  firstFreeSlot,
  getSave,
  listSaves,
  saveWorld,
  type BlockSave,
} from "./storage";

// ---- Ayarlar ----

const IDLE_MS = 2000; // ayı ancak bu kadar dokunulmadıktan sonra yürür
const STEP_MS = 420;
const REST_MIN_MS = 2200;
const REST_RANGE_MS = 2600;
const MIN_CELL = 18;
const MAX_CELL = 48;
const SOUND_GAP_MS = 70;

const CHIP_EMOJI: Readonly<Record<SolidKind, string>> = {
  1: "🌿",
  2: "🟫",
  3: "🪨",
  4: "🪵",
  5: "🪟",
  6: "💧",
  7: "🌸",
  8: "🍯",
};

// ---- Değişken (React dışı) dünya durumu ----

type Stroke = { pointerId: number; x: number; y: number; pushed: boolean };
type Walker = {
  from: number;
  to: number;
  dir: Dir;
  stepStart: number;
  stepping: boolean;
  stepsLeft: number;
};
type World = {
  hist: History;
  walker: Walker;
  cellDev: number;
  stroke: Stroke | null;
  lastInputAt: number;
  lastSoundAt: number;
  drawRaf: number;
};

function ensureWorld(ref: RefObject<World | null>): World {
  if (!ref.current) {
    ref.current = {
      hist: createHistory(starterGrid()),
      walker: {
        from: 2,
        to: 2,
        dir: 1,
        stepStart: 0,
        stepping: false,
        stepsLeft: 0,
      },
      cellDev: 0,
      stroke: null,
      lastInputAt: 0,
      lastSoundAt: 0,
      drawRaf: 0,
    };
  }
  return ref.current;
}

function drawWorld(canvas: HTMLCanvasElement | null, w: World, now: number): void {
  if (!canvas || w.cellDev <= 0) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const k = w.walker;
  const p = k.stepping ? (now - k.stepStart) / STEP_MS : 0;
  const pose = bearPoseAt(w.hist.present, k.from, k.stepping ? k.to : k.from, p);
  drawScene(ctx, w.hist.present, w.cellDev, { ...pose, facing: k.dir });
}

/** Değişiklikten sonra tek kare çizim (aynı karede birden çok istek birleşir). */
function requestDraw(canvas: HTMLCanvasElement | null, w: World): void {
  if (w.drawRaf || !canvas) return;
  w.drawRaf = requestAnimationFrame((now) => {
    w.drawRaf = 0;
    drawWorld(canvas, w, now);
  });
}

function computeCell(stage: HTMLElement, controls: HTMLElement | null): number {
  const byW = Math.floor(stage.clientWidth / GRID_W);
  const vh = window.visualViewport?.height ?? window.innerHeight;
  const top = stage.getBoundingClientRect().top + window.scrollY;
  const below = (controls?.offsetHeight ?? 210) + 28;
  const byH = Math.max(MIN_CELL, Math.floor((vh - top - below) / GRID_H));
  return Math.max(8, Math.min(MAX_CELL, byW, byH));
}

function subscribeVisibility(cb: () => void): () => void {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
}
const isDocVisible = () => document.visibilityState !== "hidden";
const alwaysVisible = () => true;

let introSpoken = false;
function speakIntroOnce(): void {
  if (introSpoken) return;
  introSpoken = true;
  speak("Bir blok seç, sonra dokun!");
}

/** Yalnızca olay işleyicilerinden ve efektlerden çağrılır. */
function monoNow(): number {
  return performance.now();
}
function wallNow(): number {
  return Date.now();
}
function markInput(w: World): void {
  w.lastInputAt = monoNow();
}
function moveStroke(s: Stroke, x: number, y: number): void {
  s.x = x;
  s.y = y;
}

function currentPlayer(): PlayerId {
  return getPlayerId() ?? "dogukan";
}

type DrawerMode = "browse" | "save" | "share";
type Status = { text: string; n: number };

// ---- Bileşen ----

export function BlockWorld() {
  const active = useGameActive();
  const docVisible = useSyncExternalStore(
    subscribeVisibility,
    isDocVisible,
    alwaysVisible,
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<World | null>(null);

  const [tool, setTool] = useState<BlockKind>(1);
  const [undoDepth, setUndoDepth] = useState(0);
  const [drawer, setDrawer] = useState<DrawerMode | null>(null);
  const [saves, setSaves] = useState<BlockSave[]>([]);
  const [slot, setSlot] = useState<number | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [onScreen, setOnScreen] = useState(true);

  useGameBoot(speakIntroOnce);

  // Tuvali ekrana sığdır (hücre = tamsayı css px, arka tampon × min(DPR, 2)).
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const controls = controlsRef.current;
    if (!canvas || !stage) return;
    const w = ensureWorld(worldRef);
    const fit = () => {
      const css = computeCell(stage, controls);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const dev = Math.max(1, Math.round(css * dpr));
      if (canvas.width !== dev * GRID_W || canvas.height !== dev * GRID_H) {
        canvas.width = dev * GRID_W;
        canvas.height = dev * GRID_H;
      }
      const cssW = `${css * GRID_W}px`;
      const cssH = `${css * GRID_H}px`;
      if (canvas.style.width !== cssW) canvas.style.width = cssW;
      if (canvas.style.height !== cssH) canvas.style.height = cssH;
      if (w.cellDev !== dev) w.cellDev = dev;
      drawWorld(canvas, w, performance.now());
    };
    fit();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(fit) : null;
    ro?.observe(stage);
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
      if (w.drawRaf) cancelAnimationFrame(w.drawRaf);
      w.drawRaf = 0;
    };
  }, []);

  // Tuval görünür mü (aşağı kaydırılınca ayı dinlenir).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last) setOnScreen(last.isIntersecting);
    });
    io.observe(canvas);
    return () => io.disconnect();
  }, []);

  // Durum balonu kendiliğinden kaybolur.
  useEffect(() => {
    if (!status) return;
    const t = window.setTimeout(() => setStatus(null), 2600);
    return () => window.clearTimeout(t);
  }, [status]);

  // Yürüyen ayı: yalnızca oyun etkin + sayfa görünür + çocuk 2 sn boştayken.
  // Dinlenirken rAF yok; yalnızca adım sürerken kare çizilir.
  const canWalk = active && docVisible && onScreen && drawer === null;
  useEffect(() => {
    if (!canWalk) return;
    const canvas = canvasRef.current;
    const w = ensureWorld(worldRef);
    let raf = 0;
    let timer = 0;

    const idleFor = (now: number) => now - w.lastInputAt;
    const beginStep = (now: number) => {
      const k = w.walker;
      const step = nextStep(w.hist.present, k.from, k.dir);
      if (!step) return false;
      k.to = step.col;
      k.dir = step.dir;
      k.stepStart = now;
      k.stepping = true;
      return true;
    };
    const rest = (ms: number) => {
      timer = window.setTimeout(wake, ms);
    };
    const frame = (now: number) => {
      const k = w.walker;
      if (now - k.stepStart >= STEP_MS) {
        k.from = k.to;
        k.stepping = false;
        k.stepsLeft--;
        if (k.stepsLeft <= 0 || idleFor(now) < IDLE_MS || !beginStep(now)) {
          raf = 0;
          drawWorld(canvas, w, now);
          rest(REST_MIN_MS + Math.random() * REST_RANGE_MS);
          return;
        }
      }
      drawWorld(canvas, w, now);
      raf = requestAnimationFrame(frame);
    };
    function wake() {
      const now = performance.now();
      const idle = idleFor(now);
      if (idle < IDLE_MS) {
        rest(IDLE_MS - idle + 50);
        return;
      }
      const k = w.walker;
      if (Math.random() < 0.3) k.dir = k.dir === 1 ? -1 : 1;
      k.stepsLeft = 2 + Math.floor(Math.random() * 4);
      if (!beginStep(now)) {
        rest(REST_MIN_MS * 2);
        return;
      }
      raf = requestAnimationFrame(frame);
    }

    rest(IDLE_MS);
    return () => {
      window.clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
      const k = w.walker;
      if (k.stepping) {
        k.from = k.to;
        k.stepping = false;
      }
      requestDraw(canvas, w);
    };
  }, [canWalk]);

  // ---- Yardımcılar (yalnızca olay işleyicilerinden çağrılır) ----

  const flash = (text: string, say: string) => {
    setStatus((prev) => ({ text, n: (prev?.n ?? 0) + 1 }));
    speak(say);
  };

  const commit = (w: World, next: History) => {
    w.hist = next;
    setUndoDepth(next.past.length);
    requestDraw(canvasRef.current, w);
  };

  const cellFromEvent = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_W);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_H);
    return {
      x: Math.min(GRID_W - 1, Math.max(0, x)),
      y: Math.min(GRID_H - 1, Math.max(0, y)),
    };
  };

  /** Çizgiyi boyar; vuruşun ilk değişikliği yeni bir geri alma adımı açar. */
  const paint = (
    w: World,
    s: Stroke,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ) => {
    const before = w.hist.present;
    const next = paintLine(before, x0, y0, x1, y1, tool);
    if (next === before) return false;
    commit(w, s.pushed ? replacePresent(w.hist, next) : pushHistory(w.hist, next));
    s.pushed = true;
    const now = monoNow();
    if (now - w.lastSoundAt > SOUND_GAP_MS) {
      w.lastSoundAt = now;
      if (tool === 0) sounds.tap();
      else sounds.pop();
    }
    return true;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!active || drawer !== null) return;
    const w = ensureWorld(worldRef);
    if (w.stroke) return; // ikinci parmak yok sayılır
    const cell = cellFromEvent(e);
    if (!cell) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* yakalama desteklenmiyor */
    }
    markInput(w);
    const stroke: Stroke = {
      pointerId: e.pointerId,
      x: cell.x,
      y: cell.y,
      pushed: false,
    };
    w.stroke = stroke;
    if (paint(w, stroke, cell.x, cell.y, cell.x, cell.y) && tool !== 0)
      haptic("tick");
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const w = worldRef.current;
    const s = w?.stroke;
    if (!w || !s || s.pointerId !== e.pointerId) return;
    if (!active) {
      w.stroke = null;
      return;
    }
    const cell = cellFromEvent(e);
    if (!cell || (cell.x === s.x && cell.y === s.y)) return;
    markInput(w);
    paint(w, s, s.x, s.y, cell.x, cell.y);
    moveStroke(s, cell.x, cell.y);
  };

  const endStroke = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const w = worldRef.current;
    if (!w || w.stroke?.pointerId !== e.pointerId) return;
    w.stroke = null;
    markInput(w);
  };

  const noteInput = () => {
    markInput(ensureWorld(worldRef));
  };

  const pickTool = (k: BlockKind) => {
    noteInput();
    setTool(k);
    sounds.tap();
    speak(k === 0 ? "Silgi" : BLOCK_NAMES[k]);
  };

  const undo = () => {
    const w = ensureWorld(worldRef);
    w.stroke = null;
    markInput(w);
    if (!canUndo(w.hist)) return;
    commit(w, undoHistory(w.hist));
    sounds.tap();
  };

  /** Yuvaya yazar ve olayı yayar. Paylaşımda yalnızca `shared: true` olayı gider. */
  const writeSlot = (index: number, share: boolean): BlockSave => {
    const w = ensureWorld(worldRef);
    const player = currentPlayer();
    const grid = w.hist.present;
    const prev = getSave(player, index);
    const now = wallNow();
    const save: BlockSave = {
      index,
      name: prev?.name ?? defaultWorldName(index),
      cells: encodeGrid(grid),
      thumb: makeThumbnail(grid),
      savedAt: now,
    };
    const sharedAt = share ? now : prev?.sharedAt;
    if (typeof sharedAt === "number") save.sharedAt = sharedAt;
    setSaves(saveWorld(player, save));
    setSlot(index);
    trackEvent({ type: "blocks_saved", index, shared: share });
    if (share) void sendToGallery(player, save);
    return save;
  };

  const doSave = (index: number) => {
    const s = writeSlot(index, false);
    sounds.success();
    flash(`💾 ${s.name} kaydedildi!`, `${s.name} kaydedildi!`);
  };

  const doShare = (index: number) => {
    writeSlot(index, true);
    sounds.sticker();
    haptic("win");
    flash("📸 Babana gösterildi!", "Babana gösterdim! Çok güzel olmuş.");
  };

  const openDrawer = (mode: DrawerMode) => {
    setSaves(listSaves(currentPlayer()));
    setDrawer(mode);
    sounds.tap();
    speak(mode === "browse" ? "Dünyaların" : "Hangi yuvaya kaydedelim?");
  };

  const onQuickSave = () => {
    noteInput();
    const target = slot ?? firstFreeSlot(currentPlayer());
    if (target === null) openDrawer("save");
    else doSave(target);
  };

  const onShare = () => {
    noteInput();
    const target = slot ?? firstFreeSlot(currentPlayer());
    if (target === null) openDrawer("share");
    else doShare(target);
  };

  const onSlotSave = (index: number) => {
    const mode = drawer;
    setDrawer(null);
    if (mode === "share") doShare(index);
    else doSave(index);
  };

  const onSlotLoad = (save: BlockSave) => {
    const grid = decodeGrid(save.cells);
    if (!grid) {
      sounds.softWrong();
      return;
    }
    const w = ensureWorld(worldRef);
    w.stroke = null;
    markInput(w);
    commit(w, pushHistory(w.hist, grid));
    setSlot(save.index);
    setDrawer(null);
    sounds.pop();
    speak(`${save.name} açıldı`);
  };

  const onNewWorld = () => {
    const w = ensureWorld(worldRef);
    w.stroke = null;
    markInput(w);
    commit(w, pushHistory(w.hist, starterGrid()));
    setSlot(null);
    setDrawer(null);
    sounds.pop();
    speak("Yeni dünya!");
  };

  const closeDrawer = () => {
    noteInput();
    setDrawer(null);
    sounds.tap();
  };

  const tools: BlockKind[] = [...SOLID_KINDS, 0];
  const slotLabel = slot === null ? null : defaultWorldName(slot);
  const savesBySlot = new Map(saves.map((s) => [s.index, s]));

  return (
    <div className="game-panel blk-panel">
      <div className="blk-stage" ref={stageRef}>
        <div className="blk-frame">
          <canvas
            ref={canvasRef}
            className="blk-canvas"
            role="img"
            aria-label="Blok dünyası. Dokun ve blok koy, sürükle ve boya."
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
            onLostPointerCapture={endStroke}
            onContextMenu={(e) => e.preventDefault()}
          />
          {slotLabel && (
            <span className="blk-slot-tag">
              {savesBySlot.get(slot ?? -1)?.name ?? slotLabel}
            </span>
          )}
          <p className="blk-status" aria-live="polite">
            {status && (
              <span key={status.n} className="blk-status-bubble">
                {status.text}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="blk-controls" ref={controlsRef}>
        <div className="blk-palette" role="toolbar" aria-label="Bloklar">
          {tools.map((k) => (
            <button
              key={k}
              type="button"
              className={`blk-chip${k === 0 ? " blk-chip--eraser" : ""}`}
              aria-pressed={tool === k}
              aria-label={k === 0 ? "Silgi" : BLOCK_NAMES[k]}
              onClick={() => pickTool(k)}
            >
              {k === 0 ? (
                <span className="blk-chip-x" aria-hidden>
                  ✖
                </span>
              ) : (
                <>
                  <canvas
                    className="blk-chip-tile"
                    width={80}
                    height={80}
                    aria-hidden
                    ref={(el) => {
                      if (el) paintChip(el, k);
                    }}
                  />
                  <span className="blk-chip-emoji" aria-hidden>
                    {CHIP_EMOJI[k]}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="blk-toolbar">
          <button
            type="button"
            className="blk-btn blk-btn--undo"
            onClick={undo}
            disabled={undoDepth === 0}
            aria-label="Geri al"
          >
            <span aria-hidden>↶</span>
          </button>
          <button
            type="button"
            className="blk-btn"
            onClick={onQuickSave}
            aria-label="Kaydet"
          >
            <span aria-hidden>💾</span>
          </button>
          <button
            type="button"
            className="blk-btn"
            onClick={() => openDrawer("browse")}
            aria-label="Dünyalarım"
          >
            <span aria-hidden>🗂️</span>
          </button>
          <button type="button" className="blk-btn blk-btn--share" onClick={onShare}>
            <span aria-hidden>📸</span> Babaya göster
          </button>
        </div>
      </div>

      {drawer !== null && (
        <div
          className="blk-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Dünyalarım"
        >
          <div className="blk-drawer-head">
            <h2 className="blk-drawer-title">
              {drawer === "browse"
                ? "🗂️ Dünyalarım"
                : drawer === "share"
                  ? "📸 Hangi yuva?"
                  : "💾 Hangi yuva?"}
            </h2>
            <button
              type="button"
              className="blk-btn blk-btn--close"
              onClick={closeDrawer}
              aria-label="Kapat"
            >
              <span aria-hidden>✖</span>
            </button>
          </div>
          <ul className="blk-slots">
            {Array.from({ length: SLOT_COUNT }, (_, i) => {
              const save = savesBySlot.get(i);
              const name = save?.name ?? defaultWorldName(i);
              return (
                <li key={i} className={`blk-slot${slot === i ? " is-current" : ""}`}>
                  {save?.thumb ? (
                    <div
                      className="blk-thumb"
                      role="img"
                      aria-label={name}
                      style={{ backgroundImage: `url("${save.thumb}")` }}
                    />
                  ) : (
                    <div className="blk-thumb blk-thumb--empty" aria-hidden>
                      {save ? "🧱" : "＋"}
                    </div>
                  )}
                  <div className="blk-slot-info">
                    <span className="blk-slot-name">{name}</span>
                    {save?.sharedAt != null && (
                      <span className="blk-slot-shared">📸 Babada</span>
                    )}
                  </div>
                  <div className="blk-slot-actions">
                    {save && drawer === "browse" && (
                      <button
                        type="button"
                        className="blk-btn blk-btn--slot"
                        onClick={() => onSlotLoad(save)}
                        aria-label={`${name} aç`}
                      >
                        <span aria-hidden>📂</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="blk-btn blk-btn--slot"
                      onClick={() => onSlotSave(i)}
                      aria-label={`${name} yuvasına kaydet`}
                    >
                      <span aria-hidden>{drawer === "share" ? "📸" : "💾"}</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {drawer === "browse" && (
            <button
              type="button"
              className="blk-btn blk-btn--new"
              onClick={onNewWorld}
            >
              <span aria-hidden>✨</span> Yeni dünya
            </button>
          )}
        </div>
      )}
    </div>
  );
}
