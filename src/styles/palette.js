// Sorbet Ink palette — JS mirror of src/styles/tokens.css.
// Kept as plain 6-digit hex strings: callers append alpha suffixes ("22", "33"), so never swap these for var(--x).
export const PALETTE = {
  cream: "#FFF6E8",
  creamDeep: "#FFEBD2",
  paper: "#FFFBF4",

  ink: "#2B2140",
  ink2: "#5B5170",
  ink3: "#8A809E",

  pink: "#FF9EC7",
  pinkSoft: "#FFD3E6",
  pinkDeep: "#AE2C63",

  blue: "#8EC5FF",
  blueSoft: "#D2E8FF",
  blueDeep: "#2A63BB",

  mint: "#9BF0C8",
  mintSoft: "#D3F8E6",
  mintDeep: "#167A55",

  butter: "#FFE98A",
  butterSoft: "#FFF5C4",
  butterDeep: "#8A6300",

  lilac: "#C7B8FF",
  lilacSoft: "#E5DEFF",
  lilacDeep: "#684DCC",

  danger: "#B3263F",
  dangerSoft: "#FFD6DD",
};

// Pricing tiers: Budget = blue, Fair = mint, Premium = pink (matches the strata art).
export const TIER_COLORS = {
  low: PALETTE.blue,
  fair: PALETTE.mint,
  premium: PALETTE.pink,
};
