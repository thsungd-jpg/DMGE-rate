// Job status model for the Jobs tab.
// The app stores `status` as pending | in_progress | completed (and `invoiceStatus` as pending | sent | paid).
// Seeded/mock data also uses "sent" and "paid" directly, so every read goes through normalizeStatus().

export const STATUS_ORDER = ["pending", "in_progress", "completed"];

export const STATUS_META = {
  pending: { label: "Pending", short: "Pending", tone: "butter" },
  in_progress: { label: "Sent", short: "Sent", tone: "blue" },
  completed: { label: "Paid", short: "Paid", tone: "mint" },
};

/** Canonical status of a job: "pending" | "in_progress" | "completed". */
export function normalizeStatus(job) {
  const s = String(job?.status || "").toLowerCase();
  const inv = String(job?.invoiceStatus || "").toLowerCase();
  if (s === "completed" || s === "paid" || inv === "paid") return "completed";
  if (s === "in_progress" || s === "sent" || inv === "sent") return "in_progress";
  return "pending";
}

export function isValidDate(iso) {
  return !!iso && !Number.isNaN(new Date(iso).getTime());
}

export function fmtMoney(n) {
  return "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
}

export function fmtMoney2(n) {
  return "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
