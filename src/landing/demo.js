// Demo data for the landing's live mini-calculator. Uses the app's real pricing math and role data.
import rolesData from "../processed_roles.json";
import { buildRoleData } from "../data/allRoles";
import { calcPrice, clientMods, usageRightsMods } from "../utils/pricing";

export const CATEGORIES = Object.keys(rolesData);
// what the app really offers (every field and role on the Quote page), for the claims on the landing; the demo below still plays with the original fields
const ALL = buildRoleData(rolesData);
export const TOTAL_FIELDS = Object.keys(ALL).length;
export const TOTAL_ROLES = Object.values(ALL).reduce((n, f) => n + f.roles.length, 0);
export const ROLE_COUNT = CATEGORIES.reduce((n, c) => n + rolesData[c].roles.length, 0);
export const CLIENT_TYPES = Object.keys(clientMods);
export const USAGES = Object.keys(usageRightsMods);
export { clientMods, usageRightsMods };

export const niceCategory = (c) => c.replace(/ And /g, " & ");
export const rolesOf = (cat) => rolesData[cat].roles;

export function quote({ catIdx, roleIdx, clientType, usage, units }) {
  const cat = CATEGORIES[catIdx] ?? CATEGORIES[0];
  const roles = rolesData[cat].roles;
  const role = roles[roleIdx] ?? roles[0];
  const model = role.models[0];
  const prices = calcPrice({
    baseRate: model.base,
    units,
    complexity: "Standard",
    usage,
    rush: false,
    revisions: 1,
    materialsCost: 0,
    platformFee: 0,
    clientType,
    travelExpense: 0,
  });
  return { cat, role, model, units, ...prices, clientMult: clientMods[clientType] || 1, usageMult: usageRightsMods[usage] || 1 };
}

const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
export const money = (n) => fmt.format(Math.round(Number(n) || 0));
