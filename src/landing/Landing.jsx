import React, { useCallback, useEffect, useRef, useState } from "react";
import "./landing.css";
import LiquidCanvas from "./LiquidCanvas";
import FloatingDock from "../components/FloatingDock";
import { Wordmark } from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";
import { Hero, Pick, Context, Price, InvoiceCh, Plans, Launch } from "./chapters";
import { pointer } from "./scene";

const DOCK = [
  { id: "pick", label: "Craft", short: "01" },
  { id: "context", label: "Context", short: "02" },
  { id: "price", label: "Price", short: "03" },
  { id: "invoice", label: "Invoice", short: "04" },
  { id: "plans", label: "Plans", short: "05" },
  { id: "start", label: "Start", short: "↗" },
];
const SECTION_IDS = ["top", ...DOCK.map((d) => d.id)];

const prefersReduced = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function Landing({ onAuthSuccess, onOpenAuth, initialMode = "login" }) {
  const rootRef = useRef(null);
  const lenisRef = useRef(null);
  const [noGL, setNoGL] = useState(false);
  const [active, setActive] = useState("top");
  const [reduced] = useState(prefersReduced);

  const [demo, setDemoState] = useState({ catIdx: 3, roleIdx: 0, clientType: "Startup", usage: "Commercial", units: 2, tier: "fair" });
  const demoRef = useRef(demo);
  demoRef.current = demo;
  const setDemo = useCallback((patch) => setDemoState((d) => ({ ...d, ...patch })), []);

  const scrollToId = useCallback((id) => {
    if (id === "start" && onOpenAuth) { onOpenAuth(); return; } // "Start" opens the sign-in page on the scene
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    else el.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
  }, [reduced, onOpenAuth]);

  // Smooth scroll + reveal choreography (lazy-loaded so the app bundle stays small).
  useEffect(() => {
    if (reduced) return undefined;
    const root = rootRef.current;
    root.classList.add("ll-js");
    let cancelled = false;
    let cleanup = () => {};

    (async () => {
      try {
        const [{ default: gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
          import("gsap"), import("gsap/ScrollTrigger"), import("lenis"),
        ]);
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);

        const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
        lenisRef.current = lenis;
        if (import.meta.env.DEV) window.__lenis = lenis; // dev-only handle for testing scroll positions
        lenis.on("scroll", ScrollTrigger.update);
        const tick = (t) => lenis.raf(t * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);

        // y:0 explicitly: GSAP otherwise parses the CSS translateY(112%) start state into a stuck pixel offset
        gsap.fromTo(".ll-hero .ll-word > span", { yPercent: 112, y: 0 }, { yPercent: 0, y: 0, duration: 1.1, stagger: 0.07, ease: "power4.out", delay: 0.15 });

        ScrollTrigger.batch(".ll-reveal", {
          start: "top 92%",
          once: true,
          onEnter: (els) => gsap.fromTo(els, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: "power3.out", overwrite: true }),
        });

        cleanup = () => {
          gsap.ticker.remove(tick);
          ScrollTrigger.getAll().forEach((t) => t.kill());
          lenis.destroy();
          lenisRef.current = null;
        };
      } catch (err) {
        console.warn("[Landing] motion libs unavailable, showing static content:", err);
        root.classList.remove("ll-js");
      }
    })();

    return () => { cancelled = true; cleanup(); root.classList.remove("ll-js"); };
  }, [reduced]);

  // Deep links like /#price: the landing mounts after the browser's anchor jump, so do it here.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (!id || !SECTION_IDS.includes(id)) return undefined;
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      if (lenisRef.current) lenisRef.current.scrollTo(el, { immediate: true, force: true });
      else el.scrollIntoView({ behavior: "auto" });
    }, 700);
    return () => clearTimeout(t);
  }, []);

  // Pointer position drives a gentle parallax on the liquid (hero + craft chapters).
  useEffect(() => {
    const onMove = (e) => { pointer.x = e.clientX / window.innerWidth; pointer.y = e.clientY / window.innerHeight; };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // Which chapter is under the viewport center -> dock indicator.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }),
      { rootMargin: "-50% 0px -50% 0px", threshold: 0 },
    );
    SECTION_IDS.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, []);

  return (
    <div className="ll-root" ref={rootRef}>
      {noGL ? <div className="ll-fallback" aria-hidden="true" /> : <LiquidCanvas onUnsupported={() => setNoGL(true)} reducedMotion={reduced} />}

      <FloatingDock
        position="top"
        items={DOCK}
        activeId={active}
        onSelect={scrollToId}
        ariaLabel="Page sections"
        trailing={<ThemeToggle />}
        leading={
          <button type="button" onClick={() => scrollToId("top")} aria-label="DMGE, back to top" style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
            <Wordmark size={18} />
          </button>
        }
      />

      <main className="ll-main">
        <Hero onStart={() => scrollToId("start")} onFlow={() => scrollToId("pick")} />
        <Pick demo={demo} demoRef={demoRef} setDemo={setDemo} />
        <Context demo={demo} demoRef={demoRef} setDemo={setDemo} />
        <Price demo={demo} demoRef={demoRef} setDemo={setDemo} />
        <InvoiceCh demo={demo} demoRef={demoRef} />
        <Plans onStart={() => scrollToId("start")} />
        <Launch onAuthSuccess={onAuthSuccess} initialMode={initialMode} />
      </main>

      <footer className="ll-foot">&copy; {new Date().getFullYear()} DMGE</footer>
    </div>
  );
}
