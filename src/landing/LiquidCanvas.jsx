import React, { useEffect, useRef } from "react";
import { VERT, FRAG, MAX_SHAPES, MAIN_SHAPES } from "./liquid.glsl";
import {
  computeTarget, approach, snapTo, centroid, offsetScene, rotateScene, orderOf, pointer, clock,
} from "./scene";
import { createFloaters, stepFloaters } from "./floaters";
import { getTheme } from "../styles/theme";
import marble1 from "../assets/art/marble-1-1024.webp";
import marble2 from "../assets/art/marble-2-1024.webp";
import marble3 from "../assets/art/marble-3-1024.webp";

// Night-mode marble textures are optional: they're picked up automatically once cosmic-*-1024.webp exist.
const cosmicUrls = Object.entries(import.meta.glob("../assets/art/cosmic-*-1024.webp", { eager: true, as: "url" }))
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([, url]) => url);

const EXIT_MS = 520;     // blob flies out of frame
const ENTER_MS = 1100;   // ...and the next chapter's blob flies back in

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || "shader compile failed");
  }
  return sh;
}

const easeInOut = (t) => t * t * (3 - 2 * t);
const norm = (x, y) => { const m = Math.hypot(x, y) || 1; return { x: x / m, y: y / m }; };

/**
 * Fixed full-viewport WebGL canvas that renders the liquid scene from ./scene.
 * onUnsupported() fires if WebGL or the shader is unavailable so the page can show its static fallback.
 */
export default function LiquidCanvas({ onUnsupported: onUnsupportedProp, reducedMotion = false, floaterCount = null, fpsCap = null }) {
  const ref = useRef(null);
  // Keep the callback in a ref so a new inline function from the parent never restarts the GL effect.
  const unsupportedRef = useRef(onUnsupportedProp);
  unsupportedRef.current = onUnsupportedProp;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const onUnsupported = () => unsupportedRef.current?.();

    let gl = null;
    try {
      gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
    } catch { /* fall through */ }
    if (!gl) { onUnsupported(); return undefined; }

    let program;
    try {
      const vs = compile(gl, gl.VERTEX_SHADER, VERT);
      const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (err) {
      console.warn("[LiquidCanvas] shader unavailable:", err);
      onUnsupported();
      return undefined;
    }
    gl.useProgram(program);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const U = {};
    [
      "uRes", "uTime", "uUnit", "uDpr", "uScroll", "uNight", "uK", "uKt", "uMarble", "uGlass", "uWarp", "uLines",
      "uBevel", "uWob", "uShadow", "uSmoke", "uSun", "uTexMix", "uTexOn", "uTexNOn", "uSeed", "uCenter",
      "uA", "uB", "uPal", "uTex0", "uTex1", "uTex2", "uTexN0", "uTexN1", "uTexN2",
    ].forEach((n) => { U[n] = gl.getUniformLocation(program, n); });
    [0, 1, 2].forEach((i) => { gl.uniform1i(U[`uTex${i}`], i); gl.uniform1i(U[`uTexN${i}`], 3 + i); });

    // ── textures: units 0-2 day, 3-5 night ──
    let dayLoaded = 0, nightLoaded = 0, dayFade = 0, nightFade = 0, texStopped = false;
    const setParams = (mip) => {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    };
    const makeTexture = (unit, url, onLoad) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([8, 4, 20, 255]));
      setParams(false);
      if (url) {
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          if (texStopped) return;
          gl.activeTexture(gl.TEXTURE0 + unit);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
          gl.generateMipmap(gl.TEXTURE_2D);
          setParams(true);
          onLoad();
        };
        img.src = url;
      }
      return tex;
    };
    const texObjs = [marble1, marble2, marble3].map((url, i) => makeTexture(i, url, () => { dayLoaded += 1; }));
    const nightCount = cosmicUrls.length;
    [0, 1, 2].forEach((i) => {
      texObjs.push(makeTexture(3 + i, nightCount ? cosmicUrls[i % nightCount] : null, () => { nightLoaded += 1; }));
    });

    const aArr = new Float32Array(MAX_SHAPES * 4);
    const bArr = new Float32Array(MAX_SHAPES * 4);
    const palArr = new Float32Array(12);

    const isTouch = window.matchMedia?.("(pointer: coarse)").matches;
    const maxDpr = isTouch ? 1.25 : 1.6;
    // Adaptive quality: render scale drops when frames run slow and recovers when there's headroom.
    // (?q=hi or window.__llNoAdapt pins full quality, used for screenshots.)
    const pinned = /[?&]q=hi\b/.test(window.location.search);
    let scale = 1, ema = 1 / 60, lastCheck = 0, calmSince = 0;
    let dpr = 1, W = 0, H = 0;
    let floaters = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr) * scale;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (!floaters.length) floaters = createFloaters(floaterCount ?? (isTouch ? 4 : 6), W, H);
      floaters.forEach((f) => { f.x = Math.min(Math.max(f.x, f.r), W - f.r); f.y = Math.min(Math.max(f.y, f.r), H - f.r); });
    };
    resize();
    window.addEventListener("resize", resize);

    const cur = {};
    const fl = { id: null, phase: "idle", t0: 0, exit: { x: 0, y: -1 }, spin: 0 };
    if (import.meta.env.DEV) { window.__llCur = cur; window.__llFlight = fl; window.__llScale = () => scale; } // dev-only: inspect live state
    let raf = 0, last = performance.now(), time = 0, night = getTheme() === "dark" ? 1 : 0, stopped = false;

    let live = false;
    const frame = (now) => {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }
      // optional frame cap (the in-app ambient liquid): full rate only while the liquid is flying between tabs
      if (fpsCap && fl.phase === "idle" && now - last < 1000 / fpsCap - 2) return;

      const rawDt = (now - last) / 1000;
      const dt = Math.min(rawDt, 0.05);
      last = now;

      // frame-time monitor -> render scale
      if (!pinned && !window.__llNoAdapt) {
        ema = ema * 0.92 + Math.min(rawDt, 0.2) * 0.08;
        if (now - lastCheck > 700) {
          lastCheck = now;
          if (ema > 1 / 38 && scale > 0.5) { scale = Math.max(0.5, scale * 0.84); calmSince = now; resize(); }
          else if (ema < 1 / 54 && scale < 1) {
            if (!calmSince) calmSince = now;
            if (now - calmSince > 3000) { scale = Math.min(1, scale * 1.08); calmSince = now; resize(); }
          } else if (ema >= 1 / 54) calmSince = 0;
        }
      }
      if (!reducedMotion) time += dt;
      clock.t = time;

      // day <-> night cross-fade
      const nightTarget = getTheme() === "dark" ? 1 : 0;
      night += (nightTarget - night) * (reducedMotion ? 1 : 1 - Math.exp(-dt * 2.6));
      if (dayLoaded >= 3 && dayFade < 1) dayFade = Math.min(1, dayFade + dt * 1.2);
      if (nightCount && nightLoaded >= 3 && nightFade < 1) nightFade = Math.min(1, nightFade + dt * 1.2);

      // dev/testing switch: skip flights + easing so layout alignment can be checked deterministically
      const snapMode = reducedMotion || window.__llSnap;
      const sy = window.scrollY || 0;

      // ── which chapter's liquid should be on screen, and how does it get there? ──
      const forced = fl.phase !== "idle" ? fl.id : null;
      let tgt = computeTarget(W, H, forced) || computeTarget(W, H);
      if (!tgt) return;
      offsetScene(tgt, 0, sy); // page space: plain scrolling must not lag

      const L = Math.hypot(W, H) * 0.9 + 420;
      if (!fl.id) {
        fl.id = tgt.id;
        snapTo(cur, tgt);
      } else if (fl.phase === "idle" && tgt.id !== fl.id) {
        if (snapMode) {
          fl.id = tgt.id;
        } else {
          // leave: fly out of frame away from where the liquid currently sits
          const dir = orderOf(tgt.id) >= orderOf(fl.id) ? 1 : -1;
          const c = centroid(cur.shapes, sy) || { x: W / 2, y: H / 2 };
          let v = { x: c.x - W / 2, y: c.y - H / 2 };
          if (Math.hypot(v.x, v.y) < 0.12 * Math.min(W, H)) v = { x: (orderOf(fl.id) % 2 ? -0.7 : 0.7), y: -dir };
          else v = norm(v.x / Math.hypot(v.x, v.y), v.y / Math.hypot(v.x, v.y) - 0.4 * dir);
          fl.exit = norm(v.x, v.y);
          fl.spin = dir * Math.PI * 0.95;
          fl.dir = dir;
          fl.phase = "exit";
          fl.t0 = now;
          tgt = computeTarget(W, H, fl.id) || tgt;
          offsetScene(tgt, 0, sy);
        }
      }

      if (fl.phase === "exit") {
        const t = Math.min(1, (now - fl.t0) / EXIT_MS);
        rotateScene(tgt, fl.spin * easeInOut(t));
        const e = t * t * t;
        offsetScene(tgt, fl.exit.x * L * e, fl.exit.y * L * e);
        if (t >= 1) {
          // swap to whichever chapter holds the viewport now, and fly it in from the opposite edge
          const next = computeTarget(W, H);
          if (next) {
            offsetScene(next, 0, sy);
            const c2 = centroid(next.shapes, sy) || { x: W / 2, y: H / 2 };
            let v = { x: c2.x - W / 2, y: c2.y - H / 2 };
            const m = Math.hypot(v.x, v.y);
            v = m < 0.12 * Math.min(W, H) ? { x: (orderOf(next.id) % 2 ? 0.7 : -0.7), y: fl.dir } : norm(v.x / m, v.y / m + 0.4 * fl.dir);
            const ev = norm(v.x, v.y);
            fl.id = next.id;
            fl.phase = "enter";
            fl.t0 = now;
            snapTo(cur, next, ev.x * L, ev.y * L);
            rotateScene(cur, -fl.spin * 0.9);
            tgt = next;
          } else {
            fl.phase = "idle";
          }
        }
      } else if (fl.phase === "enter") {
        const t = Math.min(1, (now - fl.t0) / ENTER_MS);
        rotateScene(tgt, -fl.spin * 0.9 * (1 - easeInOut(t)) * 0.35);
        if (t >= 1) fl.phase = "idle";
      }

      approach(cur, tgt, dt, snapMode ? 1000 : fl.phase === "exit" ? 6.5 : fl.phase === "enter" ? 4.4 : 7.5);

      // ── upload main shapes ──
      for (let i = 0; i < MAIN_SHAPES; i++) {
        const s = cur.shapes[i];
        const o = i * 4;
        aArr[o] = s.cx * dpr;
        aArr[o + 1] = (H - (s.cy - sy)) * dpr;       // page -> viewport y, then flip: DOM is top-down, gl_FragCoord bottom-up
        aArr[o + 2] = Math.max(s.hw, 0) * dpr;
        aArr[o + 3] = Math.max(s.hh, 0) * dpr;
        bArr[o] = Math.max(s.r, 0) * dpr;
        bArr[o + 1] = s.col[0]; bArr[o + 2] = s.col[1]; bArr[o + 3] = s.col[2];
      }
      // ── tiny floating blobs (viewport space) ──
      const tiny = stepFloaters(floaters, dt, time, W, H, pointer, night, reducedMotion);
      for (let j = 0; j < tiny.length && MAIN_SHAPES + j < MAX_SHAPES; j++) {
        const s = tiny[j];
        const o = (MAIN_SHAPES + j) * 4;
        aArr[o] = s.cx * dpr;
        aArr[o + 1] = (H - s.cy) * dpr;
        aArr[o + 2] = s.hw * dpr;
        aArr[o + 3] = s.hh * dpr;
        bArr[o] = s.r * dpr;
        bArr[o + 1] = s.col[0]; bArr[o + 2] = s.col[1]; bArr[o + 3] = s.col[2];
      }
      for (let i = 0; i < 4; i++) { palArr[i * 3] = cur.pal[i][0]; palArr[i * 3 + 1] = cur.pal[i][1]; palArr[i * 3 + 2] = cur.pal[i][2]; }

      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uUnit, 0.5 * Math.min(canvas.width, canvas.height));
      gl.uniform1f(U.uDpr, dpr);
      gl.uniform1f(U.uScroll, sy * dpr);
      gl.uniform1f(U.uNight, night);
      gl.uniform4fv(U.uA, aArr);
      gl.uniform4fv(U.uB, bArr);
      gl.uniform3fv(U.uPal, palArr);
      gl.uniform1f(U.uK, cur.k * dpr);
      gl.uniform1f(U.uKt, 26 * dpr * Math.max(1, Math.min(W, H) / 800));
      gl.uniform1f(U.uMarble, cur.marble);
      gl.uniform1f(U.uGlass, cur.glass);
      gl.uniform1f(U.uWarp, reducedMotion ? 0 : cur.warp);
      gl.uniform1f(U.uLines, cur.lines);
      gl.uniform1f(U.uBevel, cur.bevel * dpr);
      gl.uniform1f(U.uWob, cur.wob * dpr * (reducedMotion ? 0 : 1));
      gl.uniform1f(U.uShadow, cur.shadow);
      gl.uniform1f(U.uSmoke, reducedMotion ? cur.smoke * 0.6 : cur.smoke);
      gl.uniform1f(U.uSun, cur.sun);
      gl.uniform1f(U.uTexOn, dayFade);
      gl.uniform1f(U.uTexNOn, nightFade);
      gl.uniform3f(U.uTexMix, cur.tex[0], cur.tex[1], cur.tex[2]);
      gl.uniform2f(U.uSeed, cur.seed[0], cur.seed[1]);
      // centroid of the main liquid so the marble texture travels with it
      const cc = centroid(cur.shapes, sy);
      if (cc) gl.uniform2f(U.uCenter, cc.x * dpr, (H - cc.y) * dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      // the context is opaque, so the canvas stays hidden until a real frame exists (no black flash on slow GPUs)
      if (!live) { live = true; canvas.classList.add("ll-live"); }
    };
    raf = requestAnimationFrame(frame);

    const onLost = (e) => { e.preventDefault(); stopped = true; cancelAnimationFrame(raf); onUnsupported(); };
    canvas.addEventListener("webglcontextlost", onLost);

    // Note: do not call loseContext() here. React StrictMode re-runs this effect on the same canvas,
    // and getContext() would hand back the dead context. Free our own resources instead.
    return () => {
      stopped = true;
      texStopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost);
      texObjs.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, [reducedMotion]);

  return <canvas ref={ref} className="ll-canvas" aria-hidden="true" />;
}
