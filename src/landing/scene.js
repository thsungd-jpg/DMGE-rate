// Scene engine for the Liquid Ledger landing.
// Each chapter registers a `build(ctx)` that returns liquid shapes in CSS px (viewport coords, y down),
// usually anchored to real DOM rects so the liquid "rides" the cards. computeTarget() blends the chapters
// by how close each is to the viewport center, so shapes morph as you scroll.
import { PALETTE as P } from "../styles/palette";

export const MAX_SHAPES = 6;

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

const DEFAULTS = { k: 60, marble: 1, lines: 0, bevel: 160, wob: 8, shadow: 1, pal: PALS[0], tex: [1, 0, 0], seed: [0, 0] };

const chapters = new Map();

export function registerChapter(id, def) {
  chapters.set(id, def);
  return () => chapters.delete(id);
}

export const pointer = { x: 0.5, y: 0.5 };

const inactive = (at) => ({ cx: at.cx, cy: at.cy, hw: 0, hh: 0, r: 0, col: at.col || C.pink });

function pad(shapes) {
  const list = shapes.slice(0, MAX_SHAPES);
  const anchor = list.find((s) => s.hw > 0) || { cx: 0, cy: 0, col: C.pink };
  while (list.length < MAX_SHAPES) list.push(inactive(anchor));
  return list.map((s) => (s.hw > 0 ? s : inactive(anchor)));
}

export function rectOf(el) {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2, el };
}

/** Blend all chapters into one target scene. Returns CSS-px shapes and scalar params. */
export function computeTarget(W, H) {
  const entries = [];
  let total = 0;
  chapters.forEach((def) => {
    const el = def.el;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const mid = H / 2;
    const dist = mid < r.top ? r.top - mid : mid > r.bottom ? mid - r.bottom : 0;
    // Full weight while the chapter holds the viewport center; fades to 0 over a short band outside it,
    // so DOM-anchored shapes stay exactly aligned mid-chapter and only morph near chapter boundaries.
    const t = Math.min(1, dist / (0.35 * H));
    const w = 1 - t * t * (3 - 2 * t);
    if (w < 0.001) return;
    entries.push({ def, w });
    total += w;
  });

  if (!entries.length) return null;

  const out = {
    shapes: Array.from({ length: MAX_SHAPES }, () => ({ cx: 0, cy: 0, hw: 0, hh: 0, r: 0, col: [0, 0, 0] })),
    pal: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
    k: 0, marble: 0, lines: 0, bevel: 0, wob: 0, shadow: 0,
    tex: [0, 0, 0], seed: [0, 0],
  };

  for (const { def, w } of entries) {
    const nw = w / total;
    const built = def.build({ W, H, rectOf });
    const params = { ...DEFAULTS, ...built };
    const shapes = pad(built.shapes || []);
    for (let i = 0; i < MAX_SHAPES; i++) {
      const s = shapes[i];
      const o = out.shapes[i];
      o.cx += s.cx * nw; o.cy += s.cy * nw; o.hw += s.hw * nw; o.hh += s.hh * nw; o.r += s.r * nw;
      for (let c = 0; c < 3; c++) o.col[c] += s.col[c] * nw;
    }
    for (let i = 0; i < 4; i++) for (let c = 0; c < 3; c++) out.pal[i][c] += params.pal[i][c] * nw;
    out.k += params.k * nw; out.marble += params.marble * nw; out.lines += params.lines * nw;
    out.bevel += params.bevel * nw; out.wob += params.wob * nw; out.shadow += params.shadow * nw;
    for (let i = 0; i < 3; i++) out.tex[i] += params.tex[i] * nw;
    for (let i = 0; i < 2; i++) out.seed[i] += params.seed[i] * nw;
  }
  return out;
}

/** Smoothly chase `target` (liquid inertia). `cur` is mutated. rate ~ 6–10. */
export function approach(cur, target, dt, rate) {
  const a = 1 - Math.exp(-dt * rate);
  if (!cur.shapes) {
    // first frame: snap
    cur.shapes = target.shapes.map((s) => ({ ...s, col: [...s.col] }));
    cur.pal = target.pal.map((c) => [...c]);
    cur.k = target.k; cur.marble = target.marble; cur.lines = target.lines;
    cur.bevel = target.bevel; cur.wob = target.wob; cur.shadow = target.shadow;
    cur.tex = [...target.tex]; cur.seed = [...target.seed];
    return;
  }
  for (let i = 0; i < MAX_SHAPES; i++) {
    const s = cur.shapes[i], t = target.shapes[i];
    s.cx += (t.cx - s.cx) * a; s.cy += (t.cy - s.cy) * a; s.hw += (t.hw - s.hw) * a;
    s.hh += (t.hh - s.hh) * a; s.r += (t.r - s.r) * a;
    for (let c = 0; c < 3; c++) s.col[c] += (t.col[c] - s.col[c]) * a;
  }
  for (let i = 0; i < 4; i++) for (let c = 0; c < 3; c++) cur.pal[i][c] += (target.pal[i][c] - cur.pal[i][c]) * a;
  for (const key of ["k", "marble", "lines", "bevel", "wob", "shadow"]) cur[key] += (target[key] - cur[key]) * a;
  for (let i = 0; i < 3; i++) cur.tex[i] += (target.tex[i] - cur.tex[i]) * a;
  for (let i = 0; i < 2; i++) cur.seed[i] += (target.seed[i] - cur.seed[i]) * a;
}
