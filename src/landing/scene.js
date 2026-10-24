// Scene engine for the Liquid Ledger landing.
// Each chapter registers a `build(ctx)` that returns liquid shapes in CSS px (viewport coords, y down),
// usually anchored to real DOM rects so the liquid "rides" the cards. computeTarget() returns the scene of
// the chapter holding the viewport center. When that changes, LiquidCanvas flies the liquid out of frame and
// back in (see flight logic there), so chapter changes read as dramatic exits/entrances instead of cross-fades.
import { PALETTE as P } from "../styles/palette";

export const MAIN_SHAPES = 6;

export const hexToRgb = (h) => [
  parseInt(h.slice(1, 3), 16) / 255,
  parseInt(h.slice(3, 5), 16) / 255,
  parseInt(h.slice(5, 7), 16) / 255,
];

const C = {
  pink: hexToRgb(P.pink), blue: hexToRgb(P.blue), mint: hexToRgb(P.mint),
  butter: hexToRgb(P.butter), lilac: hexToRgb(P.lilac),
};
export const COLORS = C;

// Marble palettes (rotate per craft family).
export const PALS = [
  [C.pink, C.blue, C.mint, C.butter],
  [C.blue, C.lilac, C.pink, C.mint],
  [C.mint, C.butter, C.blue, C.pink],
  [C.butter, C.pink, C.lilac, C.blue],
  [C.lilac, C.mint, C.pink, C.butter],
];

const DEFAULTS = {
  k: 60, marble: 1, lines: 0, bevel: 160, wob: 8, shadow: 1, glass: 1, warp: 0.07, smoke: 1, sun: 1,
  pal: PALS[0], tex: [1, 0, 0], seed: [0, 0],
};
const SCALAR_KEYS = ["k", "marble", "lines", "bevel", "wob", "shadow", "glass", "warp", "smoke", "sun"];

const chapters = new Map();

export function registerChapter(id, def) {
  chapters.set(id, def);
  return () => chapters.delete(id);
}
export const orderOf = (id) => [...chapters.keys()].indexOf(id);

export const pointer = { x: 0.5, y: 0.5 };

/** Seconds, frozen under reduced motion. Builders use this for rotation. */
export const clock = { t: 0 };

const inactive = (at) => ({ cx: at.cx, cy: at.cy, hw: 0, hh: 0, r: 0, col: at.col || C.pink });

function pad(shapes) {
  const list = shapes.slice(0, MAIN_SHAPES);
  const anchor = list.find((s) => s.hw > 0) || { cx: 0, cy: 0, col: C.pink };
  while (list.length < MAIN_SHAPES) list.push(inactive(anchor));
  return list.map((s) => (s.hw > 0 ? s : inactive(anchor)));
}

export function rectOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, el };
}

function fullScene(def, W, H) {
  const built = def.build({ W, H, rectOf });
  const params = { ...DEFAULTS, ...built };
  const out = {
    shapes: pad(built.shapes || []).map((s) => ({ ...s, col: [...s.col] })),
    pal: params.pal.map((c) => [...c]),
    tex: [...params.tex],
    seed: [...params.seed],
  };
  for (const k of SCALAR_KEYS) out[k] = params[k];
  return out;
}

/**
 * Scene of the chapter holding the viewport center (or `forceId`). Returns null if nothing is registered.
 * Result carries `id` so the canvas can detect chapter changes.
 */
export function computeTarget(W, H, forceId = null) {
  let best = null;
  let bestDist = Infinity;
  chapters.forEach((def, id) => {
    const el = def.el;
    if (!el) return;
    if (forceId) { if (id === forceId) { best = { id, def }; bestDist = 0; } return; }
    const r = el.getBoundingClientRect();
    const mid = H / 2;
    const dist = mid < r.top ? r.top - mid : mid > r.bottom ? mid - r.bottom : 0;
    if (dist < bestDist) { bestDist = dist; best = { id, def }; }
  });
  if (!best) return null;
  return { id: best.id, ...fullScene(best.def, W, H) };
}

// ── helpers used by the flight logic ──

export function centroid(shapes, dy = 0) {
  let x = 0, y = 0, n = 0;
  for (const s of shapes) if (s.hw > 0.5) { x += s.cx; y += s.cy - dy; n += 1; }
  return n ? { x: x / n, y: y / n } : null;
}

export function offsetScene(scene, dx, dy) {
  for (const s of scene.shapes) { s.cx += dx; s.cy += dy; }
}

export function rotateScene(scene, angle) {
  if (!angle) return;
  const c = centroid(scene.shapes);
  if (!c) return;
  const cos = Math.cos(angle), sin = Math.sin(angle);
  for (const s of scene.shapes) {
    const x = s.cx - c.x, y = s.cy - c.y;
    s.cx = c.x + x * cos - y * sin;
    s.cy = c.y + x * sin + y * cos;
  }
}

/** Copy `target` into `cur` instantly, optionally displaced (used to start an entrance off-screen). */
export function snapTo(cur, target, dx = 0, dy = 0) {
  cur.shapes = target.shapes.map((s) => ({ ...s, cx: s.cx + dx, cy: s.cy + dy, col: [...s.col] }));
  cur.pal = target.pal.map((c) => [...c]);
  cur.tex = [...target.tex];
  cur.seed = [...target.seed];
  for (const k of SCALAR_KEYS) cur[k] = target[k];
}

/** Smoothly chase `target` (liquid inertia). `cur` is mutated. rate ~ 4–10. */
export function approach(cur, target, dt, rate) {
  if (!cur.shapes) { snapTo(cur, target); return; }
  const a = 1 - Math.exp(-dt * rate);
  for (let i = 0; i < MAIN_SHAPES; i++) {
    const s = cur.shapes[i], t = target.shapes[i];
    s.cx += (t.cx - s.cx) * a; s.cy += (t.cy - s.cy) * a; s.hw += (t.hw - s.hw) * a;
    s.hh += (t.hh - s.hh) * a; s.r += (t.r - s.r) * a;
    for (let c = 0; c < 3; c++) s.col[c] += (t.col[c] - s.col[c]) * a;
  }
  for (let i = 0; i < 4; i++) for (let c = 0; c < 3; c++) cur.pal[i][c] += (target.pal[i][c] - cur.pal[i][c]) * a;
  for (const key of SCALAR_KEYS) cur[key] += (target[key] - cur[key]) * a;
  for (let i = 0; i < 3; i++) cur.tex[i] += (target.tex[i] - cur.tex[i]) * a;
  for (let i = 0; i < 2; i++) cur.seed[i] += (target.seed[i] - cur.seed[i]) * a;
}
