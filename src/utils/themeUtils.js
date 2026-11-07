import { PALETTE as P } from "../styles/palette";

// ─── SORBET INK BASE PALETTE ───
// Export name kept as CARTRIDGE so existing imports keep working; values are the new identity.
// Plain 6-digit hex on purpose: call sites append alpha suffixes ("22", "33").
export const CARTRIDGE = {
  bg: P.cream,
  bgLight: P.paper,
  bgDark: P.creamDeep,
  surface: P.paper,
  border: "#E7DCE0",        // soft hairline (ink @ ~12% over cream, as opaque hex)
  text: P.ink,
  textMuted: P.ink2,
  shadow: P.pink,
};

// Each craft family gets its own pastel (fill = color, deep text/edge = accent).
const CATEGORY_NAMES = [
  "Featured Crafts", "Performance And Talent", "Music", "Film And Tv",
  "Visual And Graphic Arts", "Fashion And Styling", "Live Events And Production",
  "Writing And Content", "Business And Management", "Tech And Digital",
  "Education And Coaching", "Cosmetology", "Culinary Arts",
  // added later: appended so the colours of the fields above stay as they were
  "Creator Economy", "Design And UX", "Games And 3D", "Audio And Voice", "Writing And Publishing", "Makers And Crafts", "Body Art And Beauty",
  "Architecture And Interiors", "Weddings And Events Design", "Photo And Video Services", "My crafts",
];

const PASTELS = [
  { color: P.pink,   accent: P.pinkDeep },
  { color: P.blue,   accent: P.blueDeep },
  { color: P.mint,   accent: P.mintDeep },
  { color: P.butter, accent: P.butterDeep },
  { color: P.lilac,  accent: P.lilacDeep },
];

export const CATEGORY_THEMES = Object.fromEntries(
  CATEGORY_NAMES.map((cat, i) => {
    const p = PASTELS[i % PASTELS.length];
    return [cat, { color: p.color, accent: p.accent, activeBg: P.paper }];
  })
);

export const DEFAULT_THEME = { color: P.pink, accent: P.pinkDeep, activeBg: P.paper };

/** Role tab fill (kept for compatibility). */
export function getRoleColor(roleName) {
  return P.butter;
}

/** Shadow/halo tint for the active pricing model. */
export function getModelShadowColor(modelType) {
  return P.pink;
}

export function getMashupTheme(categoryName, roleName, modelType) {
  const theme = CATEGORY_THEMES[categoryName] || DEFAULT_THEME;
  return {
    catColor: theme.color,
    roleBoxColor: P.paper,
    modelShadow: theme.accent === P.pinkDeep ? P.pink : theme.color,
    accent: theme.accent,
    activeBg: P.paper,
    color: theme.color,
  };
}
