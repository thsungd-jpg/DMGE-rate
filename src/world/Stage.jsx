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
  { src: saturn,   spin: true, x: 91, y: 21, w: 24, d: 0.55, r: -10, t: 15, ph: { x: 100, y: 52, w: 19, o: 0.5 } },
  { src: planetA,  spin: true, x: 70, y: 88, w: 15, d: 0.80, r: 0,   t: 18, ph: { x: 96, y: 74, w: 14, o: 0.5 } },
  { src: planetB,  spin: true, x: 82, y: 94, w: 9,  d: 0.35, r: 8,   t: 16, o: 0.85, ph: { x: 90, y: 93, w: 12, o: 0.45 } },
  { src: crescent, spin: true, x: 96, y: 66, w: 11, d: 0.90, r: 16,  t: 14, ph: { x: 98, y: 86, w: 12, o: 0.5 } },
  { src: bigStar,  spin: true, x: 58, y: 9,  w: 15, d: 0.60, r: -14, t: 12, ph: { x: 72, y: 5, w: 12 } },
  { src: wave,     x: 80, y: 8,  w: 13, d: 1.10, r: 0,   t: 13, ph: { hide: true } },
  { src: arc,      x: 97, y: 44, w: 9,  d: 0.70, r: 12,  t: 11, ph: { hide: true } },
  { src: star6,    spin: true, x: 92, y: 86, w: 8,  d: 0.45, r: -6,  t: 10, ph: { x: 97, y: 64, w: 8, o: 0.55 } },
];
// What each piece does is picked at random, once per visit, so no two are alike: some stay perfectly still, some bob or sway, some turn slowly, some wander a little
// (and a few do both). Only the planets and stars may spin; the rainbow arc and the wave just bob, sway, wander or rest. Never all alike: at least one is still and at
// least three move. Reduced motion switches all of it off in world.css.
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (list) => list[Math.floor(Math.random() * list.length)];
const sign = () => (Math.random() < 0.5 ? -1 : 1);
const SPINNERS = ["still", "still", "bob", "sway", "spin", "spin", "wander", "spinwander", "spinwander"];
const OTHERS = ["still", "bob", "sway", "wander", "wander"];
function motionFor(kind) {
  const anim = [], vars = {}, delay = () => `${(-rnd(0, 24)).toFixed(1)}s`;
  if (kind === "bob") anim.push(`qwFloat ${rnd(9, 17).toFixed(1)}s ease-in-out ${delay()} infinite alternate`);
  if (kind === "sway") { vars["--sw"] = `${rnd(5, 15).toFixed(1)}deg`; anim.push(`qwSway ${rnd(7, 15).toFixed(1)}s ease-in-out ${delay()} infinite alternate`); }
  if (kind === "spin" || kind === "spinwander") anim.push(`qwSpin ${rnd(28, 95).toFixed(0)}s linear ${delay()} infinite ${Math.random() < 0.5 ? "reverse" : "normal"}`);
  if (kind === "wander" || kind === "spinwander") {
    vars["--dx"] = `${(sign() * rnd(1.2, 3.4)).toFixed(2)}vmin`; vars["--dy"] = `${(sign() * rnd(1, 2.8)).toFixed(2)}vmin`;
    anim.push(`qwDrift ${rnd(16, 38).toFixed(1)}s ease-in-out ${delay()} infinite`);
  }
  return { ...vars, ...(anim.length ? { animation: anim.join(", ") } : {}) };
}
function pieceMotions() {
  const kinds = PIECES.map((p) => pick(p.spin ? SPINNERS : OTHERS));
  if (!kinds.includes("still")) kinds[Math.floor(Math.random() * kinds.length)] = "still";
  while (kinds.filter((k) => k !== "still").length < 3) { const i = Math.floor(Math.random() * kinds.length); if (kinds[i] === "still") kinds[i] = pick(["bob", "sway", "wander"]); }
  return kinds.map(motionFor);
}

// The scene is the right 61.8% of the screen and the content column the left 38.2%: the blob sits at the middle of the scene, and the camera may carry it only a little
// to the left (so it never goes behind the column) and further to the right. On the other screens it is smaller and tucked into the lower right.
const ORB = { x: 69, y: 45, w: 58, d: 1.2 };
const ORB_CALM = { x: 88, y: 72, w: 36, d: 0.4 };
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const ORB_PHONE = { x: 88, y: 3, w: 34, d: 1.2 }; // tucked into the top corner, behind the buttons, clear of the title (measured: no title line enters the blob on any step or page, 320 to 430 px wide)
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
  const calmRef = useRef(calm); calmRef.current = calm;
  const motions = useRef(null);
  if (!motions.current) motions.current = pieceMotions();
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
        node.style.width = (p.w || base.w) * u * k + "px";
        go(node, { x: (p.x + cam.x * p.d) * W / 100, y: (p.y + cam.y * p.d) * H / 100, rotation: p.r + cam.spin * p.d, scale: 1 + (cam.z - 1) * p.d * 1.5, opacity: p.hide ? 0 : (p.o ?? 1) * (calmRef.current && !phone ? 0.6 : 1) });
      });
      const last = i === CAMERA.length - 1;
      // On a phone the text fills the width, so the orb tucks into the top corner (behind the buttons) and only comes forward, large, behind the price.
      const calmNow = calmRef.current && !phone;
      const o = phone ? (last && !calmRef.current ? ORB_PHONE_PRICE : ORB_PHONE) : calmNow ? ORB_CALM : ORB;
      const reach = phone ? 0.25 : 1; // how far the camera carries it
      orbEl.current.style.width = orbEl.current.style.height = o.w * u + "px";
      const lift = last && !calmNow && !phone ? 3 : 0; // behind the price it comes a little forward and to the right
      const ox = (o.x + lift + clamp(cam.x * o.d * reach, -3, 5)) * W / 100, oy = (o.y + clamp(cam.y * o.d * reach, phone ? 0 : -5, 5)) * H / 100; // on a phone it may sink a little with the camera but never rise out of sight behind the top bar
      go(orbEl.current, { x: ox, y: oy, rotation: cam.spin * 0.6 + turns.current * 360, scale: phone ? 1 : (1 + (cam.z - 1) * o.d * 0.8) * (last && !calmNow ? 1.06 : 1) });
      el.style.setProperty("--bx", (ox / W * 100).toFixed(1) + "%"); el.style.setProperty("--by", (oy / H * 100).toFixed(1) + "%");
      go(bloomEl.current, { opacity: last && !calmRef.current ? 1 : 0 });
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
  }, [scene, calm]);

  return createPortal(
    <div className={"qw-stage" + (calm ? " qw-stage--calm" : "")} ref={root} aria-hidden="true">
      <div className="qw-wash" />
      <img className="qw-sky" ref={skyEl} src={sky} alt="" />
      <div className="qw-bloom" ref={bloomEl} />
      {PIECES.map((p, n) => (
        <div className="qw-piece" key={n} ref={(node) => { pieceEls.current[n] = node; }}>
          <img src={p.src} alt="" style={{ "--d": p.d, ...motions.current[n] }} />
        </div>
      ))}
      <div className="qw-orb" ref={orbEl}><canvas ref={orbCanvas} /></div>
    </div>,
    document.body,
  );
}
