/**
 * Blok Dünyası çizimi. Tüm koordinatlar cihaz pikseli; hücre boyu tamsayıdır,
 * böylece karolar keskin kalır. Karolar görsel dosya olmadan, tuval
 * ilkelleriyle çizilir ve bir atlas yüzeyinde (OffscreenCanvas ya da DOM'a
 * eklenmemiş <canvas>) önbelleğe alınır.
 *
 * jsdom'da `getContext` null döner; her giriş noktası bunu sessizce tolere eder.
 */
import { GRID_H, GRID_W, SOLID_KINDS, type BlockKind, type Grid } from "./engine";
import { THUMB_MAX_BYTES } from "./storage";

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
type Surface = HTMLCanvasElement | OffscreenCanvas;

export type BearPose = { x: number; y: number; facing: 1 | -1 };

// ---- Yüzey oluşturma ----

function createSurface(w: number, h: number): { surface: Surface; ctx: Ctx } | null {
  try {
    if (typeof OffscreenCanvas !== "undefined") {
      const surface = new OffscreenCanvas(w, h);
      const ctx = surface.getContext("2d");
      if (ctx) return { surface, ctx };
    }
  } catch {
    /* eski tarayıcı: DOM tuvaline düş */
  }
  if (typeof document === "undefined") return null;
  try {
    const surface = document.createElement("canvas");
    surface.width = w;
    surface.height = h;
    const ctx = surface.getContext("2d");
    return ctx ? { surface, ctx } : null;
  } catch {
    return null;
  }
}

// ---- Karolar ----

function rect(
  ctx: Ctx,
  x: number,
  y: number,
  s: number,
  fx: number,
  fy: number,
  fw: number,
  fh: number,
) {
  ctx.fillRect(
    x + Math.round(fx * s),
    y + Math.round(fy * s),
    Math.max(1, Math.round(fw * s)),
    Math.max(1, Math.round(fh * s)),
  );
}

/** İki tonlu tıknaz kabartma: üst/sol açık, alt/sağ koyu. */
function bevel(
  ctx: Ctx,
  x: number,
  y: number,
  s: number,
  base: string,
  light: string,
  dark: string,
) {
  const b = Math.max(1, Math.round(s * 0.1));
  ctx.fillStyle = base;
  ctx.fillRect(x, y, s, s);
  ctx.fillStyle = light;
  ctx.fillRect(x, y, s, b);
  ctx.fillRect(x, y, b, s);
  ctx.fillStyle = dark;
  ctx.fillRect(x, y + s - b, s, b);
  ctx.fillRect(x + s - b, y, b, s);
}

function hexagon(ctx: Ctx, cx: number, cy: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Tek bir karoyu (x, y) konumuna `s` boyunda çizer. */
export function paintTile(
  ctx: Ctx,
  kind: BlockKind,
  x: number,
  y: number,
  s: number,
): void {
  ctx.save();
  switch (kind) {
    case 1: {
      // çim: toprak gövde + damlayan yeşil başlık
      bevel(ctx, x, y, s, "#a86b3c", "#bb7f4c", "#8a5530");
      ctx.fillStyle = "#7a4a28";
      rect(ctx, x, y, s, 0.24, 0.66, 0.12, 0.12);
      rect(ctx, x, y, s, 0.62, 0.78, 0.12, 0.1);
      ctx.fillStyle = "#5dbb63";
      rect(ctx, x, y, s, 0, 0, 1, 0.36);
      rect(ctx, x, y, s, 0.08, 0.3, 0.2, 0.2);
      rect(ctx, x, y, s, 0.5, 0.3, 0.18, 0.15);
      rect(ctx, x, y, s, 0.82, 0.3, 0.18, 0.22);
      ctx.fillStyle = "#8fe08f";
      rect(ctx, x, y, s, 0, 0, 1, 0.1);
      rect(ctx, x, y, s, 0.3, 0.12, 0.12, 0.08);
      break;
    }
    case 2: {
      // toprak
      bevel(ctx, x, y, s, "#a86b3c", "#c08552", "#8a5530");
      ctx.fillStyle = "#7a4a28";
      rect(ctx, x, y, s, 0.2, 0.24, 0.14, 0.12);
      rect(ctx, x, y, s, 0.62, 0.2, 0.12, 0.12);
      rect(ctx, x, y, s, 0.42, 0.56, 0.14, 0.12);
      rect(ctx, x, y, s, 0.72, 0.68, 0.12, 0.12);
      ctx.fillStyle = "#c99a6b";
      rect(ctx, x, y, s, 0.24, 0.74, 0.1, 0.08);
      break;
    }
    case 3: {
      // taş
      bevel(ctx, x, y, s, "#9aa5b1", "#bac4ce", "#77828f");
      ctx.fillStyle = "#b4bec8";
      rect(ctx, x, y, s, 0.16, 0.18, 0.34, 0.2);
      rect(ctx, x, y, s, 0.58, 0.58, 0.26, 0.18);
      ctx.fillStyle = "#838e9b";
      rect(ctx, x, y, s, 0.2, 0.58, 0.22, 0.16);
      rect(ctx, x, y, s, 0.6, 0.22, 0.2, 0.14);
      break;
    }
    case 4: {
      // tahta: üç kalas
      bevel(ctx, x, y, s, "#d9a066", "#e8bc85", "#b07a43");
      ctx.fillStyle = "#b07a43";
      rect(ctx, x, y, s, 0, 0.32, 1, 0.06);
      rect(ctx, x, y, s, 0, 0.65, 1, 0.06);
      rect(ctx, x, y, s, 0.6, 0.06, 0.06, 0.26);
      rect(ctx, x, y, s, 0.28, 0.38, 0.06, 0.27);
      rect(ctx, x, y, s, 0.74, 0.71, 0.06, 0.21);
      ctx.fillStyle = "#c48a50";
      rect(ctx, x, y, s, 0.14, 0.16, 0.3, 0.05);
      rect(ctx, x, y, s, 0.42, 0.5, 0.36, 0.05);
      rect(ctx, x, y, s, 0.16, 0.82, 0.4, 0.05);
      break;
    }
    case 5: {
      // cam: yarı saydam, beyaz çerçeve, parlama
      const b = Math.max(1, Math.round(s * 0.09));
      ctx.fillStyle = "rgba(196, 236, 252, 0.5)";
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
      ctx.fillRect(x, y, s, b);
      ctx.fillRect(x, y + s - b, s, b);
      ctx.fillRect(x, y, b, s);
      ctx.fillRect(x + s - b, y, b, s);
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.moveTo(x + s * 0.22, y + s * 0.6);
      ctx.lineTo(x + s * 0.55, y + s * 0.22);
      ctx.lineTo(x + s * 0.68, y + s * 0.22);
      ctx.lineTo(x + s * 0.35, y + s * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + s * 0.45, y + s * 0.78);
      ctx.lineTo(x + s * 0.74, y + s * 0.46);
      ctx.lineTo(x + s * 0.8, y + s * 0.46);
      ctx.lineTo(x + s * 0.51, y + s * 0.78);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 6: {
      // su
      ctx.fillStyle = "rgba(64, 156, 230, 0.85)";
      ctx.fillRect(x, y, s, s);
      ctx.fillStyle = "rgba(150, 212, 252, 0.95)";
      rect(ctx, x, y, s, 0, 0, 1, 0.14);
      ctx.fillStyle = "rgba(175, 225, 255, 0.9)";
      rect(ctx, x, y, s, 0.12, 0.42, 0.26, 0.07);
      rect(ctx, x, y, s, 0.56, 0.68, 0.28, 0.07);
      ctx.fillStyle = "rgba(38, 110, 190, 0.85)";
      rect(ctx, x, y, s, 0, 0.9, 1, 0.1);
      break;
    }
    case 7: {
      // çiçek: saydam zemin, sap, yapraklar, beş taç yaprak
      ctx.fillStyle = "#3f9e4d";
      rect(ctx, x, y, s, 0.45, 0.42, 0.1, 0.58);
      ctx.fillStyle = "#5dbb63";
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.34,
        y + s * 0.76,
        s * 0.15,
        s * 0.07,
        -0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        x + s * 0.66,
        y + s * 0.66,
        s * 0.15,
        s * 0.07,
        0.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.fillStyle = "#ff7eb6";
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        ctx.beginPath();
        ctx.arc(
          x + s * (0.5 + 0.15 * Math.cos(a)),
          y + s * (0.32 + 0.15 * Math.sin(a)),
          s * 0.12,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
      ctx.fillStyle = "#ffd93d";
      ctx.beginPath();
      ctx.arc(x + s * 0.5, y + s * 0.32, s * 0.09, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 8: {
      // bal: petek
      bevel(ctx, x, y, s, "#f6b93b", "#ffd56b", "#d98e04");
      ctx.strokeStyle = "#e09b12";
      ctx.lineWidth = Math.max(1, s * 0.06);
      hexagon(ctx, x + s * 0.34, y + s * 0.42, s * 0.15);
      ctx.stroke();
      hexagon(ctx, x + s * 0.66, y + s * 0.62, s * 0.15);
      ctx.stroke();
      ctx.fillStyle = "#fff3c4";
      rect(ctx, x, y, s, 0.16, 0.16, 0.12, 0.1);
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

// ---- Atlas önbelleği ----

const atlasCache = new Map<number, Surface | null>();

/** `tilePx` boyunda 8 karoluk yatay şerit. Önbellekte en fazla iki boy tutulur. */
export function getAtlas(tilePx: number): Surface | null {
  const size = Math.max(1, Math.round(tilePx));
  if (atlasCache.has(size)) return atlasCache.get(size) ?? null;
  const made = createSurface(size * SOLID_KINDS.length, size);
  if (made) {
    for (const k of SOLID_KINDS) paintTile(made.ctx, k, (k - 1) * size, 0, size);
  }
  const surface = made?.surface ?? null;
  if (atlasCache.size >= 2) {
    const oldest = atlasCache.keys().next().value;
    if (oldest !== undefined) atlasCache.delete(oldest);
  }
  atlasCache.set(size, surface);
  return surface;
}

// ---- Sahne ----

function cloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  ctx.beginPath();
  ctx.arc(cx - r * 0.9, cy + r * 0.15, r * 0.65, 0, Math.PI * 2);
  ctx.arc(cx, cy - r * 0.15, r * 0.85, 0, Math.PI * 2);
  ctx.arc(cx + r * 0.95, cy + r * 0.2, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - r * 0.9, cy + r * 0.15, r * 1.85, r * 0.65);
}

export type SceneOptions = {
  gridLines?: boolean; // varsayılan true
  decor?: boolean; // güneş + bulutlar, varsayılan true
  useAtlas?: boolean; // varsayılan true
};

/** Gökyüzü, ipucu çizgileri, bloklar ve (varsa) ayı. `cell` cihaz pikseli. */
export function drawScene(
  ctx: CanvasRenderingContext2D,
  grid: Grid,
  cell: number,
  bear: BearPose | null,
  opts: SceneOptions = {},
): void {
  const { gridLines = true, decor = true, useAtlas = true } = opts;
  const W = GRID_W * cell;
  const H = GRID_H * cell;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#7cc8f8");
  sky.addColorStop(0.7, "#c4eaff");
  sky.addColorStop(1, "#e6f7ff");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  if (decor) {
    ctx.fillStyle = "rgba(255, 226, 122, 0.35)";
    ctx.beginPath();
    ctx.arc(W - cell * 1.6, cell * 1.6, cell * 1.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe27a";
    ctx.beginPath();
    ctx.arc(W - cell * 1.6, cell * 1.6, cell * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    cloud(ctx, cell * 2.6, cell * 2.3, cell * 0.8);
    cloud(ctx, cell * 7.4, cell * 4.3, cell * 0.6);
  }

  if (gridLines) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let gx = 1; gx < GRID_W; gx++) {
      ctx.moveTo(gx * cell + 0.5, 0);
      ctx.lineTo(gx * cell + 0.5, H);
    }
    for (let gy = 1; gy < GRID_H; gy++) {
      ctx.moveTo(0, gy * cell + 0.5);
      ctx.lineTo(W, gy * cell + 0.5);
    }
    ctx.stroke();
  }

  const atlas = useAtlas ? getAtlas(cell) : null;
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const k = grid[y * GRID_W + x] as BlockKind;
      if (k === 0) continue;
      if (atlas)
        ctx.drawImage(
          atlas,
          (k - 1) * cell,
          0,
          cell,
          cell,
          x * cell,
          y * cell,
          cell,
          cell,
        );
      else paintTile(ctx, k, x * cell, y * cell, cell);
    }
  }

  if (bear) drawBear(ctx, bear, cell);
}

const EMOJI_FONT =
  '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

export function drawBear(
  ctx: CanvasRenderingContext2D,
  pose: BearPose,
  cell: number,
): void {
  const cx = (pose.x + 0.5) * cell;
  const cy = (pose.y + 0.5) * cell;
  ctx.save();
  ctx.fillStyle = "rgba(23, 63, 95, 0.18)";
  ctx.beginPath();
  ctx.ellipse(
    cx,
    (pose.y + 1) * cell - cell * 0.06,
    cell * 0.34,
    cell * 0.08,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.translate(cx, cy);
  if (pose.facing < 0) ctx.scale(-1, 1);
  ctx.font = `${Math.round(cell * 0.92)}px ${EMOJI_FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("🐻", 0, cell * 0.04);
  ctx.restore();
}

/** Palet çipindeki küçük karo önizlemesi. */
export function paintChip(canvas: HTMLCanvasElement, kind: BlockKind): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const s = Math.min(canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paintTile(
    ctx,
    kind,
    Math.floor((canvas.width - s) / 2),
    Math.floor((canvas.height - s) / 2),
    s,
  );
}

// ---- Küçük resim ----

/** Hücre başına piksel; büyükten küçüğe denenir. */
export const THUMB_SCALES: readonly number[] = [8, 6, 5, 4, 3, 2];

/**
 * Bütçeye (≤ 20 KB data URL) sığan ilk küçük resmi seçer. Hiçbiri sığmazsa "".
 * `render(cellPx)` null dönerse (tuval yok) o boy atlanır.
 */
export function pickThumbnail(
  render: (cellPx: number) => string | null,
  maxBytes: number = THUMB_MAX_BYTES,
  scales: readonly number[] = THUMB_SCALES,
): string {
  for (const s of scales) {
    const url = render(s);
    if (url && url.startsWith("data:image/") && url.length <= maxBytes) return url;
  }
  return "";
}

/** PNG data URL (≤ 20 KB) ya da tuval yoksa "". */
export function makeThumbnail(grid: Grid): string {
  if (typeof document === "undefined") return "";
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D | null;
  try {
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d");
  } catch {
    return "";
  }
  if (!ctx) return "";
  const c2d = ctx;
  return pickThumbnail((s) => {
    canvas.width = GRID_W * s;
    canvas.height = GRID_H * s;
    drawScene(c2d, grid, s, null, {
      gridLines: false,
      decor: s >= 4,
      useAtlas: false,
    });
    try {
      return canvas.toDataURL("image/png");
    } catch {
      return null;
    }
  });
}
