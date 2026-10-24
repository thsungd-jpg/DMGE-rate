import React from "react";
import mark64 from "../assets/brand/mark-64.webp";
import mark128 from "../assets/brand/mark-128.webp";

// DMGE mark: the "jelly pillow" — a glossy folded pastel ribbon (chosen from the logo explorations).
export function Mark({ size = 28 }) {
  return (
    <img
      src={size > 40 ? mark128 : mark64}
      srcSet={`${mark64} 64w, ${mark128} 128w`}
      sizes={`${size}px`}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      draggable="false"
      style={{ display: "block", objectFit: "contain" }}
    />
  );
}

export function Wordmark({ size = 22, color = "var(--ink)" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color }}>
      <Mark size={Math.round(size * 1.35)} />
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 400, letterSpacing: "0.04em", fontSize: Math.round(size * 1.18), lineHeight: 1 }}>DMGE</span>
    </span>
  );
}
