// Shared liquid shape helpers (used by the landing chapters and the in-app ambient liquid).
import { COLORS, clock } from "./scene";

// cluster rows: [dx, dy, hw, hh, r] in units of (stage half-min), y up
export const CLOUD = [
  [0, 0, 0.62, 0.55, 0.55],
  [-0.38, 0.2, 0.38, 0.38, 0.38],
  [0.4, 0.26, 0.34, 0.34, 0.34],
  [0.16, -0.4, 0.4, 0.3, 0.3],
  [-0.32, -0.3, 0.3, 0.3, 0.3],
  [0.12, 0.48, 0.26, 0.26, 0.26],
];

export function variantRows(i) {
  const rows = [[0, 0, 0.5 + 0.06 * Math.sin(i), 0.46, 0.46]];
  for (let j = 0; j < 5; j++) {
    const a = (j / 5) * Math.PI * 2 + i * 0.9;
    const rad = 0.4 + 0.13 * Math.sin(i * 1.3 + j * 2.1);
    const s = 0.23 + 0.1 * Math.cos(i * 0.7 + j * 1.9);
    rows.push([Math.cos(a) * rad * 1.2, Math.sin(a) * rad, s * (1 + 0.35 * Math.sin(i + j)), s * (1 - 0.2 * Math.sin(i * 2 + j)), s * 0.85]);
  }
  return rows;
}

// slow spin that also follows the scroll, so the liquid keeps turning as you move through the page
export const spin = (rate = 0.2, scrollRate = 0.0006) => clock.t * rate + (window.scrollY || 0) * scrollRate;

export function rowsToShapes(S, rows, scale = 1, cols = [COLORS.pink], rot = 0) {
  const m = Math.min(S.w, S.h) * 0.5 * scale;
  const cos = Math.cos(rot), sin = Math.sin(rot);
  return rows.map((r, i) => {
    // each lobe also breathes a little on its own so the silhouette keeps warping
    const br = 1 + 0.07 * Math.sin(clock.t * 0.9 + i * 1.9);
    const x = r[0] * br, y = r[1] * br;
    return {
      cx: S.cx + (x * cos - y * sin) * m, cy: S.cy - (x * sin + y * cos) * m,
      hw: r[2] * m * br, hh: r[3] * m * br, r: r[4] * m * br, col: cols[i % cols.length],
    };
  });
}


// texture picker: each craft family samples a different marble render at a different offset
export const texFor = (i) => [i % 3 === 0 ? 1 : 0, i % 3 === 1 ? 1 : 0, i % 3 === 2 ? 1 : 0];
export const seedFor = (i) => [(i * 0.173) % 1, (i * 0.291) % 1];
