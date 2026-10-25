import { useMemo } from "react";
import { useTheme } from "../../styles/theme";

// Chart.js draws to <canvas>, which cannot resolve CSS variables, so the Sorbet Ink tokens are read from the
// document at render time. useTheme() re-renders on day/night changes and returns a fresh object, which makes
// every memoised dataset/options object downstream rebuild and the charts redraw in the new colors.
const read = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || undefined;

/** "#RRGGBB" (or "#RGB") -> "rgba(r, g, b, a)". Any other color string is returned untouched. */
export function withAlpha(color, alpha) {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color || "");
  if (!m) return color;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function useChartTheme() {
  const [theme] = useTheme();
  return useMemo(() => ({
    theme,
    ink: read("--ink"),
    ink2: read("--ink-2"),
    line: read("--line"),
    lineStrong: read("--line-strong"),
    paper: read("--paper"),
    pink: read("--pink"),
    pinkDeep: read("--pink-deep"),
    blue: read("--blue"),
    blueDeep: read("--blue-deep"),
    fontBody: read("--font-body"),
    reducedMotion: typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
  }), [theme]);
}
