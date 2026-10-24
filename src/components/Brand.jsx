import React, { useId } from "react";

// DMGE mark: a single liquid drop in the sorbet palette. Placeholder until the final logo mark is chosen
// from the generated explorations.
export function Mark({ size = 28 }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#FF9EC7" />
          <stop offset="0.55" stopColor="#8EC5FF" />
          <stop offset="1" stopColor="#9BF0C8" />
        </linearGradient>
      </defs>
      <path d="M16 2.2c5.2 7.2 11.3 11.6 11.3 18.1A11.3 11.3 0 0 1 4.7 20.3C4.7 13.8 10.8 9.4 16 2.2z" fill={`url(#${id})`} />
      <ellipse cx="11.6" cy="19" rx="2.6" ry="5.2" fill="#fff" opacity="0.55" transform="rotate(18 11.6 19)" />
    </svg>
  );
}

export function Wordmark({ size = 22, color = "var(--ink)" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color }}>
      <Mark size={Math.round(size * 1.25)} />
      <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, letterSpacing: "-0.02em", fontSize: size, lineHeight: 1 }}>DMGE</span>
    </span>
  );
}
