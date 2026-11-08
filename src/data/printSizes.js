// Standard print sizes for flyers and posters. A model with `sizes` is priced for its base size (mult 1) and scales with the others: the rate you see and the quote
// are base rate x the chosen size's `mult`. Print cost grows roughly with area, design effort much less, so the two have separate tables.
// The base size is the common one for the product (Letter / A4 for a flyer, 18 x 24 in for a poster). `note` gives the metric size and what the size is for.
const s = (label, mult, note, base = false) => ({ label, mult, note, ...(base ? { base: true } : {}) });

/** Printing a flyer: cost follows the paper. */
export const FLYER_PRINT_SIZES = [
  s("A6 · 4 × 6 in", 0.45, "10 × 15 cm: a postcard-size handout."),
  s("A5 · 5.5 × 8.5 in", 0.65, "14.8 × 21 cm: half a letter sheet."),
  s("A4 · Letter 8.5 × 11 in", 1, "21 × 29.7 cm: the standard flyer.", true),
  s("A3 · Tabloid 11 × 17 in", 1.6, "29.7 × 42 cm: a large flyer or a small poster."),
];

/** Designing a flyer: a smaller flyer still needs the same thinking, so the scale is gentle. */
export const FLYER_DESIGN_SIZES = [
  s("A6 · 4 × 6 in", 0.85, "10 × 15 cm: a postcard-size handout."),
  s("A5 · 5.5 × 8.5 in", 0.9, "14.8 × 21 cm: half a letter sheet."),
  s("A4 · Letter 8.5 × 11 in", 1, "21 × 29.7 cm: the standard flyer.", true),
  s("A3 · Tabloid 11 × 17 in", 1.2, "29.7 × 42 cm: a large flyer or a small poster."),
];

/** Printing a poster: cost follows the area. */
export const POSTER_PRINT_SIZES = [
  s("11 × 17 in", 0.55, "28 × 43 cm: a small poster, fits a standard frame."),
  s("12 × 18 in", 0.65, "30 × 46 cm: the common small poster."),
  s("18 × 24 in", 1, "46 × 61 cm: the standard poster.", true),
  s("24 × 36 in", 1.8, "61 × 91 cm: a large poster."),
  s("27 × 40 in", 2.3, "69 × 102 cm: the movie one-sheet."),
  s("36 × 48 in", 3.4, "91 × 122 cm: an extra-large poster."),
];

/** Designing a poster: larger formats take a little more care (detail at a distance, safe margins, bleed). */
export const POSTER_DESIGN_SIZES = [
  s("11 × 17 in", 0.9, "28 × 43 cm: a small poster, fits a standard frame."),
  s("12 × 18 in", 0.95, "30 × 46 cm: the common small poster."),
  s("18 × 24 in", 1, "46 × 61 cm: the standard poster.", true),
  s("24 × 36 in", 1.1, "61 × 91 cm: a large poster."),
  s("27 × 40 in", 1.2, "69 × 102 cm: the movie one-sheet."),
  s("36 × 48 in", 1.3, "91 × 122 cm: an extra-large poster."),
];
