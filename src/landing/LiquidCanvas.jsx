import React, { useEffect, useRef } from "react";
import { VERT, FRAG, MAX_SHAPES } from "./liquid.glsl";
import { computeTarget, approach, pointer } from "./scene";
import marble1 from "../assets/art/marble-1-1024.webp";
import marble2 from "../assets/art/marble-2-1024.webp";
import marble3 from "../assets/art/marble-3-1024.webp";

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

/**
 * Fixed full-viewport WebGL canvas that renders the liquid scene from ./scene.
 * onUnsupported() fires if WebGL or the shader is unavailable so the page can show its static fallback.
 */
export default function LiquidCanvas({ onUnsupported: onUnsupportedProp, reducedMotion = false }) {
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
    if (!gl) { onUnsupported?.(); return undefined; }

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
      onUnsupported?.();
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
    ["uRes", "uTime", "uUnit", "uK", "uMarble", "uLines", "uBevel", "uWob", "uShadow", "uMouse"].forEach((n) => { U[n] = gl.getUniformLocation(program, n); });
    U.uA = gl.getUniformLocation(program, "uA");
    U.uB = gl.getUniformLocation(program, "uB");
    U.uPal = gl.getUniformLocation(program, "uPal");

    ["uTexMix", "uTexOn", "uSeed", "uCenter", "uTex0", "uTex1", "uTex2"].forEach((n) => { U[n] = gl.getUniformLocation(program, n); });
    gl.uniform1i(U.uTex0, 0); gl.uniform1i(U.uTex1, 1); gl.uniform1i(U.uTex2, 2);

    // marble textures: 1x1 cream placeholder until each image decodes; shader fades them in once all are ready
    let texLoaded = 0, texFade = 0, stoppedLoading = false;
    const texObjs = [marble1, marble2, marble3].map((url, i) => {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 246, 232, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        if (stoppedLoading) return;
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        texLoaded += 1;
      };
      img.src = url;
      return tex;
    });

    const aArr = new Float32Array(MAX_SHAPES * 4);
    const bArr = new Float32Array(MAX_SHAPES * 4);
    const palArr = new Float32Array(12);

    const isTouch = window.matchMedia?.("(pointer: coarse)").matches;
    const maxDpr = isTouch ? 1.25 : 1.6;
    let dpr = 1, W = 0, H = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const cur = {};
    if (import.meta.env.DEV) window.__llCur = cur; // dev-only: inspect live shape state while testing
    let raf = 0, last = performance.now(), time = 0, stopped = false;

    const frame = (now) => {
      if (stopped) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) { last = now; return; }

      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!reducedMotion) time += dt;

      const target = computeTarget(W, H);
      if (!target) return;
      // Smooth in PAGE space (viewport y + scrollY) so plain scrolling adds no lag: the liquid stays glued to
      // its DOM anchors and only chapter-to-chapter morphs are eased.
      const sy = window.scrollY || 0;
      for (let i = 0; i < MAX_SHAPES; i++) target.shapes[i].cy += sy;
      // window.__llSnap is a dev/testing switch: skip easing so layout alignment can be checked deterministically
      approach(cur, target, dt, reducedMotion || window.__llSnap ? 1000 : 7.5);

      for (let i = 0; i < MAX_SHAPES; i++) {
        const s = cur.shapes[i];
        const o = i * 4;
        aArr[o] = s.cx * dpr;
        aArr[o + 1] = (H - (s.cy - sy)) * dpr;       // back to viewport y, then flip: DOM is top-down, gl_FragCoord bottom-up
        aArr[o + 2] = Math.max(s.hw, 0) * dpr;
        aArr[o + 3] = Math.max(s.hh, 0) * dpr;
        bArr[o] = Math.max(s.r, 0) * dpr;
        bArr[o + 1] = s.col[0]; bArr[o + 2] = s.col[1]; bArr[o + 3] = s.col[2];
      }
      for (let i = 0; i < 4; i++) { palArr[i * 3] = cur.pal[i][0]; palArr[i * 3 + 1] = cur.pal[i][1]; palArr[i * 3 + 2] = cur.pal[i][2]; }

      gl.uniform2f(U.uRes, canvas.width, canvas.height);
      gl.uniform1f(U.uTime, time);
      gl.uniform1f(U.uUnit, 0.5 * Math.min(canvas.width, canvas.height));
      gl.uniform4fv(U.uA, aArr);
      gl.uniform4fv(U.uB, bArr);
      gl.uniform3fv(U.uPal, palArr);
      gl.uniform1f(U.uK, cur.k * dpr);
      gl.uniform1f(U.uMarble, cur.marble);
      gl.uniform1f(U.uLines, cur.lines);
      gl.uniform1f(U.uBevel, cur.bevel * dpr);
      gl.uniform1f(U.uWob, cur.wob * dpr * (reducedMotion ? 0 : 1));
      gl.uniform1f(U.uShadow, cur.shadow);
      gl.uniform2f(U.uMouse, pointer.x * canvas.width, (1 - pointer.y) * canvas.height);
      if (texLoaded >= 3 && texFade < 1) texFade = Math.min(1, texFade + dt * 1.2);
      gl.uniform1f(U.uTexOn, texFade);
      gl.uniform3f(U.uTexMix, cur.tex[0], cur.tex[1], cur.tex[2]);
      gl.uniform2f(U.uSeed, cur.seed[0], cur.seed[1]);
      // centroid of the active shapes, so the marble texture travels with the liquid
      let cxs = 0, cys = 0, cn = 0;
      for (let i = 0; i < MAX_SHAPES; i++) { const s = cur.shapes[i]; if (s.hw > 0.5) { cxs += s.cx; cys += s.cy - sy; cn += 1; } }
      if (cn) gl.uniform2f(U.uCenter, (cxs / cn) * dpr, (H - cys / cn) * dpr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    const onLost = (e) => { e.preventDefault(); stopped = true; cancelAnimationFrame(raf); onUnsupported?.(); };
    canvas.addEventListener("webglcontextlost", onLost);

    // Note: do not call loseContext() here. React StrictMode re-runs this effect on the same canvas,
    // and getContext() would hand back the dead context. Free our own resources instead.
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost);
      stoppedLoading = true;
      texObjs.forEach((t) => gl.deleteTexture(t));
      gl.deleteBuffer(buf);
      gl.deleteProgram(program);
    };
  }, [reducedMotion]);

  return <canvas ref={ref} className="ll-canvas" aria-hidden="true" />;
}
