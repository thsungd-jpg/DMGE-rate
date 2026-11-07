// Small things the Quote page's stations share.

/** $1,250 (whole dollars). */
export const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");

/** A rate as it is said: $1,500 / $18.75 / $0.045 (rates under a dollar keep their thousandths, because a per-word rate lives there). */
export function rateText(n) {
  const v = Number(n) || 0;
  if (v > 0 && v < 1) return "$" + String(+v.toFixed(3));
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
}

/** Field names are stored as "Film And Tv"; people read "Film & TV". */
export const prettyCategory = (c) => c.replace(/ And /g, " & ").replace(/\bTv\b/g, "TV").replace(/\bUx\b/g, "UX");

export const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Phones get the shorter layouts. */
export const onPhone = () => typeof window !== "undefined" && window.innerWidth < 701;

/** The step a nudge button on a rate takes, by size: a few cents on a per-word rate, fifty dollars on a project fee. */
export const rateStep = (n) => { const v = Number(n) || 0; return v < 1 ? 0.01 : v < 10 ? 0.5 : v < 100 ? 1 : v < 1000 ? 5 : 50; };

/** How far one tap on the quantity buttons moves: half an hour, a hundred words, five seconds, otherwise one. */
export const qtyStep = (model) => {
  const u = String(model?.unit || "").toLowerCase();
  return /^per hour$/.test(u) ? 0.5 : /\bword\b/.test(u) ? 100 : /\bsecond\b/.test(u) ? 5 : 1;
};

/** "1 hour", "2 hours" (a quantity with the right noun). */
export const countOf = (n, noun) => `${Number(n) || 0} ${Number(n) === 1 ? noun.one : noun.many}`;
