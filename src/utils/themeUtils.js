function fastHash(str) {
  if (!str) return 0;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// ─── CARTRIDGE PASTEL BASE PALETTE ───
export const CARTRIDGE = {
  bg: "#0A0A0A",         // deep black background
  bgLight: "#121212",
  bgDark: "#050505",     
  surface: "#1A1A1A",    // dark grey surface/card
  border: "#FFB347",     // orange borders
  text: "#FFB347",       // primary orange text
  textMuted: "#FFB34788",
  shadow: "#E91E6355",   // pink glow shadow
};

export const CATEGORY_THEMES = Object.fromEntries(
  [
    "Featured Crafts", "Performance And Talent", "Music", "Film And Tv", 
    "Visual And Graphic Arts", "Fashion And Styling", "Live Events And Production", 
    "Writing And Content", "Business And Management", "Tech And Digital", 
    "Education And Coaching", "Cosmetology", "Culinary Arts"
  ].map(cat => [cat, { color: "#FFB347", accent: "#E91E63", activeBg: "#1A1A1A" }])
);

export const DEFAULT_THEME = { color: "#FFB347", accent: "#E91E63", activeBg: "#1A1A1A" };

/**
 * Generate a role-based orange fill color (for box/tab interiors).
 */
export function getRoleColor(roleName) {
  return "#FFB347"; // Always return the design orange for tabs
}

export function getModelShadowColor(modelType) {
  return "#E91E63"; // Always return the design pink for shadows
}

export function getMashupTheme(categoryName, roleName, modelType) {
  return {
    catColor: "#FFB347",
    roleBoxColor: "#1A1A1A",
    modelShadow: "#E91E63",
    accent: "#E91E63",
    activeBg: "#1A1A1A",
    color: "#FFB347"
  };
}
