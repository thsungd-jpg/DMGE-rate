import React, { useEffect, useRef } from "react";
import LiquidCanvas from "../landing/LiquidCanvas";
import { registerChapter, rectOf, PALS, pointer } from "../landing/scene";
import { variantRows, rowsToShapes, spin, texFor, seedFor } from "../landing/shapes";

// Ambient liquid behind the app. Every tab registers its OWN scene (different anchor, shape and palette), so when
// the tab changes the shared engine flies the liquid out of frame and back in: that is the page transition.
// Anchors keep clear of the top-left, where page titles sit.
const SCENES = {
  calc:           { ax: 0.86, ay: 0.30, i: 0 },
  history:        { ax: 0.88, ay: 0.74, i: 1 },
  templates:      { ax: 0.12, ay: 0.78, i: 2 },
  clients:        { ax: 0.86, ay: 0.36, i: 3 },
  analytics:      { ax: 0.14, ay: 0.74, i: 4 },
  profile:        { ax: 0.88, ay: 0.62, i: 5 },
  tutorial:       { ax: 0.84, ay: 0.28, i: 6 },
  pricing:        { ax: 0.50, ay: 0.90, i: 7 },
  invoice_editor: { ax: 0.90, ay: 0.50, i: 8 },
};

function buildScene(tab, { W, H }) {
  const cfg = SCENES[tab] || SCENES.calc;
  const small = W < 700;
  const m = Math.min(W, H) * 0.5;
  const size = small ? 0.5 : 0.62;
  const S = {
    cx: cfg.ax * W + (pointer.x - 0.5) * m * 0.12,
    cy: cfg.ay * H + (pointer.y - 0.5) * m * 0.1,
    w: m * 2 * size, h: m * 2 * size,
  };
  const pal = PALS[cfg.i % PALS.length];
  const mm = Math.min(S.w, S.h) * 0.5;
  return {
    shapes: rowsToShapes(S, variantRows(cfg.i), 1, pal, spin(0.14, 0)),
    k: mm * 0.4, bevel: mm * 0.72, wob: mm * 0.06, warp: 0.07, glass: 1, smoke: 0.6, sun: 0.6, marble: 1, shadow: 1,
    pal, tex: texFor(cfg.i), seed: seedFor(cfg.i),
  };
}

export default function AppLiquid({ tab }) {
  const rootRef = useRef(null);
  const tabRef = useRef(tab);
  tabRef.current = tab;
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(
    () => registerChapter("app:" + tab, { get el() { return rootRef.current; }, build: (ctx) => buildScene(tabRef.current, ctx) }),
    [tab],
  );

  useEffect(() => {
    const onMove = (e) => { pointer.x = e.clientX / window.innerWidth; pointer.y = e.clientY / window.innerHeight; };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <>
      <LiquidCanvas reducedMotion={!!reduced} floaterCount={4} fpsCap={30} />
      <div ref={rootRef} className="app-liquid-root" aria-hidden="true" />
    </>
  );
}
