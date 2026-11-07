// Plain-language descriptions of every choice on the Quote page, so a person always knows exactly what they have picked. Each is { name, text }.
// The multipliers are the real ones from src/utils/pricing.js (shown beside each name by the controls); these say what they MEAN.
import { modelKind, unitNoun, EXPERIENCE_DEFAULT } from "../../utils/rateModels";
import { rateText } from "./common";

export const COMPLEXITY = {
  Simple: "Straightforward work with few decisions and little back and forth. Priced 20% below a standard job.",
  Standard: "A normal job with a normal amount of back and forth. This is the baseline everything else is measured from.",
  Complex: "Many moving parts, a demanding brief or tight standards. Priced 40% above a standard job.",
  Masterpiece: "Your most ambitious work, made to be the showpiece. Priced at double a standard job.",
};

export const CLIENT = {
  Individual: "A person paying for themselves. The baseline price.",
  Startup: "A small team with a real budget that is watching it. Priced 20% above an individual.",
  Agency: "Resells your work to its own clients and often brings repeat work. Priced 50% above an individual.",
  Corporate: "A large company: bigger budgets, more approvals and slower payment. Priced 2.2 times an individual.",
};

export const USAGE = {
  Personal: "The client uses the work for themselves, not to promote or sell anything. The baseline.",
  Commercial: "The client uses the work to promote or sell something: ads, a website, a product page. Priced 1.6 times personal use.",
  "Merch/Print": "The work is printed on things that are sold, like shirts, posters or packaging. Priced 1.9 times personal use.",
  Exclusive: "Only the client may use the work: you cannot resell or reuse it. Priced 2.5 times personal use.",
};

export const TERM = {
  "30 days": "The client may use the work for one month. Half the price of a year.",
  "1 year": "The client may use the work for a year. The baseline.",
  "3 years": "Three years of use. Priced 1.6 times a year.",
  Perpetual: "No end date. Priced 3 times a year, because you give up every future sale of it.",
};

export const EXCLUSIVITY = {
  "Not exclusive": "The client's competitors may license or use similar work from you.",
  Exclusive: "No competitor of the client may use it. Adds 50% to the price.",
};

export const EXPERIENCE = {
  "Starting out": "New to charging for this, or still building a portfolio. A typical rate times 0.75.",
  Established: "A few years of steady paid work. The typical rate exactly as listed.",
  Senior: "Many years of work and a body of it people recognise. A typical rate times 1.35.",
  "Top of field": "A name clients seek out and will wait for. A typical rate times 1.8.",
};

export const RATE_WAY = {
  typical: "Begins at the usual starting rate for this way of charging, adjusted for your experience.",
  goal: "Begins at the hourly rate you need to reach your take-home goal, times the hours one unit takes you.",
  mine: "Begins at a number you already charge, or want to. Nothing is adjusted.",
};

export const RATE_NAME = { typical: "Typical start", goal: "From my goal", mine: "My own number" };

/** How a pricing model charges, in words: by time, by deliverable or as a share of a deal. */
export function describeModel(model) {
  const kind = modelKind(model), noun = unitNoun(model), u = String(model.unit || "").toLowerCase();
  const start = kind === "percent" ? `Typical cut: ${model.base}%.` : `Typical start: ${rateText(model.base)} ${u.replace("per hour", "per hr")}.`;
  let text;
  if (kind === "percent") text = "You earn a share of an amount (a deal, ad spend or sales): you give the amount and your cut, and that becomes one flat fee.";
  else if (u === "per hour") text = "Billed by the hour: your rate times the hours you bill.";
  else if (u === "per day") text = "A day rate: one price for a full working day, about eight hours.";
  else if (u === "per week") text = "A weekly rate: one price for each week of work.";
  else if (u === "per month") text = "A monthly rate: one price for each month, usually a retainer.";
  else if (kind === "time") text = `One price for each ${noun.one} of your time.`;
  else if (/^flat\b/.test(u)) text = "One fee for the whole job, however long it takes.";
  else text = `One price for each ${noun.one}; you say how many ${noun.many}.`;
  return `${text} ${start}`;
}

/** A craft in a line: how many ways to charge, and the first few. */
export function describeCraft(role) {
  const units = [...new Set(role.models.map((m) => String(m.unit).replace("per hour", "per hr")))];
  const shown = units.slice(0, 3).join(", ");
  const n = role.models.length;
  return `${n} ${n === 1 ? "way" : "ways"} to charge, like ${shown}${units.length > 3 ? " and more" : ""}.`;
}

export { EXPERIENCE_DEFAULT };
