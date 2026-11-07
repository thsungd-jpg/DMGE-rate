import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { frameSequence } from "./framePlayer";
import "./world.css";
import "./pages.css";

import sky from "./assets/sky.webp";
import saturn from "./assets/piece-saturn.webp";
import planetA from "./assets/piece-planet-a.webp";
import planetB from "./assets/piece-planet-b.webp";
import crescent from "./assets/piece-crescent.webp";
import bigStar from "./assets/piece-rainbow.webp"; // (the files are named from an earlier idea: this one is the big four-point star)
import wave from "./assets/piece-wave.webp";
import arc from "./assets/piece-star4.webp"; // ...and this one is the small rainbow arc
import star6 from "./assets/piece-star6.webp";
import jelly0 from "./assets/jelly-0.webp";
import jelly1 from "./assets/jelly-1.webp";
import jelly2 from "./assets/jelly-2.webp";
import jelly3 from "./assets/jelly-3.webp";
import jelly4 from "./assets/jelly-4.webp";
import jelly5 from "./assets/jelly-5.webp";
import jelly6 from "./assets/jelly-6.webp";

// The scene behind a page: the landing's starfield with its cut-paper pieces and the jelly. A page is a list of stations; moving to one is a camera move across
// the collage (pieces slide by different amounts, so the far ones lag) while the jelly turns into its next pose. Nothing here is interactive.
const POSES = [jelly0, jelly1, jelly2, jelly3, jelly4, jelly5, jelly6]; // 704 px, transparent, evenly spaced along the landing's jelly turn (scripts/make-jelly-poses.mjs)
const SIZE = 704;

// x, y: where the piece sits on the first station (% of the screen); w: its width in vmin; d: depth (how far the camera carries it: 0 stays with the sky);
// r: its tilt; t: seconds one float takes; o: opacity, for pieces that sit behind text.
const PIECES = [
  { src: saturn,   x: 86, y: 27, w: 24, d: 0.55, r: -10, t: 15, ph: { x: 91, y: 57, w: 19 } },
  { src: planetA,  x: 67, y: 74, w: 15, d: 0.80, r: 0,   t: 18, ph: { x: 76, y: 72, w: 14, o: 0.9 } },
  { src: planetB,  x: 83, y: 89, w: 9,  d: 0.35, r: 8,   t: 16, o: 0.85, ph: { x: 80, y: 91, w: 12, o: 0.7 } },
  { src: crescent, x: 95, y: 70, w: 11, d: 0.90, r: 16,  t: 14, ph: { x: 94, y: 80, w: 12 } },
  { src: bigStar,  x: 60, y: 8,  w: 14, d: 0.60, r: -14, t: 12, ph: { x: 73, y: 5, w: 12 } },
  { src: wave,     x: 79, y: 90, w: 13, d: 1.10, r: 0,   t: 13, ph: { x: 90, y: 40, w: 11, o: 0.85 } },
  { src: arc,      x: 64, y: 27, w: 9,  d: 0.70, r: 12,  t: 11, ph: { x: 82, y: 49, w: 9 } },
  { src: star6,    x: 94, y: 46, w: 8,  d: 0.45, r: -6,  t: 10, ph: { x: 92, y: 66, w: 8 } },
];
const ORB = { x: 73, y: 47, w: 58, d: 1.2 };
const ORB_PHONE = { x: 86, y: 10, w: 40, d: 1.2 };
const ORB_PHONE_PRICE = { x: 98, y: 44, w: 78, d: 1.2 };

// One camera position per station (Craft, Job, Rate, Who, Rights, Extras, Price): pan (% of the screen), zoom, spin of the pieces, and the jelly's pose.
const CAMERA = [
  { x: 0,  y: 0,  z: 1,    spin: 0,   pose: 0 },
  { x: -7, y: 5,  z: 1.07, spin: 12,  pose: 1 },
  { x: 3,  y: 2,  z: 1.1,  spin: -4,  pose: 2 },
  { x: -3, y: -7, z: 1.14, spin: -10, pose: 3 },
  { x: 7,  y: -3, z: 1.05, spin: 16,  pose: 4 },
  { x: -9, y: -9, z: 1.16, spin: -14, pose: 5 },
  { x: -2, y: 2,  z: 1.26, spin: 8,   pose: 6 },
];

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** `scene` is the station number (0 to 6). The cream light of the arrival comes back behind the last one. */
export default function Stage({ scene = 0, calm = false }) {
  const root = useRef(null), skyEl = useRef(null), orbEl = useRef(null), orbCanvas = useRef(null), bloomEl = useRef(null), pieceEls = useRef([]);
  const sceneRef = useRef(scene), apply = useRef(() => {}), pose = useRef({ v: CAMERA[scene].pose }), seq = useRef(null);
  const turns = useRef(0), prevScene = useRef(scene), fade = useRef(null); // the orb takes one turn per station change (forward or back) and dips softly in opacity as it goes

  useEffect(() => {
    const el = root.current;
    const seqq = frameSequence(orbCanvas.current, POSES, { width: SIZE, height: SIZE, loopFrom: 0, blend: true, alpha: true, ahead: 2, behind: 2, keep: 2 });
    seq.current = seqq; seqq.show(pose.current.v); seqq.preload();
    gsap.set([orbEl.current, ...pieceEls.current], { xPercent: -50, yPercent: -50 });

    // Put everything where station i has it: tweened when animate is true, at once otherwise.
    apply.current = (i, animate) => {
      const W = window.innerWidth, H = window.innerHeight, u = Math.min(W, H) / 100, phone = W < 701, cam = CAMERA[i], k = phone ? 1.7 : 1;
      const go = (target, vars) => (animate ? gsap.to(target, { ...vars, duration: 1.15, ease: "power3.inOut", overwrite: "auto" }) : gsap.set(target, vars));
      go(skyEl.current, { x: cam.x * W / 100 * 0.2, y: cam.y * H / 100 * 0.2, scale: 1 + (cam.z - 1) * 0.6 });
      PIECES.forEach((base, n) => {
        const p = phone ? { ...base, ...base.ph } : base; // phones: the top is left to the text, so the pieces sit lower and at the edges
        const node = pieceEls.current[n];
        node.style.width = p.w * u * k + "px";
        go(node, { x: (p.x + cam.x * p.d) * W / 100, y: (p.y + cam.y * p.d) * H / 100, rotation: p.r + cam.spin * p.d, scale: 1 + (cam.z - 1) * p.d * 1.5, opacity: p.o ?? 1 });
      });
      const last = i === CAMERA.length - 1;
      // On a phone the text fills the width, so the orb tucks into the top corner (behind the buttons) and only comes forward, large, behind the price.
      const o = phone ? (last ? ORB_PHONE_PRICE : ORB_PHONE) : ORB;
      const reach = phone ? 0.25 : 1; // how far the camera carries it
      orbEl.current.style.width = orbEl.current.style.height = o.w * u + "px";
      const ox = (o.x + cam.x * o.d * reach) * W / 100, oy = (o.y + cam.y * o.d * reach) * H / 100;
      go(orbEl.current, { x: ox, y: oy, rotation: cam.spin * 0.6 + turns.current * 360, scale: phone ? 1 : (1 + (cam.z - 1) * o.d * 1.3) * (last ? 1.1 : 1) });
      el.style.setProperty("--bx", (ox / W * 100).toFixed(1) + "%"); el.style.setProperty("--by", (oy / H * 100).toFixed(1) + "%");
      go(bloomEl.current, { opacity: last ? 1 : 0 });
      if (animate) gsap.to(pose.current, { v: cam.pose, duration: 1.15, ease: "power2.inOut", overwrite: "auto", onUpdate: () => seqq.show(pose.current.v) });
      else { pose.current.v = cam.pose; seqq.show(cam.pose); }
    };
    apply.current(sceneRef.current, false);

    const onResize = () => apply.current(sceneRef.current, false);
    const onMove = (e) => { el.style.setProperty("--px", (e.clientX / window.innerWidth - 0.5).toFixed(3)); el.style.setProperty("--py", (e.clientY / window.innerHeight - 0.5).toFixed(3)); };
    window.addEventListener("resize", onResize);
    if (!reducedMotion()) window.addEventListener("pointermove", onMove, { passive: true });

    // tell the page when the first picture is up (the arrival from the landing waits for this before it opens its iris)
    let gone = false;
    const ready = () => { if (!gone) requestAnimationFrame(() => el.setAttribute("data-live", "")); };
    if (skyEl.current?.decode) skyEl.current.decode().then(ready, ready); else ready();

    return () => {
      gone = true; window.removeEventListener("resize", onResize); window.removeEventListener("pointermove", onMove);
      gsap.killTweensOf([skyEl.current, orbEl.current, bloomEl.current, pose.current, ...pieceEls.current]); seqq.destroy();
    };
  }, []);

  useEffect(() => {
    const animate = !reducedMotion(), changed = scene !== prevScene.current;
    if (changed && animate) {
      turns.current += scene > prevScene.current ? 1 : -1;
      fade.current?.kill();
      fade.current = gsap.timeline().to(orbEl.current, { opacity: 0.55, duration: 0.5, ease: "sine.in" }).to(orbEl.current, { opacity: 1, duration: 0.65, ease: "sine.out" });
    }
    prevScene.current = scene; sceneRef.current = scene;
    apply.current(scene, animate);
  }, [scene]);

  return createPortal(
    <div className={"qw-stage" + (calm ? " qw-stage--calm" : "")} ref={root} aria-hidden="true">
      <div className="qw-wash" />
      <img className="qw-sky" ref={skyEl} src={sky} alt="" />
      <div className="qw-bloom" ref={bloomEl} />
      {PIECES.map((p, n) => (
        <div className="qw-piece" key={n} ref={(node) => { pieceEls.current[n] = node; }}>
          <img src={p.src} alt="" style={{ "--d": p.d, "--t": p.t + "s" }} />
        </div>
      ))}
      <div className="qw-orb" ref={orbEl}><canvas ref={orbCanvas} /></div>
    </div>,
    document.body,
  );
}
