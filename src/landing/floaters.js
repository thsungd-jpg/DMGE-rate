// Tiny floating blobs: they drift, bounce off the viewport edges and each other, shy away from the pointer,
// and squash/stretch ("morph") as they go. Positions are in viewport CSS px (y down), independent of scroll.
const DAY = [[1.0, 0.62, 0.82], [0.56, 0.78, 1.0], [0.60, 0.94, 0.78], [1.0, 0.91, 0.54], [0.78, 0.72, 1.0], [1.0, 0.70, 0.86]];
const NIGHT = [[1.0, 0.36, 0.78], [0.30, 0.92, 1.0], [0.68, 0.48, 1.0], [0.34, 0.58, 1.0], [1.0, 0.50, 0.90], [0.36, 0.96, 0.86]];

const rand = (a, b) => a + Math.random() * (b - a);

export function createFloaters(count, W, H) {
  const k = Math.max(1, Math.min(W, H) / 800);
  return Array.from({ length: count }, (_, i) => {
    const r = rand(9, 21) * k;
    const sp = rand(34, 80) * k;
    const a = rand(0, Math.PI * 2);
    return {
      x: rand(r, W - r), y: rand(r, H - r), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
      r, phase: rand(0, 10), i,
    };
  });
}

/** Advance the simulation; returns shapes in the engine's shape format (CSS px, y down). */
export function stepFloaters(list, dt, t, W, H, pointer, night, frozen) {
  const k = Math.max(1, Math.min(W, H) / 800);
  const px = pointer.x * W, py = pointer.y * H;
  const out = [];
  for (const f of list) {
    if (!frozen) {
      // lazy swirl so the paths curve instead of ruling straight lines
      f.vx += Math.sin(t * 0.45 + f.phase) * 14 * dt;
      f.vy += Math.cos(t * 0.38 + f.phase * 1.3) * 14 * dt;

      // shy away from the pointer
      const dx = f.x - px, dy = f.y - py;
      const dist = Math.hypot(dx, dy);
      const reach = 150 * k;
      if (dist < reach && dist > 0.001) {
        const push = (1 - dist / reach) * 520 * dt;
        f.vx += (dx / dist) * push; f.vy += (dy / dist) * push;
      }

      // keep a lively but gentle speed
      const sp = Math.hypot(f.vx, f.vy);
      const lo = 30 * k, hi = 120 * k;
      if (sp > hi) { f.vx *= hi / sp; f.vy *= hi / sp; }
      else if (sp < lo && sp > 0.001) { f.vx *= lo / sp; f.vy *= lo / sp; }

      f.x += f.vx * dt; f.y += f.vy * dt;

      // bounce off the viewport edges
      if (f.x < f.r) { f.x = f.r; f.vx = Math.abs(f.vx); }
      else if (f.x > W - f.r) { f.x = W - f.r; f.vx = -Math.abs(f.vx); }
      if (f.y < f.r) { f.y = f.r; f.vy = Math.abs(f.vy); }
      else if (f.y > H - f.r) { f.y = H - f.r; f.vy = -Math.abs(f.vy); }
    }
  }

  // elastic bounce between floaters
  if (!frozen) {
    for (let a = 0; a < list.length; a++) {
      for (let b = a + 1; b < list.length; b++) {
        const A = list[a], B = list[b];
        const dx = B.x - A.x, dy = B.y - A.y;
        const dist = Math.hypot(dx, dy);
        const min = (A.r + B.r) * 1.25;
        if (dist < min && dist > 0.001) {
          const nx = dx / dist, ny = dy / dist;
          const rel = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny;
          if (rel < 0) {
            A.vx += rel * nx; A.vy += rel * ny;
            B.vx -= rel * nx; B.vy -= rel * ny;
          }
          const overlap = (min - dist) * 0.5;
          A.x -= nx * overlap; A.y -= ny * overlap; B.x += nx * overlap; B.y += ny * overlap;
        }
      }
    }
  }

  for (const f of list) {
    const hw = f.r * (1 + 0.34 * Math.sin(t * 1.7 + f.phase));
    const hh = f.r * (1 + 0.34 * Math.cos(t * 1.25 + f.phase * 1.7));
    const d = DAY[f.i % DAY.length], n = NIGHT[f.i % NIGHT.length];
    out.push({
      cx: f.x, cy: f.y, hw, hh, r: Math.min(hw, hh),
      col: [d[0] + (n[0] - d[0]) * night, d[1] + (n[1] - d[1]) * night, d[2] + (n[2] - d[2]) * night],
    });
  }
  return out;
}
