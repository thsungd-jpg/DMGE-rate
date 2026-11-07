#!/usr/bin/env node
// Checks the Quote page's rate logic (src/utils/rateModels.js) and that it feeds the unchanged price engine (src/utils/pricing.js) correctly.
//   node scripts/check-rates.mjs        exits 1 on the first run that has a failed check
import assert from "node:assert/strict";
import { rateFor, ratesByMode, goalHourly, defaultUnits, hoursPerUnit, unitNoun, askQuantity, modelKind, groupModels, freelanceEquivalent, hourlyEquivalent } from "../src/utils/rateModels.js";
import { calcPrice } from "../src/utils/pricing.js";

let n = 0;
const check = (name, fn) => { try { fn(); n++; } catch (e) { console.error(`FAILED: ${name}\n  ${e.message}`); process.exitCode = 1; } };

const hourly = { type: "Standard Session", unit: "per hour", base: 25 };
const day = { type: "Day Rate", unit: "per day", base: 1000 };
const project = { type: "Project", unit: "per project", base: 1500 };
const agent = { type: "Commission", unit: "% of gross", base: 10 };
const noProfile = {};
const finder = { goal: 60000, taxRate: 25, expenses: 6000, hoursPerWeek: 20, weeksOff: 5 }; // 60,000 / .75 + 6,000 = 86,000 over 20 h x 47 weeks = 940 h -> 92 an hour
const withFinder = { rateFinder: finder };

check("typical start is the model's own rate, times experience", () => {
  assert.equal(rateFor({ model: hourly, profile: noProfile }).rate, 25);
  assert.equal(rateFor({ model: hourly, form: { experience: "Starting out" }, profile: noProfile }).rate, 18.75);
  assert.equal(rateFor({ model: hourly, form: { experience: "Senior" }, profile: noProfile }).rate, 33.75);
  assert.equal(rateFor({ model: hourly, form: { experience: "Top of field" }, profile: noProfile }).rate, 45);
});
check("a user with no rate of their own starts on typical (today's numbers do not change)", () => {
  assert.equal(rateFor({ model: hourly, profile: noProfile }).mode, "typical");
  assert.equal(rateFor({ model: hourly, profile: { defaultBaseRate: 25 } }).mode, "typical"); // 25 is the factory value
});
check("a user with a rate finder starts on goal when the hours are known", () => {
  assert.equal(goalHourly(withFinder), 92);
  const r = rateFor({ model: hourly, profile: withFinder });
  assert.equal(r.mode, "goal"); assert.equal(r.rate, 92);
  assert.equal(rateFor({ model: day, profile: withFinder }).rate, 92 * 8);
});
check("an unknown number of hours falls back to the typical start and says what is missing", () => {
  const r = rateFor({ model: project, form: { rateMode: "goal" }, profile: withFinder });
  assert.equal(r.rate, 1500); assert.equal(r.wanted, "hours");
  assert.equal(rateFor({ model: project, profile: withFinder }).mode, "typical"); // not chosen, hours unknown: stays on typical
  assert.equal(rateFor({ model: project, form: { rateMode: "goal", hoursPerUnit: 20 }, profile: withFinder }).rate, 1840);
});
check("goal with no rate of their own at all says so", () => {
  const r = rateFor({ model: hourly, form: { rateMode: "goal" }, profile: noProfile });
  assert.equal(r.wanted, "goal"); assert.equal(r.rate, 25);
});
check("an applied default rate wins over the finder's current output", () => {
  assert.equal(goalHourly({ defaultBaseRate: 70, rateFinder: finder }), 70);
});
check("my own number is used as typed", () => {
  const r = rateFor({ model: day, form: { rateMode: "mine" }, profile: withFinder, own: 450 });
  assert.equal(r.mode, "mine"); assert.equal(r.rate, 450);
  assert.equal(rateFor({ model: day, form: { rateMode: "mine" }, own: 0 }).wanted, "mine");
});
check("a percent deal: 10% of $20,000 is a $2,000 base rate and a $2,000 fair price", () => {
  const form = { units: 1, complexity: "Standard", usage: "Personal", clientType: "Individual", revisions: 1, deal: { pct: 10, amount: 20000 } };
  const r = rateFor({ model: agent, form, profile: noProfile });
  assert.equal(r.mode, "deal"); assert.equal(r.rate, 2000);
  const p = calcPrice({ ...form, baseRate: r.rate, materialsCost: 0, clientMultiplier: 1 });
  assert.equal(Math.round(p.fair), 2000);
});
check("a percent deal with no amount yet wants the deal, and is not a price", () => {
  const r = rateFor({ model: agent, form: { deal: { pct: 10, amount: "" } }, profile: noProfile });
  assert.equal(r.rate, 0); assert.equal(r.wanted, "deal");
});
check("an old job on a percent model (no deal saved) reopens as my own number with its saved rate", () => {
  const r = rateFor({ model: agent, form: { rateMode: "mine", units: 3 }, profile: noProfile, own: 50 });
  assert.equal(r.rate, 50);
});
check("ratesByMode labels all three ways", () => {
  const m = ratesByMode({ model: day, profile: withFinder, own: 300 });
  assert.equal(m.typical.rate, 1000); assert.equal(m.goal.rate, 736); assert.equal(m.mine.rate, 300);
});
check("a rate under a dollar keeps its precision (a per-word rate times experience)", () => {
  const word = { type: "Copyediting", unit: "per word", base: 0.045, hours: 0.0011 };
  assert.equal(rateFor({ model: word, form: { experience: "Starting out" }, profile: noProfile }).rate, 0.0338);
  assert.equal(rateFor({ model: word, form: { rateMode: "goal" }, profile: withFinder }).rate, 0.1012); // 92 an hour x 0.0011 hours a word
});
check("hours per unit", () => {
  assert.equal(hoursPerUnit(hourly), 1); assert.equal(hoursPerUnit(day), 8);
  assert.equal(hoursPerUnit({ unit: "per 3-hr session" }), 3); assert.equal(hoursPerUnit({ unit: "per 30 minutes" }), 0.5);
  assert.equal(hoursPerUnit({ unit: "per project", hours: 12 }), 12); assert.equal(hoursPerUnit(project), null);
  assert.equal(hourlyEquivalent(1000, day), 125); assert.equal(hourlyEquivalent(2000, agent), null);
});
check("the quantity question reads naturally", () => {
  assert.equal(askQuantity(hourly), "How many hours?"); assert.equal(askQuantity(day), "How many days?");
  assert.equal(askQuantity(project), "How many projects?"); assert.equal(askQuantity({ unit: "per 1,000 views" }), "How many thousand views?");
  assert.equal(unitNoun({ unit: "per 3-hr session" }).one, "3-hour session"); assert.equal(askQuantity({ unit: "flat fee" }), "How many jobs?");
});
check("sensible starting quantities", () => {
  assert.equal(defaultUnits(hourly), 2); assert.equal(defaultUnits(day), 1); assert.equal(defaultUnits(agent), 1);
  assert.equal(defaultUnits({ unit: "per word" }), 500); assert.equal(defaultUnits({ unit: "per second" }), 30);
});
check("models are grouped by how they charge, and keep their index", () => {
  const g = groupModels([hourly, project, agent, day]);
  assert.deepEqual(g.map((x) => x.kind), ["time", "unit", "percent"]);
  assert.deepEqual(g[0].items.map((x) => x.index), [0, 3]); assert.equal(modelKind(agent), "percent");
});
check("the BLS reality check uses the user's own finder settings", () => {
  const fe = freelanceEquivalent(30, withFinder);
  // 30 an hour employed = 62,400 a year; take-home after 25% = 46,800; (46,800 / .75 + 6,000) / 940 billable hours = 72.8 -> 73 an hour
  assert.equal(fe.rate, 73);
});

console.log(process.exitCode ? "\nrate checks FAILED" : `rate checks OK (${n} groups)`);
