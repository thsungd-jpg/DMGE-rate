import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { frameSequence } from "../world/framePlayer";
import { SAYINGS } from "./sayings";

import sky from "./assets/sky.webp";
import saturn from "./assets/piece-saturn.webp";
import planetA from "./assets/piece-planet-a.webp";
import planetB from "./assets/piece-planet-b.webp";
import crescent from "./assets/piece-crescent.webp";
import rainbow from "./assets/piece-rainbow.webp";
import wave from "./assets/piece-wave.webp";
import star4 from "./assets/piece-star4.webp";
import star6 from "./assets/piece-star6.webp";

gsap.registerPlugin(ScrollTrigger);

// The animations are frame sequences (WebP frames of your clips) scrubbed by the scroll timeline: scrolling down plays them forward and scrolling back
// up plays them in reverse. Two things move by themselves: the jelly turns backwards while you are at the very top (000%), and the galaxy plays at
// the very bottom (100%).
const urlsOf = (files) => Object.entries(files).sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url);
const jellyUrls = urlsOf(import.meta.glob("./assets/jelly-seq/*.webp", { eager: true, query: "?url", import: "default" })); // your DMGE logo animation on black (the hero)
const filmUrls = urlsOf(import.meta.glob("./assets/reveal-seq/*.webp", { eager: true, query: "?url", import: "default" })); // 1280x720: the blob bursting into the galaxy, then the galaxy loop
const diveUrls = urlsOf(import.meta.glob("./assets/dive-seq/*.webp", { eager: true, query: "?url", import: "default" })); // 1280x720: the camera falling into the blob until its light fills the frame (pressing "Start pricing")
// All three sets were made with scripts/video-to-frames.mjs, which bakes in a soft glow so edges are never harsh: the jelly frames are the 940px picture in a
// 1166px canvas whose margin holds the glow spilling past the picture (it fades to black before the canvas edge), and the burst has the same glow while
// the blob is still on dark, fading out as the busy galaxy scene takes over.
const JELLY_PICTURE = 940, JELLY_FRAME = 1166;
const IDLE_FPS = 24;     // at the very top the jelly turns backwards by itself at its own speed (8 s a turn); scrolling then turns it forwards from wherever it is
const CLIP_FRAMES = 120; // the first frames of the film are the burst (24 fps, scrubbed); the rest is the galaxy loop (12 fps), which starts on the picture the burst ends on
const LOOP_FPS = 12;     // the loop's frame rate: at the very bottom of the page it plays by itself at this rate (10 s a turn)
const ORB = { x: 0.64, y: 0.488 }; // where the glowing orb sits in the film frame (measured: it stays within 1% of this through the whole loop)
// The dive: pressing "Start pricing" plays the dive clip over the whole screen, at the speed it was made at (24 fps, 5 s), and the next page opens from its last light.
const END = { x: 0.513, y: 0.47 }; // where that light is centred in the clip's last frame, as a fraction of the picture (measured)
const DIVE_FPS = 24;
const OPEN_SECS = 0.9;   // at the start the picture opens out from the film's 16:9 box until it fills the screen
const BLOOM_SECS = 0.45; // at the end the clip's last light is crossfaded into the glow the next page opens from (the gradient in index.html)
// Where the blob's core is across the clip: [how far through the clip, how far across the picture] (measured). When the picture has to be cropped to fill a
// narrow screen (a phone held upright) the crop follows it, so the blob stays in the middle of the screen.
const TRACK = [[0, 0.648], [0.25, 0.636], [0.62, 0.628], [0.83, 0.608], [0.93, 0.57], [1, 0.512]];
const follow = (p) => {
  for (let i = 1; i < TRACK.length; i++) if (p <= TRACK[i][0]) { const [p0, x0] = TRACK[i - 1], [p1, x1] = TRACK[i]; return x0 + (x1 - x0) * (p - p0) / (p1 - p0); }
  return TRACK[TRACK.length - 1][1];
};
// Where the 1280x720 picture sits on a screen g (its size, and the widths the picture has when it fits inside it and when it fills it) at clip progress p, once it
// has opened out by e (0 = the film's box, 1 = filling the screen): its size, and the top-left corner. The middle of the screen shows the picture's own middle at
// first, then, as it opens, the point it is cropped around (the blob, held as near the middle as the edges of the picture allow).
const place = (g, p, e) => {
  const S = g.fit + (g.fill - g.fit) * e, H = S * 9 / 16; // the picture's size on screen
  const half = (view, size) => Math.min(0.5, view / (2 * size)); // half of what the screen shows of it, as a fraction of it
  const hx = half(g.vw, S), hy = half(g.vh, H);
  const ux = 0.5 + (Math.min(1 - hx, Math.max(hx, follow(p))) - 0.5) * e, uy = 0.5 + (Math.min(1 - hy, Math.max(hy, END.y)) - 0.5) * e;
  return { S, H, k: S / 1280, x: g.vw / 2 - ux * S, y: g.vh / 2 - uy * H };
};
// Where "Start pricing" goes. In dev, ?mock=1 signs in as a demo user so the page the orb opens onto can be seen; theme=dark keeps the night going.
const NEXT = import.meta.env.DEV ? "/?mock=1&theme=dark" : "/?theme=dark";

const PIECES = [
  { src: saturn, x: 9, y: 52, w: 13, d: 0.5, t: 14 }, { src: planetA, x: 91, y: 50, w: 10, d: 0.7, t: 18 },
  { src: crescent, x: 50, y: 84, w: 6, d: 0.4, t: 16 }, { src: rainbow, x: 36, y: 88, w: 7, d: 1.1, t: 12 }, // the crescent arches over the scroll hint, not behind it
  { src: wave, x: 64, y: 88, w: 6.5, d: 1.2, t: 13 },
];
// The pair of lines owns this much scroll whatever its length: its words share out the reading time, then both lines rest on screen together (hold) and
// dissolve (out). beat is the pause between the two lines, counted in word steps. See the saying effect.
const MSG = { at: 0.18, span: 0.27, fade: 0.016, hold: 0.05, out: 0.03, beat: 1.5 };
const JELLY_LEN = 0.18; // the hero jelly turns once, from the top to the end of the threshold, where it has faded out

// Timeline times are fractions of 660vh of scroll (the length of the first, longer track), so the track can be resized without changing
// the pace of the earlier beats: the timeline is pinned to LEN instead of 1 and the track height follows it.
const TEXT_END = MSG.at + MSG.span; // the last word has fully faded out: pure black
const FADE_IN = 0.05;             // the film fades in from black over this much scroll, starting the moment the text is gone
const CLIP_LEN = 0.2;             // scroll given to the burst (the first CLIP_FRAMES frames of the film)
const LEN = TEXT_END + CLIP_LEN;  // timeline length: the burst ends on the galaxy at the very bottom of the page, where the galaxy starts to play
const CTA_AT = LEN - 0.05;        // the call to action fades in as the burst settles into the galaxy
const TRACK_VH = 100 + 660 * LEN; // scroll distance is the track minus one screen

// A saying marks the word or words that glow yellow, the way "work" does in the headline, with *stars*: "Risk is not knowing your *number*."
const plain = (saying) => saying.replace(/\*/g, "");
const wordsOf = (saying) => {
  let on = false;
  return saying.split(" ").map((raw) => {
    const stars = raw.split("*").length - 1, opens = raw.startsWith("*");
    if (opens) on = true;
    const word = { text: plain(raw), accent: on };
    if (stars >= 2 || (stars === 1 && !opens)) on = false; // "*word*" and "*word*." close at once; "*your" stays open until "number*"
    return word;
  });
};
const LAST_KEY = "dmge-saying"; // the saying shown last time, so a new visit starts on a different one
const pick = (not) => {
  let i;
  do { i = Math.floor(Math.random() * SAYINGS.length); } while (SAYINGS.length > 1 && i === not);
  return i;
};
const firstSaying = () => {
  let last = -1;
  try { const v = localStorage.getItem(LAST_KEY); if (v !== null) last = +v; } catch { /* private mode: no memory, still random */ }
  return pick(last);
};

export default function Scrapbook() {
  const root = useRef(null);
  const jelly = useRef(null);   // <canvas>: the logo animation in the centre
  const film = useRef(null);    // <canvas>: the blob bursting into the galaxy, then the galaxy loop
  const dive = useRef(null);    // <canvas>: the dive into the blob (empty until "Start pricing" is pressed)
  const wordsTl = useRef(null); // the timeline that fades the saying's words in and out; rebuilt whenever the saying changes
  const departRef = useRef(null); // the dive into the orb, started by the call to action (null in reduced motion, where the link just navigates)
  const [pct, setPct] = useState(0);
  const [chapter, setChapter] = useState("Open");
  const [saying, setSaying] = useState(firstSaying);
  const sayingNow = useRef(saying); sayingNow.current = saying; // the scroll handler reads this, so it never goes stale
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    const el = root.current, jc = jelly.current, fc = film.current, dc = dive.current;
    const jellySize = () => Math.min(window.innerHeight * 0.52, window.innerWidth * 0.7) * JELLY_FRAME / JELLY_PICTURE; // the picture keeps its size; the glow margin is extra
    const jellySeq = frameSequence(jc, jellyUrls, { width: JELLY_FRAME, height: JELLY_FRAME, loopFrom: 0 }); // a seamless loop: it can turn either way for ever
    if (reduced) {
      // calm version: the jelly holds a single pose, nothing is scrubbed, and the film is never fetched
      el.classList.add("sb-reduced");
      jc.style.width = jc.style.height = jellySize() + "px"; jellySeq.show(24);
      return () => jellySeq.destroy();
    }
    const filmSeq = frameSequence(fc, filmUrls, { width: 1280, height: 720, loopFrom: CLIP_FRAMES - 1, blend: true });
    const diveSeq = frameSequence(dc, diveUrls, { width: 1280, height: 720 });

    // ---- frames: the timeline below moves these two numbers, and each frame is painted from them (see framePlayer.js) ----
    const spin = { f: 0 }, reel = { f: 0 };
    // At the very top (000%) the jelly turns backwards by itself. Scrolling adds forward turns on top of wherever it has got to, so nothing jumps, and
    // scrolling back to the top lands where it left off and carries on backwards.
    let atTop = true, idleAt = 0;
    // The other exception to "only when scrolling": at the very bottom (100%) the galaxy loop plays by itself, carrying on from the last burst frame,
    // so the galaxy is never left standing still. Scrolling up from there fades the film to black; while it is dark the scroll takes the frames
    // back, and they play in reverse as it fades up again.
    let auto = false, autoAt = 0, frozen = false, fade = null; // fade: the tween or timeline that dims or brightens the film
    let diving = false; // the dive clip covers the film: nothing more is painted on it
    const showJelly = () => jellySeq.show(idleAt + spin.f), showFilm = () => { if (!frozen && !diving) filmSeq.show(auto ? autoAt : reel.f); };
    const setAuto = (on) => {
      if (on === auto) return;
      auto = on; fade?.kill();
      if (on) { if (!frozen) autoAt = CLIP_FRAMES - 1; frozen = false; fade = gsap.to(fc, { opacity: 1, duration: 0.25 }); }
      else {
        frozen = true; // the last picture stays put while it dims
        fade = gsap.timeline().to(fc, { opacity: 0, duration: 0.4, ease: "power2.in" }).add(() => { frozen = false; showFilm(); })
          .to(fc, { opacity: 1, duration: 0.7, ease: "power2.out" });
      }
    };

    const lenis = new Lenis({ lerp: 0.12 });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t, dt) => {
      lenis.raf(t * 1000);
      if (atTop) { idleAt -= Math.min(dt, 100) / 1000 * IDLE_FPS; showJelly(); }
      if (auto) { autoAt += Math.min(dt, 100) / 1000 * LOOP_FPS; showFilm(); }
    };
    gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);
    jellySeq.show(0);
    jellySeq.preload().then(() => filmSeq.preload(0, CLIP_FRAMES)).then(() => diveSeq.preload()).then(() => filmSeq.preload(CLIP_FRAMES)); // the first view loads first, then the dive (so the button can always play it), the loop last

    // ---- opening (plays on load): the headline rises. (The jelly and the hint fade in with CSS animations; see scrapbook.css.) ----
    const open = gsap.timeline({ delay: 0.3 });
    open.from(".sb-line > span", { yPercent: 115, duration: 1.1, ease: "power4.out", stagger: 0.12 });

    // ---- scroll timeline ----
    let read = false; // the saying has started to show
    let warm = false; // near the bottom the dive's first frame is decoded and painted, ready for the button
    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: { trigger: ".sb-track", start: "top top", end: "bottom bottom", scrub: true,
        onUpdate: (self) => {
          const pos = self.progress * LEN;
          atTop = self.progress < 0.003; // the counter still says 000%
          if (!atTop) el.classList.add("sb-scrolled");
          if (pos > MSG.at + 0.02) read = true;
          else if (read && pos < 0.1) { read = false; setSaying(pick(sayingNow.current)); } // back at the top: the next visit to the message shows another saying
          if (pos > JELLY_LEN + 0.04) jellySeq.release(); // far from a sequence: let go of its decoded frames
          if (pos < TEXT_END - 0.04) filmSeq.release();
          if (self.progress > 0.9) { if (!warm) { warm = true; diveSeq.show(0); } } else if (warm) { warm = false; diveSeq.release(); }
          setAuto(auto ? self.progress > 0.97 : self.progress >= 0.995); // a little give, so a nudge at the bottom does not dim the film
          setPct(Math.round(self.progress * 100));
          setChapter(pos < 0.12 ? "Open" : pos < TEXT_END ? "Threshold" : pos < CTA_AT ? "Reveal" : "Begin");
        } },
    });
    // 0.00-0.18 the jelly turns once while the headline leaves and everything fades to pure black
    tl.fromTo(spin, { f: 0 }, { f: jellyUrls.length - 1, duration: JELLY_LEN, immediateRender: false, onUpdate: showJelly }, 0)
      .to(".sb-hero", { opacity: 0, yPercent: -12, duration: 0.1 }, 0.04)
      .to(".sb-hint", { opacity: 0, duration: 0.05 }, 0.02)
    // 0.10-0.18 threshold: everything fades to pure black
      .to(".sb-dim", { opacity: 1, duration: 0.08 }, 0.1)
      .to([".sb-jelly-wrap", ".sb-pieces"], { opacity: 0, duration: 0.08 }, 0.1);
    // 0.18-0.45 the pair of lines (ends at TEXT_END): its words fade in and out inside this nested timeline, which the saying effect below fills
    const words = gsap.timeline({ defaults: { ease: "none" } });
    wordsTl.current = words; tl.add(words, MSG.at);
    tl
    // the text is gone: the film fades in from pure black (the dim stays on, so nothing but the film is lit) and starts to turn: the blob bursts
    // into the galaxy as you scroll, and scrolling back up plays the burst in reverse. It ends at the bottom, where the galaxy takes over (see setAuto).
      .to(".sb-reveal", { opacity: 1, duration: FADE_IN }, TEXT_END)
      .fromTo(reel, { f: 0 }, { f: CLIP_FRAMES - 1, duration: CLIP_LEN, immediateRender: false, onUpdate: showFilm }, TEXT_END)
      .fromTo(".sb-cta", { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05 }, CTA_AT)
      .set({}, {}, LEN); // pins the timeline length to LEN, so every position above stays a fraction of the scroll track

    // ---- cursor parallax (far layers lean) ----
    const move = (e) => { el.style.setProperty("--px", (e.clientX / window.innerWidth - 0.5).toFixed(3)); el.style.setProperty("--py", (e.clientY / window.innerHeight - 0.5).toFixed(3)); };
    window.addEventListener("pointermove", move, { passive: true });

    const resize = () => { jc.style.width = jc.style.height = jellySize() + "px"; };
    resize(); window.addEventListener("resize", resize);

    // ---- leaving: the dive clip opens out to fill the screen and the camera falls into the blob until its light is the whole picture; then the next page opens
    // from that same glow (see index.html). A tap or a key after the first moments hurries the rest along. ----
    let leaving = null, lead = null, busy = false, gone = false;
    const whenDive = (ms) => new Promise((done) => { // its frames are normally in long before the button shows; if not, give them a moment instead of dropping the clip
      const t0 = performance.now();
      if (diveSeq.loaded() < diveUrls.length) diveSeq.preload(); // fetches whatever is still missing
      const look = () => (diveSeq.loaded() === diveUrls.length ? done(true) : gone || performance.now() - t0 > ms ? done(false) : setTimeout(look, 80));
      look();
    });
    departRef.current = (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; // a new-tab click just works
      e.preventDefault();
      if (busy) return; // a second press while diving must not navigate early
      busy = true;
      const href = e.currentTarget.href, bloom = el.querySelector(".sb-bloom"), go = () => window.location.assign(href);
      lenis.stop(); document.documentElement.style.overflow = "hidden"; document.documentElement.style.touchAction = "none"; // nothing scrolls while we dive
      lead = gsap.timeline().to(".sb-cta", { autoAlpha: 0, y: -14, duration: 0.35, ease: "power2.in" }, 0).to(".sb-hud", { opacity: 0, duration: 0.3 }, 0);
      const arrive = (x, y) => { // where the light ends, in screen pixels: the glow is centred there, and the next page opens from there
        try { sessionStorage.setItem("dmge-arrive", JSON.stringify({ x: x / window.innerWidth, y: y / window.innerHeight, t: Date.now() })); } catch { /* no memory: the next page just appears */ }
        bloom.style.setProperty("--ox", x + "px"); bloom.style.setProperty("--oy", y + "px");
      };
      whenDive(2500).then((clip) => {
        if (gone) return;
        if (!clip) { // the frames did not arrive: the plain dive stands in (the film falls toward the orb while a glow grows out of it)
          const r = fc.getBoundingClientRect(); arrive(r.left + r.width * ORB.x, r.top + r.height * ORB.y);
          leaving = gsap.timeline({ defaults: { ease: "none" }, onComplete: go })
            .to(".sb-reveal", { scale: 1.6, transformOrigin: `${ORB.x * 100}% ${ORB.y * 100}%`, duration: 1.7, ease: "power3.in" }, 0.1) // the objects drift outward as we fall in
            .to(bloom, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0.15)
            .fromTo(bloom, { "--s": "9vmax" }, { "--s": "170vmax", duration: 1.6, ease: "power3.in" }, 0.15);
          return;
        }
        diving = true;
        const layer = dc.closest(".sb-dive"), pic = dc.parentElement, g = { vw: layer.clientWidth, vh: layer.clientHeight };
        g.fit = Math.min(g.vw, g.vh * 16 / 9); g.fill = Math.max(g.vw, g.vh * 16 / 9);
        const end = place(g, 1, 1); arrive(end.x + END.x * end.S, end.y + END.y * end.H);
        const n = diveUrls.length, secs = (n - 1) / DIVE_FPS, st = { f: 0, e: 0 }; // f: the frame; e: how far the picture has opened out
        const draw = () => { diveSeq.show(st.f); const q = place(g, st.f / (n - 1), st.e); pic.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px) scale(${q.k.toFixed(4)})`; };
        draw();
        leaving = gsap.timeline({ defaults: { ease: "none" }, onComplete: go })
          .to(layer, { opacity: 1, duration: 0.25 }, 0) // its first frame is the film's picture, so the film is replaced without a seam
          .add(() => { filmSeq.release(); gsap.set(".sb-reveal", { visibility: "hidden" }); }, 0.3) // the clip covers the film now: let go of it
          .fromTo(st, { f: 0 }, { f: n - 1, duration: secs, onUpdate: draw }, 0) // the clip plays as it was made; it eases in by itself
          .fromTo(st, { e: 0 }, { e: 1, duration: OPEN_SECS, ease: "power2.inOut", onUpdate: draw }, 0)
          .to(pic.querySelector(".sb-dive-edge"), { opacity: 0, duration: OPEN_SECS, ease: "power2.inOut" }, 0) // the soft dark rim that hides the picture's straight edges goes as it fills the screen
          .fromTo(bloom, { opacity: 0 }, { opacity: 1, duration: BLOOM_SECS, ease: "power1.in" }, secs - BLOOM_SECS); // the last light becomes the glow the next page opens from
      });
    };
    const hurry = (e) => { if (leaving && leaving.time() > 0.8 && !e.repeat) leaving.timeScale(4); }; // not in the first moments: a double-click on the button must not skip it
    const hurryKey = (e) => { if (e.key === "Escape" || e.key === "Enter" || e.key === " ") hurry(e); };
    window.addEventListener("pointerdown", hurry); window.addEventListener("keydown", hurryKey);
    const back = (e) => { if (e.persisted && busy) window.location.reload(); }; // Back from the next page: start the landing afresh, not half flooded
    window.addEventListener("pageshow", back);

    return () => {
      gone = true; window.removeEventListener("pointerdown", hurry); window.removeEventListener("keydown", hurryKey);
      window.removeEventListener("pageshow", back); departRef.current = null; lead?.kill(); leaving?.kill();
      window.removeEventListener("pointermove", move); window.removeEventListener("resize", resize);
      jellySeq.destroy(); filmSeq.destroy(); diveSeq.destroy(); fade?.kill(); wordsTl.current = null;
      gsap.ticker.remove(tick); lenis.destroy(); tl.scrollTrigger?.kill(); tl.kill(); open.kill();
    };
  }, [reduced]);

  // The pair of lines: the words of the first line appear one by one, a beat passes, then the second line does the same; both rest on screen together,
  // and dissolve into the black the film fades in from. The reading time is shared out by word count, so a short pair lingers and a long one moves on,
  // and the film always starts when the pair ends. A new pair is only swapped in while you are at the top, where none of it is on screen.
  useEffect(() => {
    const words = wordsTl.current;
    if (!words) return; // reduced motion: all the words just sit there
    words.clear();
    const lines = [...root.current.querySelectorAll(".sb-ln")].map((ln) => [...ln.querySelectorAll(".sb-word")]), all = lines.flat();
    const lastStart = MSG.span - MSG.hold - MSG.out - MSG.fade; // when the last word starts to appear
    const step = lastStart / (all.length - 1 + MSG.beat * (lines.length - 1));
    let k = 0;
    lines.forEach((ln, li) => ln.forEach((w) => words.fromTo(w, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: MSG.fade }, (k++ + li * MSG.beat) * step)));
    words.to(all, { opacity: 0, y: -16, duration: MSG.out * 0.6, stagger: { amount: MSG.out * 0.4 } }, lastStart + MSG.fade + MSG.hold); // a gentle left-to-right dissolve
    words.set({}, {}, MSG.span); // pins the length, so the film always starts when the pair ends
  }, [saying]);

  useEffect(() => { try { localStorage.setItem(LAST_KEY, saying); } catch { /* ignore */ } }, [saying]);

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
        </div>
        <div className="sb-dim" />
        <div className="sb-reveal"><canvas ref={film} className="sb-film" /></div>
        <div className="sb-dive"><div className="sb-dive-pic"><canvas ref={dive} /><i className="sb-dive-edge" /></div></div>
      </div>

      <main className="sb-track" style={reduced ? undefined : { height: TRACK_VH + "vh" }}>
        <section className="sb-hero">
          <h1 className="sb-h1" aria-label="Know what your work is worth.">
            <span className="sb-line"><span>Know what your <em>work</em> is worth.</span></span>
          </h1>
        </section>
        <p className="sb-hint">Scroll to start</p>
        <p className="sb-message" aria-label={plain(SAYINGS[saying].join(" "))}>
          {SAYINGS[saying].map((line, li) => (
            <span key={li} className="sb-ln">
              {wordsOf(line).flatMap((w, i) => [i ? " " : null, <span key={i} className="sb-word" aria-hidden="true">{w.accent ? <em>{w.text}</em> : w.text}</span>])}
            </span>
          ))}
        </p>
        <div className="sb-cta">
          <h2>Your next quote <em>starts here.</em></h2>
          <a className="sb-btn" href={NEXT} onClick={(e) => departRef.current?.(e)}>Start pricing</a>
        </div>
        <div className="sb-hud" aria-hidden="true"><span>{String(pct).padStart(3, "0")}%</span><span>{chapter}</span></div>
      </main>
      <div className="sb-bloom" aria-hidden="true" />
    </div>
  );
}
