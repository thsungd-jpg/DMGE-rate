#!/usr/bin/env node
// Checks the Quote page's role data: every field, role and pricing model, the search words, and the wage anchors.
//
//   node scripts/check-roles.mjs              errors fail the run (exit 1); warnings are listed but do not
//   node scripts/check-roles.mjs --self-test  feeds it a deliberately broken copy and expects it to fail
//   node scripts/check-roles.mjs --table      prints every starting rate as a markdown sheet for review (docs/starter-rates.md)
//
// Errors are things that would break a quote or a saved job. Warnings are judgment calls worth a look: a time-based starting rate below what employees in a
// matching job earn per hour (the rate is then below the BLS median, so a freelancer following it would earn less than an employee doing the same work).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { buildRoleData } from "../src/data/allRoles.js";
import { ROLE_SOC, WAGES, anchorFor } from "../src/data/wageAnchors.js";
import { modelKind, unitNoun, hoursPerUnit } from "../src/utils/rateModels.js";

const root = fileURLToPath(new URL("..", import.meta.url));
const rolesJson = JSON.parse(readFileSync(root + "src/processed_roles.json", "utf8"));

export function check(data, { roleSoc = ROLE_SOC, wages = WAGES } = {}) {
  const errors = [], warnings = [];
  const err = (m) => errors.push(m), warn = (m) => warnings.push(m);
  let roles = 0, models = 0;

  for (const [field, f] of Object.entries(data)) {
    if (!Array.isArray(f.roles) || !f.roles.length) { err(`${field}: no roles`); continue; }
    const names = new Set();
    for (const r of f.roles) {
      roles++;
      const where = `${field} / ${r.name}`;
      if (!r.name || typeof r.name !== "string") { err(`${field}: a role has no name`); continue; }
      if (names.has(r.name.toLowerCase())) err(`${where}: duplicate role name in this field`);
      names.add(r.name.toLowerCase());
      if (!Array.isArray(r.models) || !r.models.length) { err(`${where}: no pricing models`); continue; }
      if (!Array.isArray(r.materials)) err(`${where}: materials must be an array`);
      for (const k of r.keywords || []) if (typeof k !== "string" || k !== k.toLowerCase() || !k.trim()) err(`${where}: keyword "${k}" must be lowercase text`);
      for (const mat of r.materials || []) if (!mat.name || !(Number(mat.cost) >= 0)) err(`${where}: supply "${mat.name}" needs a name and a cost`);

      const types = new Set();
      for (const m of r.models) {
        models++;
        const mw = `${where} / ${m.type}`;
        if (!m.type || !m.unit) { err(`${mw}: a model needs a type and a unit`); continue; }
        if (types.has(m.type.toLowerCase())) err(`${mw}: duplicate model name in this role`);
        types.add(m.type.toLowerCase());
        if (!(Number(m.base) > 0)) err(`${mw}: base must be above 0 (is ${m.base})`);
        const kind = modelKind(m);
        if (kind === "percent" && Number(m.base) > 100) err(`${mw}: a percentage above 100 (${m.base})`);
        if (unitNoun(m).one === "unit") err(`${mw}: the unit "${m.unit}" is not one the app can word ("How many ...?")`);
        if (m.hours !== undefined && !(Number(m.hours) > 0)) err(`${mw}: hours must be above 0`);
        // judgment: below the employee median per hour for a matching job
        const a = anchorFor(field, r.name);
        const hrs = Number(m.hours) || hoursPerUnit(m);
        if (a && kind !== "percent" && hrs && Number(m.base) / hrs < a.median * 0.9) {
          warn(`${mw}: $${(m.base / hrs).toFixed(0)}/hr is below the employee median of $${a.median}/hr for ${a.title}`);
        }
      }
    }
  }

  for (const [key, soc] of Object.entries(roleSoc)) {
    const [field, role] = key.split("::");
    if (!data[field]?.roles.some((r) => r.name === role)) err(`wage anchor "${key}" points at a role that does not exist`);
    if (!wages[soc]) err(`wage anchor "${key}" uses ${soc}, which has no wage entry`);
  }
  for (const [soc, w] of Object.entries(wages)) {
    if (!(w.p25 > 0 && w.p25 <= w.median && w.median <= w.p75)) err(`wage ${soc} ${w.title}: percentiles must rise (${w.p25}, ${w.median}, ${w.p75})`);
  }
  return { errors, warnings, fields: Object.keys(data).length, roles, models };
}

const data = buildRoleData(rolesJson);

if (process.argv.includes("--table")) {
  const pretty = (c) => c.replace(/ And /g, " & ").replace(/\bTv\b/g, "TV").replace(/\bUx\b/g, "UX");
  const fmt = (m) => (modelKind(m) === "percent" ? `${m.base}%` : m.base < 1 ? `$${m.base}` : `$${m.base.toLocaleString("en-US")}`);
  // "owner": already in the app before the Quote page was widened (src/processed_roles.json, or the first model of Photography / Illustration); "new": added since
  const isOwner = (field, role, m, i) => rolesJson[field]?.roles.some((r) => r.name === role.name && r.models.some((x) => x.type === m.type)) || (field === "Featured Crafts" && i === 0);
  const out = [
    "# Starting rates, for review",
    "",
    "Generated by `node scripts/check-roles.mjs --table`; do not edit by hand (change `src/data/creatorRoles.js`, `src/data/featuredCrafts.js` or `src/processed_roles.json`, then regenerate).",
    "",
    "Every number here is a **labelled starting point**, not a market fact: the Rate step lets a user start from it, from their own goal, or from their own number. **Source** says where a",
    "number came from: *owner* = was already in the app (a few placeholder percentages and salaries were corrected), *new* = added with the wider Quote page and is a judgment call that",
    "deserves a skim. *Hours* is how long one unit usually takes, used only by \"From my goal\". The BLS figure is what US **employees** in a matching job earn per hour (OEWS, May 2025);",
    "it is shown to users only as orientation, never as a freelance rate.",
    "",
  ];
  for (const [field, f] of Object.entries(data)) {
    out.push(`## ${pretty(field)}`, "");
    for (const r of f.roles) {
      const a = anchorFor(field, r.name);
      out.push(`### ${r.name}${a ? `  (BLS: ${a.title}, median $${a.median}/hr)` : ""}`, "", "| Pricing model | Unit | Starting rate | Hours | Source |", "|---|---|---|---|---|");
      r.models.forEach((m, i) => out.push(`| ${m.type} | ${m.unit} | ${fmt(m)} | ${m.hours ?? hoursPerUnit(m) ?? ""} | ${isOwner(field, r, m, i) ? "owner" : "new"} |`));
      out.push("");
    }
  }
  console.log(out.join("\n"));
  process.exit(0);
}

if (process.argv.includes("--self-test")) {
  const bad = JSON.parse(JSON.stringify(data));
  bad["Creator Economy"].roles[0].models.push({ type: "Broken", unit: "per whatever you like", base: -5 });
  bad["Creator Economy"].roles.push({ ...bad["Creator Economy"].roles[0] }); // a duplicate role
  const r = check(bad);
  const ok = r.errors.length >= 3;
  console.log(ok ? `self-test ok: the deliberately broken copy fails with ${r.errors.length} errors` : "self-test FAILED: the broken copy was not caught");
  process.exit(ok ? 0 : 1);
}

const r = check(data);
console.log(`${r.fields} fields, ${r.roles} roles, ${r.models} pricing models`);
if (r.warnings.length) console.log(`\n${r.warnings.length} warning(s):\n  ` + r.warnings.join("\n  "));
if (r.errors.length) { console.log(`\n${r.errors.length} ERROR(S):\n  ` + r.errors.join("\n  ")); process.exit(1); }
console.log("\nrole data OK");
