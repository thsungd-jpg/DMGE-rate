// White-label colours (Agency): turns the four colours on the Branding card into the CSS variables the scrapbook world reads (see the "white-label" block in
// src/world/world.css). Pure functions, no React. The point of this file is that a brand colour can never make the app unreadable: every pairing is checked
// against WCAG contrast and, when a colour would not read, a readable one is used instead and `notes` says which.
//
//   background -> the scene behind every screen (replaces the starfield / cream wash)
//   text       -> titles and copy on the scene
//   surface    -> the paper pieces and cards
//   accent     -> the glowing title word, and the primary buttons (as a tint dark ink can sit on)

const HEX = /^#?([0-9a-f]{6})$/i;
// the old retro defaults saved in profiles from before the redesign mean "not customised"
const LEGACY = new Set(["#1a1a1a", "#0a0a0a", "#ffb347", "#e91e63"]);

export const DARK_INK = "#2B2140";
export const LIGHT_INK = "#F6F0FF";
const NIGHT = "#05030D", DAY = "#FFF6E8"; // what the scene is when no background colour is set

export const normHex = (v) => { const m = HEX.exec(String(v || "").trim()); return m ? "#" + m[1].toLowerCase() : null; };
/** A colour the user really chose, as "#rrggbb", or null (blank, invalid, or an old default). */
export const customHex = (v) => { const h = normHex(v); return h && !LEGACY.has(h) ? h : null; };

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
export const luminance = (h) => { const [r, g, b] = rgb(h).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export function contrast(a, b) { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); }
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return "#" + A.map((v, i) => Math.round(v * (1 - t) + B[i] * t).toString(16).padStart(2, "0")).join(""); }

/** `preferred` if it reads on `bg` (4.5:1), else whichever of the dark and light ink reads better. */
export const readableOn = (bg, preferred) => (preferred && contrast(preferred, bg) >= 4.5 ? preferred : contrast(DARK_INK, bg) >= contrast(LIGHT_INK, bg) ? DARK_INK : LIGHT_INK);

/** Nudges `color` toward white or black (whichever helps) until it reads on `bg` at `min`:1, keeping its hue as long as it can. */
export function lift(color, bg, min = 4.5) {
  if (contrast(color, bg) >= min) return color;
  const toward = luminance(bg) < 0.4 ? "#ffffff" : "#000000";
  for (let t = 0.1; t <= 1; t += 0.1) { const c = mix(color, toward, t); if (contrast(c, bg) >= min) return c; }
  return toward;
}

/** A fill dark ink can sit on: the accent itself when it is light enough, else a tint of it. */
function fillFor(accent) {
  if (contrast(DARK_INK, accent) >= 4.5) return accent;
  for (let t = 0.1; t <= 1; t += 0.1) { const c = mix(accent, "#ffffff", t); if (contrast(DARK_INK, c) >= 4.5) return c; }
  return "#ffffff";
}

/**
 * The CSS variables for a profile's branding, or null when nothing was customised.
 * `dark` is whether the app is in night mode (it decides what the scene is when only a text colour is set).
 * Returns { vars, flags, notes }: `vars` are --brand-* custom properties, `flags` say which groups are on (they become data-brand-* attributes on <html>),
 * and `notes` lists the colours that had to be replaced to stay readable ("text", "accent", "surface").
 */
export function brandTokens(branding = {}, { dark = true } = {}) {
  const bg = customHex(branding.bgColor), surface = customHex(branding.surfaceColor), accent = customHex(branding.accentColor), text = customHex(branding.textColor);
  if (!bg && !surface && !accent && !text) return null;
  const vars = {}, flags = { bg: !!bg, title: false, surface: !!surface, accent: !!accent }, notes = [];
  const scene = bg || (dark ? NIGHT : DAY);

  if (bg || text) {
    const title = readableOn(scene, text);
    if (text && title !== text) notes.push("text");
    flags.title = true;
    vars["--brand-title"] = title;
    vars["--brand-copy"] = mix(title, scene, 0.2);
    vars["--brand-label"] = mix(title, scene, 0.36);
  }
  if (bg) vars["--brand-bg"] = bg;
  if (surface) {
    const ink = readableOn(surface, null);
    vars["--brand-surface"] = surface;
    vars["--brand-surface-2"] = mix(surface, ink, 0.07);
    vars["--brand-ink"] = ink;
    vars["--brand-ink-2"] = mix(ink, surface, 0.34);
  }
  if (accent) {
    const fill = fillFor(accent), glow = lift(accent, scene, 4.5);
    if (fill !== accent) notes.push("accent");
    vars["--brand-fill"] = fill;
    vars["--brand-lip"] = mix(fill, "#000000", 0.28);
    vars["--brand-glow"] = glow;
  }
  return { vars, flags, notes };
}

/** Applies brandTokens to <html> (variables plus data-brand-* flags). Pass null to clear. Returns nothing. */
export function applyBrand(root, tokens) {
  const ALL = ["--brand-bg", "--brand-title", "--brand-copy", "--brand-label", "--brand-surface", "--brand-surface-2", "--brand-ink", "--brand-ink-2", "--brand-fill", "--brand-lip", "--brand-glow", "--butter"];
  ALL.forEach((k) => root.style.removeProperty(k));
  ["bg", "title", "surface", "accent"].forEach((f) => root.removeAttribute("data-brand-" + f));
  if (!tokens) return;
  Object.entries(tokens.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  Object.entries(tokens.flags).forEach(([f, on]) => on && root.setAttribute("data-brand-" + f, ""));
  if (tokens.flags.accent) root.style.setProperty("--butter", tokens.vars["--brand-fill"]); // every "butter" fill in the app (primary buttons, selected tags) takes the brand tint
}
