// Base-rate finder: works backward from what you want to take home to an hourly rate.
//   gross needed  = take-home goal / (1 - tax set-aside) + business expenses
//   billable hrs  = billable hours per week x (52 - weeks off)
//   rate          = gross needed / billable hours
export const RATE_FINDER_DEFAULTS = {
  goal: 60000,        // yearly take-home goal, after tax
  taxRate: 25,        // % of income set aside for tax
  expenses: 6000,     // yearly business costs (software, gear, insurance)
  hoursPerWeek: 20,   // billable hours in a typical week (not hours worked)
  weeksOff: 5,        // holidays, sick days and slow weeks
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Returns { valid, rate, gross, hours, taxSetAside, perWeek } or { valid: false, reason }. */
export function calcBaseRate(input = {}) {
  const i = { ...RATE_FINDER_DEFAULTS, ...input };
  const goal = Math.max(0, num(i.goal));
  const expenses = Math.max(0, num(i.expenses));
  const taxRate = Math.min(60, Math.max(0, num(i.taxRate)));
  const hoursPerWeek = Math.min(80, Math.max(0, num(i.hoursPerWeek)));
  const weeksOff = Math.min(51, Math.max(0, num(i.weeksOff)));
  const hours = hoursPerWeek * (52 - weeksOff);
  if (goal <= 0) return { valid: false, reason: "Enter what you want to take home each year." };
  if (hours <= 0) return { valid: false, reason: "Enter the billable hours you can work in a typical week." };
  const net = goal;
  const gross = net / (1 - taxRate / 100) + expenses;
  const rate = Math.ceil(gross / hours);
  // US self-employment tax: 15.3% of 92.35% of net profit. Rough guide only (ignores the Social Security cap and deductions).
  const profit = gross - expenses;
  const seTax = Math.round(profit * 0.9235 * 0.153);
  return { valid: true, seTax, rate, gross: Math.round(gross), hours: Math.round(hours), taxSetAside: Math.round(gross - expenses - net), perWeek: Math.round(rate * hoursPerWeek) };
}
