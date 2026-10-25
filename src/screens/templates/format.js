// Small formatting helpers for the Templates screen.

export function money(n) {
  const v = Number(n) || 0;
  const cents = v % 1 !== 0;
  return "$" + v.toLocaleString("en-US", { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: 2 });
}

export function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const opts = { month: "short", day: "numeric" };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString("en-US", opts);
}

const TONES = ["pink", "blue", "mint", "butter", "lilac"];

/** Stable pastel tone per category name, so each craft family keeps its own colour. */
export function toneFor(str = "") {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

/** Options for a PSelect, keeping a stored value that is not in the standard list selectable. */
export function selectOptions(keys, current) {
  const list = current && !keys.includes(current) ? [...keys, current] : keys;
  return list.map((k) => ({ label: k, value: k }));
}

/** The app shell scrolls inside .app-wrapper (the window itself does not scroll). */
export function scrollToTop() {
  const el = document.querySelector(".app-wrapper");
  if (el) el.scrollTop = 0;
  else window.scrollTo(0, 0);
}
