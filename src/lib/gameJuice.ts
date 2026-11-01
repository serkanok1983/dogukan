import { canvasFont } from "./canvasFont";
import { haptic, type HapticKind } from "./haptics";

/** Skor baloncuklarının yazı tipi (ctx.font CSS değişkenini kendisi çözemez). */
export const POP_FONT = "bold 18px var(--font-nunito), system-ui, sans-serif";

export type JuiceParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
};

export type JuiceFloat = {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  vy: number;
};

export function createGameJuice() {
  const particles: JuiceParticle[] = [];
  const floats: JuiceFloat[] = [];
  let shake = 0;
  let flash = 0;
  /** wrapDraw sahneyi zaten kaydırdıysa draw ikinci kez kaydırmaz. */
  let shakeApplied = false;
  let scratch: HTMLCanvasElement | null = null;

  /**
   * Sarsıntıyı çizilmiş kareye uygular: kare bir ara tuvale kopyalanır,
   * temizlenir ve kaydırılarak geri çizilir. Böylece `applyTransform`
   * çağırmayan oyunlarda da `shakeScreen()` görünür olur.
   */
  function blitShake(ctx: CanvasRenderingContext2D) {
    const canvas = ctx.canvas as HTMLCanvasElement | undefined;
    if (
      !canvas ||
      typeof document === "undefined" ||
      !canvas.width ||
      !canvas.height
    )
      return;
    if (!scratch) scratch = document.createElement("canvas");
    if (scratch.width !== canvas.width) scratch.width = canvas.width;
    if (scratch.height !== canvas.height) scratch.height = canvas.height;
    const sctx = scratch.getContext("2d");
    if (!sctx) return;
    const t = ctx.getTransform();
    const dx = (Math.random() - 0.5) * shake * t.a;
    const dy = (Math.random() - 0.5) * shake * t.d;
    sctx.clearRect(0, 0, scratch.width, scratch.height);
    sctx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(scratch, Math.round(dx), Math.round(dy));
    ctx.restore();
  }

  return {
    burst(x: number, y: number, color = "#5eead4", count = 14, speed = 4) {
      for (let i = 0; i < count; i++) {
        const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
        const v = speed * (0.5 + Math.random());
        particles.push({
          x,
          y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v,
          life: 28 + Math.random() * 18,
          color,
          size: 2 + Math.random() * 3,
        });
      }
    },
    popScore(x: number, y: number, text: string, color = "#fbbf24") {
      floats.push({ x, y, text, color, life: 48, vy: -1.2 });
    },
    shakeScreen(amount = 6) {
      shake = Math.min(18, shake + amount);
    },
    flashScreen(alpha = 0.25) {
      flash = Math.max(flash, alpha);
    },
    /** Titreşim (yalnızca olay anında; kare başına çağırma). */
    haptic(kind: HapticKind) {
      haptic(kind);
    },
    /** `dt` 60 Hz birimindedir (useGameLoop); verilmezse kare başına 1. */
    update(dt = 1) {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.12 * dt;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        f.y += f.vy * dt;
        f.life -= dt;
        if (f.life <= 0) floats.splice(i, 1);
      }
      if (shake > 0.2) shake *= Math.pow(0.86, dt);
      else shake = 0;
      if (flash > 0) flash *= Math.pow(0.88, dt);
    },
    applyTransform(ctx: CanvasRenderingContext2D) {
      if (shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }
    },
    draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
      if (shake > 0.2 && !shakeApplied) blitShake(ctx);
      shakeApplied = false;
      if (flash > 0.02) {
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${flash})`;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
      }
      for (const p of particles) {
        ctx.globalAlpha = Math.min(1, p.life / 30);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const f of floats) {
        ctx.globalAlpha = Math.min(1, f.life / 40);
        ctx.fillStyle = f.color;
        ctx.font = canvasFont(POP_FONT);
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;
    },
    wrapDraw(ctx: CanvasRenderingContext2D, w: number, h: number, fn: () => void) {
      ctx.save();
      this.applyTransform(ctx);
      fn();
      ctx.restore();
      this.update();
      shakeApplied = true;
      this.draw(ctx, w, h);
    },
  };
}

export type GameJuice = ReturnType<typeof createGameJuice>;
