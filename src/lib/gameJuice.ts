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

  return {
    burst(x: number, y: number, color = "#5eead4", count = 14, speed = 4) {
      for (let i = 0; i < count; i++) {
        const a = ((Math.PI * 2 * i) / count) + Math.random() * 0.4;
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
    update() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life -= 1;
        if (p.life <= 0) particles.splice(i, 1);
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i];
        f.y += f.vy;
        f.life -= 1;
        if (f.life <= 0) floats.splice(i, 1);
      }
      if (shake > 0.2) shake *= 0.86;
      else shake = 0;
      if (flash > 0) flash *= 0.88;
    },
    applyTransform(ctx: CanvasRenderingContext2D) {
      if (shake > 0.2) {
        ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
      }
    },
    draw(ctx: CanvasRenderingContext2D, w: number, h: number) {
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
        ctx.font = "bold 18px var(--font-nunito), system-ui, sans-serif";
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
      this.draw(ctx, w, h);
    },
  };
}

export type GameJuice = ReturnType<typeof createGameJuice>;
