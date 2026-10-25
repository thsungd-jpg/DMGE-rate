// Small formatting helpers for the Clients screen.

export function money(n) {
  return "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
}

export function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const opts = { month: "short", day: "numeric" };
  if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString("en-US", opts);
}

const TONES = ["pink", "blue", "mint", "butter", "lilac"];

/** Stable pastel tone per client name, so an avatar keeps its colour. */
export function toneFor(str = "") {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

export function initials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = Array.from(parts[0])[0];
  const last = parts.length > 1 ? Array.from(parts[parts.length - 1])[0] : "";
  return (first + last).toUpperCase();
}

/** "×1.5" (the rate multiplier, as shown in the calculator). */
export function multiplierLabel(m) {
  const n = Number(m);
  return "×" + (Number.isFinite(n) && n > 0 ? +n.toFixed(2) : 1);
}

export function multiplierTone(m) {
  const n = Number(m);
  if (!Number.isFinite(n) || n === 1) return "ink";
  return n > 1 ? "pink" : "blue";
}

export function multiplierHint(m) {
  const n = Number(m);
  if (!Number.isFinite(n) || n === 1) return "Your standard rate";
  const pct = Math.round(Math.abs(n - 1) * 100);
  return n > 1 ? `${pct}% above your standard rate` : `${pct}% below your standard rate`;
}

const STATUS = {
  pending: ["ink", "Pending"],
  in_progress: ["butter", "In progress"],
  sent: ["butter", "Sent"],
  completed: ["mint", "Completed"],
  paid: ["mint", "Paid"],
};

/** [pill tone, label] for a job status. */
export function statusPill(status) {
  return STATUS[status] || ["ink", String(status || "Pending").replace(/_/g, " ")];
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
