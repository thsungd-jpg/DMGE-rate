import { TIERS, PROMO } from "../../utils/subscription";

// Shared plan facts for the pricing page and the upgrade modal. Every number comes from TIERS / PROMO
// (src/utils/subscription.js), so changing a limit or a promo there updates every surface.

export const PLAN_ORDER = ["free", "pro", "agency"];

export const PLAN_NAMES = { free: "Free", pro: "Pro", agency: "Agency" };

const count = (n) => (n === Infinity ? "Unlimited" : String(n));

/** Normalise whatever tier string the app hands us. */
export const normTier = (t) => (PLAN_ORDER.includes(String(t || "").toLowerCase()) ? String(t).toLowerCase() : "free");

/** "year" | "month" -> full list price for a paid tier. */
export const listPrice = (tierKey, cycle) => {
  const p = TIERS[tierKey]?.prices;
  if (!p) return 0;
  return cycle === "year" ? p.annual : p.monthly;
};

/** The promo price the checkout applies: first month $1, or 75% off year one (rounded like the old page). */
export const promoPrice = (tierKey, cycle) => {
  if (cycle === "year") return Math.round(TIERS[tierKey].prices.annual * (100 - PROMO.annualPercentOff) / 100);
  return PROMO.firstMonthPrice;
};

/** Rows of the comparison table. `value` returns a string for numbers or a boolean for yes/no features. */
export const FEATURE_ROWS = [
  { key: "clients", label: "Clients", value: (t) => count(t.limits.clients) },
  { key: "templates", label: "Templates", value: (t) => count(t.limits.templates) },
  { key: "history", label: "Job history", value: (t) => `${t.limits.historyDays} days` },
  { key: "pdfs", label: "PDF invoices per day", value: (t) => count(t.limits.pdfsPerDay) },
  { key: "csv", label: "CSV export", value: (t) => !!t.limits.csvExport },
  { key: "analytics", label: "Analytics", value: (t) => !!t.limits.analytics },
  { key: "cloud", label: "Cloud sync", value: (t) => !!t.limits.cloudSync },
  { key: "white", label: "White-label invoices", value: (t) => !!t.limits.whiteLabel },
  { key: "support", label: "Priority support", value: (t) => !!t.limits.prioritySupport },
];

/** Short highlight list shown on each plan card / upgrade perk card. */
export function planBullets(tierKey) {
  const l = TIERS[tierKey].limits;
  if (tierKey === "free") {
    return [
      `${l.clients} clients`,
      `${l.templates} templates`,
      `${l.historyDays}-day job history`,
      `${l.pdfsPerDay} PDF invoices a day`,
    ];
  }
  if (tierKey === "pro") {
    return [
      `${l.clients} clients`,
      `${l.templates} templates`,
      `${l.historyDays}-day job history`,
      `${l.pdfsPerDay} PDF invoices a day`,
      "Offline calculator",
      "Basic export",
    ];
  }
  return [
    `${l.clients} clients and templates`,
    `${l.historyDays}-day job history`,
    `${l.pdfsPerDay} invoices a day`,
    "Cloud sync and analytics",
    "CSV export and white-label invoices",
    "Priority support",
  ];
}
