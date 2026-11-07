// A craft the user adds themselves ("My crafts"): a name, how they charge, and their usual rate. The list lives on the profile (so it follows them wherever the
// profile syncs) and a copy of the craft is embedded in every job and template that uses it, so those reopen on any device.
export const CUSTOM_FIELD = "My crafts";

/** The ways to charge a custom craft offers. `hours` is how long one unit takes where that is known. */
export const CUSTOM_WAYS = [
  { id: "hour", label: "Hourly", type: "Hourly Rate", unit: "per hour", hours: 1, hint: "A rate per hour", rate: 50 },
  { id: "day", label: "Day rate", type: "Day Rate", unit: "per day", hours: 8, hint: "A rate for a day", rate: 400 },
  { id: "project", label: "Per project", type: "Project Fee", unit: "per project", hint: "One price for a whole job", rate: 1000 },
  { id: "piece", label: "Per piece", type: "Per Piece", unit: "per piece", hint: "A price for each thing you make", rate: 100 },
  { id: "month", label: "Monthly retainer", type: "Monthly Retainer", unit: "per month", hint: "A regular monthly fee", rate: 1500 },
  { id: "percent", label: "Share of a deal", type: "Share of a Deal", unit: "% of deal", hint: "A percentage of what a deal is worth", rate: 10 },
];

const clean = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 60);

/** Builds a craft in the same shape as a built-in role, flagged `custom`. */
export function makeCraft({ name, way, rate, hours }) {
  const w = CUSTOM_WAYS.find((x) => x.id === way) || CUSTOM_WAYS[0];
  const model = { type: w.type, unit: w.unit, base: Math.max(0, Number(rate) || w.rate) };
  const h = Number(hours) || w.hours;
  if (h > 0) model.hours = h;
  return { name: clean(name), custom: true, keywords: [], models: [model], materials: [] };
}

/** Adds the "My crafts" field after the built-in ones, when there is at least one craft. */
export function withCustomCrafts(data, crafts = []) {
  const list = (crafts || []).filter((c) => c && c.name && Array.isArray(c.models) && c.models.length);
  return list.length ? { ...data, [CUSTOM_FIELD]: { color: "#e5deff", accent: "#684dcc", roles: list } } : data;
}

/** Adds a craft (or replaces the one with the same name). */
export function addCraft(crafts = [], craft) {
  const key = craft.name.toLowerCase();
  return [...(crafts || []).filter((c) => c.name.toLowerCase() !== key), craft];
}

export const removeCraft = (crafts = [], name) => (crafts || []).filter((c) => c.name !== name);

/** What a saved job or template stores so it can reopen without the user's profile. */
export const craftPayload = (craft) => ({ name: craft.name, models: craft.models, custom: true });
