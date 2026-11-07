import { FEATURED } from "./featuredCrafts.js";
import { NEW_FIELDS, EXTRA_ROLES } from "./creatorRoles.js";
import { ROLE_KEYWORDS } from "./roleKeywords.js";

/**
 * Every field and role the Quote page offers, in order: Featured Crafts, the original fields (src/processed_roles.json, passed in so the app can import it and
 * the check script can read it from disk), then the new fields. Roles added to existing fields come after the roles those fields already had. Every role ends up
 * with `keywords` (for search) and `materials` (the app maps over it).
 */
export function buildRoleData(rolesJson) {
  const out = {};
  for (const [field, f] of Object.entries({ ...FEATURED, ...rolesJson, ...NEW_FIELDS })) {
    const roles = [...f.roles, ...(EXTRA_ROLES[field] || [])].map((r) => ({ keywords: ROLE_KEYWORDS[`${field}::${r.name}`] || [], ...r, materials: r.materials || [] }));
    out[field] = { ...f, roles };
  }
  return out;
}
