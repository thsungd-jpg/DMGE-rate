// How a pricing model is priced, how to talk about it, and how the base rate for a quote is worked out. Pure functions, no React.
//
// A model is { type, unit, base } (plus optional hours: how many hours one unit usually takes). The quote engine (pricing.js) only ever sees a
// base rate and a number of units, so everything here ends in a number for baseRate and a number for units; calcPrice stays as it was.
import { calcBaseRate, RATE_FINDER_DEFAULTS } from "./baseRate.js";

const round2 = (n) => Math.round(n * 100) / 100;
// A rate under a dollar (a price per word, per second) keeps four decimals: rounding $0.03375 to cents would be an 11% error that the quantity then multiplies.
const roundRate = (n) => (Math.abs(n) < 1 ? Math.round(n * 10000) / 10000 : round2(n));
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

// ── what kind of price a model is ──────────────────────────────────────────────────────────────────────────────────────────────────

const TIME = /\b(hour|hr|day|week|month|year|night)s?\b|\b\d+\s*(minutes?|min)\b|-hr\b|-hour\b/;
const OUTPUT = /finished|audio|video|picture|\bper minute\b|\bper second\b|\bper word\b|\bper page\b|\bper slide\b/; // output measures ("per finished hour"), not time worked

/** "percent" (a cut of a deal), "time" (an hour, a day, a week, a month) or "unit" (a project, a piece, a post, a word...). */
export function modelKind(model) {
  const u = String(model?.unit || "").toLowerCase();
  if (u.includes("%")) return "percent";
  if (/annual|salary/.test(u)) return "time";
  if (!OUTPUT.test(u) && TIME.test(u)) return "time";
  return "unit";
}

export const KIND_GROUPS = [
  { kind: "time", label: "By time" },
  { kind: "unit", label: "By deliverable" },
  { kind: "percent", label: "Share of a deal" },
];

/** The role's models in groups, keeping each model's index (the app stores the index of the chosen model). */
export function groupModels(models = []) {
  return KIND_GROUPS.map((g) => ({ ...g, items: models.map((model, index) => ({ model, index })).filter((x) => modelKind(x.model) === g.kind) })).filter((g) => g.items.length);
}

// ── words ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────

const NO_PLURAL = /(\bsq ft|\bft|\bmo|\/)\S*$/i; // "sq ft", "platform/mo": left as they are
const pluralWord = (w) => (/^person$/i.test(w) ? "people" : NO_PLURAL.test(w) ? w : /(ss|sh|ch|x|z)$/i.test(w) ? w + "es" : /s$/i.test(w) ? w : /[^aeiou]y$/i.test(w) ? w.slice(0, -1) + "ies" : w + "s");
function plural(phrase) {
  return phrase.split(" / ").map((part) => {
    const cut = part.search(/ per | of | \(/); // pluralise the last word of the head: "media placement per ..." -> "media placements per ..."
    const head = cut >= 0 ? part.slice(0, cut) : part, tail = cut >= 0 ? part.slice(cut) : "";
    const words = head.split(" "); words[words.length - 1] = pluralWord(words[words.length - 1]);
    return words.join(" ") + tail;
  }).join(" / ");
}

/** What one unit is called: { one: "hour", many: "hours" }. (Matched case-insensitively, but the noun keeps its capitals: "VFX shot".) */
export function unitNoun(model) {
  const raw = String(model?.unit || "").trim(), low = raw.toLowerCase();
  if (low.includes("%")) return { one: "percent", many: "percent" };
  if (/annual|salary/.test(low)) return { one: "year", many: "years" };
  if (/^flat\b|buyout/.test(low)) return { one: "job", many: "jobs" };
  let m = raw.match(/^per\s+(\d+)\s*-?\s*(?:hr|hours?)\s+(.+)$/i);        // "per 3-hr session"
  if (m) return { one: `${m[1]}-hour ${m[2]}`, many: plural(`${m[1]}-hour ${m[2]}`) };
  m = raw.match(/^per\s+(\d+)\s*(?:minutes?|min)$/i);                     // "per 30 minutes"
  if (m) return { one: `${m[1]}-minute slot`, many: `${m[1]}-minute slots` };
  m = raw.match(/^per\s+1,000\s+(.+)$/i);                                // "per 1,000 views": you count thousands
  if (m) return { one: `thousand ${m[1]}`, many: `thousand ${m[1]}` };
  m = raw.match(/^per\s+(\d[\d,]*)\s+(.+)$/i);
  if (m) return { one: `${m[1]} ${m[2]}`, many: `${m[1]} ${m[2]}` };
  m = raw.match(/^per\s+(.+)$/i);
  if (m) return { one: m[1], many: plural(m[1]) };
  return { one: "unit", many: "units" };
}

/** "per hour", "per day", "flat fee": the unit as written, for showing next to a rate. */
export const unitLabel = (model) => String(model?.unit || "").replace("per hour", "per hr");

/** The question the quantity stepper answers. */
export const askQuantity = (model) => `How many ${unitNoun(model).many}?`;

/** A sensible starting quantity for a model (the old default was 2 for everything). */
export function defaultUnits(model) {
  const u = String(model?.unit || "").toLowerCase();
  if (modelKind(model) === "percent") return 1;
  if (/^per hour$/.test(u)) return 2;
  if (/\bword\b/.test(u)) return 500;
  if (/\bsecond\b/.test(u)) return 30;
  if (/\bminute\b/.test(u) && !/^per \d/.test(u)) return 5;
  if (/1,000/.test(u)) return 10;
  if (/sq ft/.test(u)) return 20;
  return 1;
}

/** How many hours one unit usually takes: the model's own `hours`, else what the unit says, else null (the user is asked). */
export function hoursPerUnit(model) {
  if (num(model?.hours) > 0) return num(model.hours);
  const u = String(model?.unit || "").toLowerCase();
  let m;
  if (u === "per hour") return 1;
  if ((m = u.match(/^per\s+(\d+)\s*-?\s*(?:hr|hours?)\b/))) return +m[1];
  if ((m = u.match(/^per\s+(\d+)\s*(?:minutes?|min)$/))) return round2(+m[1] / 60);
  if (u === "per day") return 8;
  if (u === "per week") return 40;
  return null;
}

// ── the base rate ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Typical starter rates assume a few years of paid work; these adjust that for you. Only used with "Typical". */
export const experienceMods = { "Starting out": 0.75, Established: 1, Senior: 1.35, "Top of field": 1.8 };
export const EXPERIENCE_DEFAULT = "Established";

export const RATE_MODES = {
  typical: { label: "Typical start", note: "A typical rate for this role, adjusted for your experience." },
  goal: { label: "From my goal", note: "Your goal hourly rate times the hours one takes." },
  mine: { label: "My own number", note: "A rate you already use." },
};

/** The finder inputs the user has (or the defaults), for the reality check. */
export const finderInputs = (profile) => ({ ...RATE_FINDER_DEFAULTS, ...(profile?.rateFinder || {}) });

/**
 * The user's own hourly rate. A default rate they chose ("Use as my default rate" in Profile) wins; failing that, what their rate finder currently works out.
 * 25 is the factory default, so it does not count as a choice.
 */
export function goalHourly(profile) {
  const d = num(profile?.defaultBaseRate);
  if (d > 0 && d !== 25) return d;
  if (profile?.rateFinder) { const r = calcBaseRate(profile.rateFinder); if (r.valid) return r.rate; }
  return null;
}
export const hasOwnRate = (profile) => goalHourly(profile) !== null;

/**
 * The base rate a quote uses and how it was reached. It is worked out from the form each time, so there is nothing to keep in step:
 *   deal (a percent model with the deal filled in): your cut x the deal amount, and the quote is then one flat fee;
 *   mine:    the number the user typed (`own`);
 *   goal:    your hourly goal rate x the hours one unit takes;
 *   typical: the model's starter rate x experience.
 * With no way chosen yet it starts on "goal" when the user has a rate of their own and the hours are known, else on "typical".
 * `wanted` says what is missing when the chosen way cannot give a number yet ("hours", "goal", "mine", "deal"); the typical start stands in meanwhile.
 * Returns { mode, rate, hours, wanted }.
 */
export function rateFor({ model, form = {}, profile = {}, own = 0 }) {
  const hours = num(form.hoursPerUnit) || hoursPerUnit(model);
  if (modelKind(model) === "percent" && form.deal) {
    const rate = roundRate((num(form.deal.pct ?? model.base) * num(form.deal.amount)) / 100);
    return { mode: "deal", rate, hours: null, wanted: rate > 0 ? null : "deal" };
  }
  const typical = roundRate(num(model?.base) * (experienceMods[form.experience] ?? 1));
  const mode = RATE_MODES[form.rateMode] ? form.rateMode : hasOwnRate(profile) && hours ? "goal" : "typical";
  if (mode === "mine") return { mode, rate: num(own), hours, wanted: num(own) > 0 ? null : "mine" };
  if (mode === "goal") {
    const hourly = goalHourly(profile);
    if (hourly && hours) return { mode, rate: roundRate(hourly * hours), hours, wanted: null };
    return { mode, rate: typical, hours, wanted: hourly ? "hours" : "goal" };
  }
  return { mode, rate: typical, hours, wanted: null };
}

/** What each way would give for this model, for labelling the three choices: { typical, goal, mine } each a rateFor() result. */
export function ratesByMode({ model, form = {}, profile = {}, own = 0 }) {
  return Object.fromEntries(Object.keys(RATE_MODES).map((mode) => [mode, rateFor({ model, form: { ...form, rateMode: mode }, profile, own })]));
}

/** The hourly rate a base rate comes to (null when the hours one unit takes are not known, or for a share of a deal). */
export function hourlyEquivalent(baseRate, model, form = {}) {
  if (modelKind(model) === "percent") return null;
  const hrs = num(form.hoursPerUnit) || hoursPerUnit(model);
  return hrs ? round2(num(baseRate) / hrs) : null;
}

/**
 * What a freelancer would have to bill per hour to take home what an employee on `medianHourly` does, using the user's own finder settings
 * (billable hours, weeks off, tax set-aside, costs). Same maths as the Profile rate finder: nothing is invented here.
 */
export function freelanceEquivalent(medianHourly, profile) {
  const f = finderInputs(profile), tax = Math.min(60, Math.max(0, num(f.taxRate)));
  const r = calcBaseRate({ ...f, goal: Math.round(num(medianHourly) * 2080 * (1 - tax / 100)) });
  return r.valid ? { rate: r.rate, inputs: f } : null;
}
