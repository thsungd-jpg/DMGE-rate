// Legacy-color adapter.
// ~200 call sites still pass the old retro hex values (#FFB347 orange, #E91E63 pink, #0A0A0A black…)
// into the shared primitives. These helpers translate them to Sorbet Ink so every screen inherits the
// new look before it is individually rebuilt. New code should pass PALETTE hexes (they pass through unchanged).
import { PALETTE as P } from "./palette";

const LEGACY_FILL = {
  // oranges / golds -> butter
  "#ffb347": P.butter, "#ffd700": P.butter, "#ff9800": P.butter, "#d9b74a": P.butter, "#c4622d": P.butter,
  "#f5ebd6": P.butterSoft, "#f5f0d6": P.butterSoft, "#f5ead6": P.butterSoft,
  // pinks / reds
  "#e91e63": P.pink, "#d94a8a": P.pink, "#d94aab": P.pink, "#d94a4a": P.pink,
  "#ffd6e8": P.pinkSoft, "#f5d6f0": P.pinkSoft, "#f5d6d6": P.pinkSoft,
  "#f44336": P.dangerSoft,
  // violets
  "#e040fb": P.lilac, "#9c27b0": P.lilac, "#8a4ad9": P.lilac, "#ead6f5": P.lilacSoft,
  // greens
  "#d6f5e3": P.mint, "#4caf50": P.mint, "#2eb351": P.mint, "#d6f5f5": P.mintSoft,
  // blues
  "#b5d5f5": P.blue, "#2a99d9": P.blue, "#2a70d9": P.blue, "#475f94": P.blue,
  "#d6e8f5": P.blueSoft, "#d6e0f5": P.blueSoft,
  // dark surfaces -> light paper; pure black -> ink
  "#1a1a1a": P.paper, "#0a0a0a": P.paper, "#121212": P.paper, "#050505": P.cream,
  "#000000": P.ink, "#2a2a2a": P.ink,
  // greys / whites
  "#d5d5d5": P.cream, "#dedede": P.creamDeep, "#e8e8e8": P.creamDeep, "#e0e0e0": P.creamDeep, "#ffffff": P.paper,
};

const LEGACY_TEXT = {
  "#ffb347": P.ink, "#0a0a0a": P.ink, "#000000": P.ink, "#2a2a2a": P.ink, "#1a1a1a": P.ink, "#ffffff": P.ink,
  "#e91e63": P.pinkDeep, "#ffd700": P.butterDeep, "#ff9800": P.butterDeep,
  "#4caf50": P.mintDeep, "#2eb351": P.mintDeep, "#d6f5e3": P.mintDeep,
  "#9c27b0": P.lilacDeep, "#e040fb": P.lilacDeep,
  "#2a99d9": P.blueDeep, "#2a70d9": P.blueDeep, "#d6e8f5": P.blueDeep,
  "#f44336": P.danger,
};

// Legacy neutrals that used to mean "the default thick border" -> hairline.
const LEGACY_NEUTRAL_EDGE = new Set(["#ffb347", "#0a0a0a", "#000000", "#2a2a2a", "#1a1a1a", "#121212"]);

function split(c) {
  if (typeof c !== "string") return null;
  const k = c.trim().toLowerCase();
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(k)) return null;
  let h = k.slice(1);
  if (h.length === 3) h = h.split("").map((x) => x + x).join("");
  return { base: "#" + h.slice(0, 6), alpha: h.length === 8 ? h.slice(6) : "" };
}

/** Background / fill color. Keeps any alpha suffix so "#FFB34722" stays a translucent tint. */
const THEMED_FILL = { [P.paper]: "var(--paper)", [P.cream]: "var(--cream)", [P.ink]: "var(--ink)" };

export function fill(c) {
  const s = split(c);
  if (!s) return c;
  const mapped = LEGACY_FILL[s.base] ?? s.base;
  // opaque neutrals follow the day/night theme; translucent tints keep their hex (alpha suffix)
  if (!s.alpha && THEMED_FILL[mapped]) return THEMED_FILL[mapped];
  return mapped + s.alpha;
}

/** Text color. Old orange text on dark becomes ink; old translucent orange (muted label) becomes ink-2. */
export function textOn(c) {
  const s = split(c);
  if (!s) return c;
  if (s.base === "#ffb347" && s.alpha) return "var(--ink-2)";
  const mapped = LEGACY_TEXT[s.base] ?? LEGACY_FILL[s.base] ?? s.base;
  if (!s.alpha && mapped === P.ink) return "var(--ink)";
  return mapped + s.alpha;
}

/** Border color. Old default borders become a soft hairline; accent borders become a deepened pastel. */
export function edge(c) {
  const s = split(c);
  if (!s) return c;
  if (LEGACY_NEUTRAL_EDGE.has(s.base)) return "var(--line)";
  const legacy = LEGACY_FILL[s.base];
  // Legacy pastel-mapped colors are light fills: deepen them with ink. New-palette colors (already -deep
  // accents) are used as-is at reduced strength so borders stay soft.
  if (legacy) return `color-mix(in srgb, ${legacy} 60%, ${P.ink})`;
  return `color-mix(in srgb, ${s.base} 70%, transparent)`;
}

/** Tinted halo color for the soft drop shadow under cards. */
export function halo(c) {
  const s = split(c);
  if (!s) return c;
  if (s.base === "#2a2a2a" || s.base === "#000000" || s.base === "#0a0a0a") return "rgba(43, 33, 64, 0.28)";
  const f = LEGACY_FILL[s.base] ?? s.base;
  return `color-mix(in srgb, ${f} 80%, transparent)`;
}
