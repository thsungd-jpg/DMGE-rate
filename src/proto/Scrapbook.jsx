import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

import sky from "./assets/sky.webp";
import clapper from "./assets/clapper.webp";
import vinyl from "./assets/vinyl.webp";
import paint from "./assets/paint.webp";
import gem from "./assets/gem.webp";
import saturn from "./assets/piece-saturn.webp";
import planetA from "./assets/piece-planet-a.webp";
import planetB from "./assets/piece-planet-b.webp";
import crescent from "./assets/piece-crescent.webp";
import rainbow from "./assets/piece-rainbow.webp";
import wave from "./assets/piece-wave.webp";
import star4 from "./assets/piece-star4.webp";
import star6 from "./assets/piece-star6.webp";

gsap.registerPlugin(ScrollTrigger);

// jelly frame sequence (generated from the Kling clip); falls back to the still mark when no frames exist yet
const frameUrls = Object.entries(import.meta.glob("./assets/frames/*.webp", { eager: true, query: "?url", import: "default" }))
  .sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url);

const OBJECTS = [
  { id: "clapper", label: "Film and TV", src: clapper, x: 17, y: 30, w: 22, rot: -8, spin: false },
  { id: "vinyl", label: "Music", src: vinyl, x: 83, y: 26, w: 21, rot: 6, spin: true },
  { id: "paint", label: "Visual arts", src: paint, x: 19, y: 74, w: 22, rot: 10, spin: false },
  { id: "gem", label: "Featured crafts", src: gem, x: 81, y: 72, w: 19, rot: -6, spin: false },
];
const PIECES = [
  { src: saturn, x: 8, y: 12, w: 15, d: 0.5, t: 14 }, { src: planetA, x: 90, y: 10, w: 12, d: 0.7, t: 18 },
  { src: crescent, x: 50, y: 6, w: 7, d: 0.4, t: 16 }, { src: rainbow, x: 6, y: 50, w: 16, d: 0.9, t: 20 },
  { src: wave, x: 93, y: 50, w: 14, d: 0.8, t: 17 }, { src: star4, x: 30, y: 90, w: 8, d: 1.1, t: 12 },
  { src: star6, x: 68, y: 92, w: 7, d: 1.2, t: 13 }, { src: planetB, x: 46, y: 96, w: 9, d: 0.6, t: 19 },
];
const MESSAGE = "Every craft carries a different price. Yours deserves to be priced like it.";

export default function Scrapbook() {
  const root = useRef(null);
  const jelly = useRef(null);
  const [pct, setPct] = useState(0);
  const [chapter, setChapter] = useState("Open");
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = root.current;
    if (reduced) { el.classList.add("sb-reduced"); drawFrame(0.5); return undefined; }

    const lenis = new Lenis({ lerp: 0.09 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);

    // ---- jelly canvas ----
    const frames = [];
    let loaded = 0;
    frameUrls.forEach((u, i) => { const im = new Image(); im.onload = () => { loaded++; if (i === 0) drawFrame(0); }; im.src = u; frames[i] = im; });
    const still = new Image(); still.src = new URL("../assets/brand/mark-512.png", import.meta.url).href; still.onload = () => !frameUrls.length && drawFrame(0);
    function drawFrame(p) {
      const c = jelly.current; if (!c) return;
      const ctx = c.getContext("2d"); ctx.clearRect(0, 0, c.width, c.height);
      const im = frameUrls.length ? frames[Math.min(frames.length - 1, Math.floor(p * (frames.length - 1)))] : still;
      if (im && im.complete && im.naturalWidth) ctx.drawImage(im, 0, 0, c.width, c.height);
    }
    const prog = { p: 0 };

    // ---- opening (plays on load) ----
    const open = gsap.timeline({ delay: 0.3 });
    open.from(".sb-line > span", { yPercent: 115, duration: 1.1, ease: "power4.out", stagger: 0.12 })
        .from(".sb-jelly-wrap", { yPercent: 28, opacity: 0, duration: 1.6, ease: "power3.out" }, 0.1)
        .from(".sb-hint", { opacity: 0, duration: 1 }, 1);

    // ---- scroll timeline ----
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".sb-track", start: "top top", end: "bottom bottom", scrub: 0.6,
        onUpdate: (self) => { setPct(Math.round(self.progress * 100)); setChapter(self.progress < 0.12 ? "Open" : self.progress < 0.38 ? "Threshold" : self.progress < 0.86 ? "Your craft" : "Begin"); } },
    });
    // 0.00-0.12 headline leaves
    tl.to(".sb-hero", { opacity: 0, yPercent: -12, duration: 0.1 }, 0.04)
      .to(".sb-hint", { opacity: 0, duration: 0.05 }, 0.02)
    // 0.10-0.20 threshold: scene dims to black, jelly shrinks
      .to(".sb-dim", { opacity: 0.96, duration: 0.1 }, 0.1)
      .to(".sb-jelly-wrap", { scale: 0.5, duration: 0.1 }, 0.1)
      .to(".sb-pieces", { opacity: 0.1, duration: 0.1 }, 0.1)
    // 0.18-0.32 message words light up
      .to(".sb-message", { opacity: 1, duration: 0.03 }, 0.15)
      .to(".sb-word", { opacity: 1, duration: 0.01, stagger: 0.012 }, 0.18)
    // 0.34-0.42 message leaves, light returns
      .to(".sb-message", { opacity: 0, yPercent: -10, duration: 0.06 }, 0.34)
      .to(".sb-dim", { opacity: 0, duration: 0.08 }, 0.36)
      .to(".sb-pieces", { opacity: 1, duration: 0.08 }, 0.36)
      .to(".sb-jelly-wrap", { scale: 1, duration: 0.1 }, 0.36)
    // 0.40-0.62 objects fly in to their places and the camera pans
      .fromTo(".sb-obj", { opacity: 0, scale: 0.3, x: (i) => (i % 2 ? 260 : -260), y: (i) => (i < 2 ? -160 : 160), rotation: (i) => (i % 2 ? 40 : -40) },
        { opacity: 1, scale: 1, x: 0, y: 0, rotation: (i) => OBJECTS[i].rot, duration: 0.2, stagger: 0.03 }, 0.4)
      .fromTo(".sb-pick", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.06 }, 0.52)
      .to(".sb-world", { scale: 1.18, xPercent: -4, duration: 0.3 }, 0.55)
    // 0.86-1 settle: call to action
      .to(".sb-pick", { opacity: 0, duration: 0.05 }, 0.84)
      .to(".sb-world", { scale: 1, xPercent: 0, duration: 0.12 }, 0.86)
      .to(".sb-jelly-wrap", { scale: 0.7, yPercent: -16, duration: 0.12 }, 0.86)
      .fromTo(".sb-cta", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.1 }, 0.9)
      .to(prog, { p: 1, duration: 1, onUpdate: () => drawFrame(prog.p) }, 0);   // jelly scrubs through its frames across the whole journey

    // ---- cursor parallax (far layers lean) ----
    const move = (e) => { el.style.setProperty("--px", (e.clientX / window.innerWidth - 0.5).toFixed(3)); el.style.setProperty("--py", (e.clientY / window.innerHeight - 0.5).toFixed(3)); };
    window.addEventListener("pointermove", move, { passive: true });

    const resize = () => { const c = jelly.current; if (!c) return; const s = Math.min(window.innerHeight * 0.78, window.innerWidth * 0.8); c.width = c.height = Math.round(s * Math.min(2, window.devicePixelRatio || 1)); c.style.width = c.style.height = s + "px"; drawFrame(prog.p); };
    resize(); window.addEventListener("resize", resize);

    return () => { window.removeEventListener("pointermove", move); window.removeEventListener("resize", resize); gsap.ticker.remove(tick); lenis.destroy(); tl.scrollTrigger?.kill(); tl.kill(); open.kill(); };
  }, [reduced]);

  // click: ink splat at the pointer
  const splat = (e) => {
    const r = root.current.getBoundingClientRect();
    const s = document.createElement("i"); s.className = "sb-splat";
    s.style.left = e.clientX - r.left + "px"; s.style.top = e.clientY - r.top + "px";
    s.style.setProperty("--c", ["#FF9EC7", "#8EC5FF", "#9BF0C8", "#FFE98A", "#C7B8FF"][Math.floor(Math.random() * 5)]);
    root.current.appendChild(s); setTimeout(() => s.remove(), 900);
  };

  return (
    <div className="sb-root" ref={root} onPointerDown={splat}>
      <div className="sb-stage" aria-hidden="true">
        <div className="sb-world">
          <img className="sb-sky" src={sky} alt="" />
          <div className="sb-pieces">
            {PIECES.map((p, i) => (
              <img key={i} src={p.src} alt="" className="sb-piece" style={{ left: p.x + "%", top: p.y + "%", width: p.w + "vmin", "--d": p.d, animationDuration: p.t + "s" }} />
            ))}
          </div>
          <div className="sb-jelly-wrap"><canvas ref={jelly} className="sb-jelly" /></div>
          {OBJECTS.map((o) => (
            <button key={o.id} type="button" tabIndex={-1} className={"sb-obj" + (o.spin ? " is-spin" : "")} data-id={o.id}
              style={{ left: o.x + "%", top: o.y + "%", width: o.w + "vmin", "--rot": o.rot + "deg" }}>
              <img src={o.src} alt="" draggable="false" />
              <span className="sb-tag">{o.label}</span>
            </button>
          ))}
        </div>
        <div className="sb-dim" />
      </div>

      <main className="sb-track">
        <section className="sb-hero">
          <h1 className="sb-h1" aria-label="Know what your work is worth.">
            <span className="sb-line"><span>Know what your</span></span>
            <span className="sb-line"><span><em>work</em> is worth.</span></span>
          </h1>
        </section>
        <p className="sb-hint">Scroll to start</p>
        <p className="sb-message" aria-label={MESSAGE}>{MESSAGE.split(" ").map((w, i) => <span key={i} className="sb-word" aria-hidden="true">{w}{" "}</span>)}</p>
        <p className="sb-pick">Pick your <em>craft.</em></p>
        <div className="sb-cta">
          <h2>Your next quote <em>starts here.</em></h2>
          <a className="sb-btn" href="/">Start pricing</a>
        </div>
        <div className="sb-hud" aria-hidden="true"><span>{String(pct).padStart(3, "0")}%</span><span>{chapter}</span></div>
      </main>
    </div>
  );
}
