// A frame sequence on a canvas that is driven by a number (the scroll position), never by a clock.
// The compressed frames (a few MB) are fetched in the background and kept as blobs; only the frames around the playhead are decoded, so memory
// stays small however long the sequence is. show() paints the nearest decoded frame at once and never waits, so scrubbing in either direction
// stays smooth even while frames are still arriving. Frames from loopFrom on are a seamless loop: positions past the end wrap round to it (with
// loopFrom 0 the whole sequence is a loop and positions below 0 wrap too, so it can turn backwards for ever). With blend, positions between two
// frames of the loop cross-fade, so a slow 12 fps loop still moves smoothly. With alpha, the frames have transparency (the canvas is cleared before
// each paint, and what is behind it shows through); without it the canvas is opaque, which is faster, and black frames are meant to be screen-blended.
export function frameSequence(canvas, urls, { width, height, loopFrom = urls.length, blend = false, alpha = false, ahead = 8, behind = 3, keep = 4, fetchers = 4 } = {}) {
  const n = urls.length, cycle = n - loopFrom;
  const mod = (x, m) => ((x % m) + m) % m;
  const ctx = canvas.getContext("2d", { alpha });
  canvas.width = width; canvas.height = height;
  const blobs = new Array(n).fill(null), bitmaps = new Map(), fetching = new Set(), decoding = new Set(), win = new Set();
  // at: the playhead (a whole frame; it keeps counting past the end of a loop). wa/wb/wq: the frame wanted, the one it cross-fades into, and by how much.
  // sa/sb/sq: what is painted now. idle: nothing is decoded for a sequence until the playhead is first placed, or when it has been let go of.
  let at = 0, dir = 1, wa = 0, wb = 0, wq = 0, sa = -1, sb = -1, sq = 0, idle = true, dead = false;

  const idx = (k) => (cycle > 0 && (k >= loopFrom || loopFrom === 0) ? loopFrom + mod(k - loopFrom, cycle) : Math.min(n - 1, Math.max(0, k))); // playhead -> frame
  const note = () => { if (import.meta.env.DEV) { canvas.dataset.frame = sa; canvas.dataset.blend = sb < 0 ? 0 : sq; canvas.dataset.decoded = bitmaps.size; } }; // for devtools and tests

  const paint = () => {
    let a = wa, b = -1, q = 0;
    if (bitmaps.has(a)) { if (wq && bitmaps.has(wb)) { b = wb; q = wq; } }
    else { // not decoded yet: the nearest decoded frame, preferring the one the playhead has just passed
      a = -1;
      for (let d = 1; d <= ahead + keep && a < 0; d++) { const x = idx(at - dir * d), y = idx(at + dir * d); a = bitmaps.has(x) ? x : bitmaps.has(y) ? y : -1; }
    }
    if (a < 0 || (a === sa && b === sb && q === sq)) return note();
    if (alpha) ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = 1; ctx.drawImage(bitmaps.get(a), 0, 0);
    if (b >= 0) { ctx.globalAlpha = q; ctx.drawImage(bitmaps.get(b), 0, 0); ctx.globalAlpha = 1; }
    sa = a; sb = b; sq = q; note();
  };
  const decode = (i) => {
    if (dead || idle || bitmaps.has(i) || decoding.has(i) || !blobs[i] || !win.has(i)) return;
    decoding.add(i);
    createImageBitmap(blobs[i]).then((bm) => {
      decoding.delete(i);
      if (dead || idle || !win.has(i)) bm.close(); else { bitmaps.set(i, bm); paint(); }
    }, () => decoding.delete(i));
  };
  const load = (i) => {
    if (dead || blobs[i] || fetching.has(i)) return Promise.resolve();
    fetching.add(i);
    return fetch(urls[i]).then((r) => (r.ok ? r.blob() : Promise.reject())).then((b) => { blobs[i] = b; fetching.delete(i); decode(i); }, () => fetching.delete(i));
  };
  const need = (i) => (blobs[i] ? decode(i) : load(i));
  const pump = () => {
    win.clear(); // the frames the playhead is heading for, plus a margin (the window wraps round a loop)
    for (let d = -(dir > 0 ? behind : ahead) - keep; d <= (dir > 0 ? ahead : behind) + keep + 1; d++) win.add(idx(at + d));
    for (const [i, bm] of bitmaps) if (!win.has(i)) { bm.close(); bitmaps.delete(i); }
    need(wa); if (wq) need(wb);
    for (let d = 1; d <= ahead; d++) { need(idx(at + dir * d)); if (d <= behind) need(idx(at - dir * d)); }
  };

  return {
    // frame number: paints that frame, or the nearest decoded one, immediately. With blend, a fractional number inside the loop cross-fades two frames
    show(f) {
      if (!n) return;
      const lo = Math.floor(f), fading = blend && cycle > 0 && (lo >= loopFrom || loopFrom === 0);
      let k = fading ? lo : Math.round(f), q = fading ? Math.round((f - lo) * 8) / 8 : 0; // eighths: enough steps, few redraws
      if (q === 1) { k++; q = 0; }
      if (cycle <= 0) k = Math.min(n - 1, Math.max(0, k));
      if (k === at && q === wq && !idle && sa >= 0) return;
      if (k !== at) dir = k > at ? 1 : -1;
      idle = false; at = k; wa = idx(k); wb = idx(k + 1); wq = q; pump(); paint();
    },
    // fetches frames from..to in the background, coarse to fine (so whichever frame the playhead lands on has a close neighbour while the rest is
    // still loading); resolves when they are all in
    preload(from = 0, to = n) {
      const order = [];
      for (const s of [8, 4, 2, 1]) for (let i = from; i < to; i += s) if (s === 8 || (i - from) % (s * 2)) order.push(i);
      let next = 0;
      return new Promise((done) => {
        let running = 0;
        const drain = () => {
          while (running < fetchers && next < order.length && !dead) {
            const i = order[next++];
            if (!blobs[i]) { running++; load(i).then(() => { running--; drain(); }); }
          }
          if (!running) done();
        };
        drain();
      });
    },
    // how many frames have been fetched: preload() resolves even when some downloads failed, so this is how to tell that a sequence really is complete
    loaded() { let k = 0; for (const b of blobs) if (b) k++; return k; },
    // the playhead is far away: let go of the decoded frames (the canvas keeps what it shows); show() decodes again on return
    release() {
      if (idle) return;
      idle = true; bitmaps.forEach((bm) => bm.close()); bitmaps.clear(); sa = sb = -1;
      if (import.meta.env.DEV) canvas.dataset.decoded = 0;
    },
    destroy() { dead = true; bitmaps.forEach((bm) => bm.close()); bitmaps.clear(); },
  };
}
