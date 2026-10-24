import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "../styles/dock.css";

/**
 * Floating pill menu with a "liquid" active indicator: the edge it moves toward travels fast and the
 * trailing edge lags, so the pill stretches like a droplet as it slides between items.
 *
 * items: [{ id, label, short?, badge? }]   short = compact label shown on narrow screens
 * onSelect(id, event) fires on click; the clicked button's rect is available via event.currentTarget.
 */
export default function FloatingDock({ items, activeId, onSelect, position = "bottom", leading = null, trailing = null, ariaLabel = "Main navigation", className = "" }) {
  const wrapRef = useRef(null);
  const itemRefs = useRef({});
  const prevIdx = useRef(-1);
  const [ind, setInd] = useState({ left: 0, right: 0, ready: false, dir: 1 });

  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    const el = itemRefs.current[activeId];
    if (!wrap || !el) { setInd((s) => (s.ready ? { ...s, ready: false } : s)); return; }
    const w = wrap.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setInd((s) => ({ ...s, left: r.left - w.left, right: w.right - r.right, ready: true }));
  }, [activeId]);

  useLayoutEffect(() => {
    const idx = items.findIndex((i) => i.id === activeId);
    setInd((s) => ({ ...s, dir: idx >= prevIdx.current ? 1 : -1 }));
    prevIdx.current = idx;
    measure();
  }, [activeId, items.length, measure]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const wrap = wrapRef.current;
    window.addEventListener("resize", measure);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (ro && wrap) ro.observe(wrap);
    if (document.fonts?.ready) document.fonts.ready.then(measure);
    return () => { window.removeEventListener("resize", measure); ro?.disconnect(); };
  }, [measure]);

  // Moving right: right edge leads (fast), left edge trails (slow); and the reverse when moving left.
  const fast = "0.32s", slow = "0.62s";
  const leftDur = ind.dir > 0 ? slow : fast;
  const rightDur = ind.dir > 0 ? fast : slow;

  return (
    <nav className={`lq-dock lq-dock--${position} ${items.some((i) => i.short) ? "lq-dock-has-short" : ""} ${className}`} aria-label={ariaLabel}>
      <div className="lq-dock-inner" ref={wrapRef}>
        {leading && <div className="lq-dock-lead">{leading}</div>}
        <span
          className="lq-dock-ind"
          aria-hidden="true"
          style={{
            left: ind.left, right: ind.right,
            opacity: ind.ready ? 1 : 0,
            transition: ind.ready ? `left ${leftDur} var(--ease-out), right ${rightDur} var(--ease-out), opacity .2s` : "none",
          }}
        />
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            ref={(el) => { itemRefs.current[it.id] = el; }}
            className="lq-dock-item"
            aria-current={it.id === activeId ? "page" : undefined}
            onClick={(e) => onSelect?.(it.id, e)}
          >
            <span className="lq-dock-label">{it.label}</span>
            {it.short && <span className="lq-dock-short" aria-hidden="true">{it.short}</span>}
            {it.badge != null && it.badge !== "" && <span className="lq-dock-badge">{it.badge}</span>}
          </button>
        ))}
        {trailing && <div className="lq-dock-trail">{trailing}</div>}
      </div>
    </nav>
  );
}
