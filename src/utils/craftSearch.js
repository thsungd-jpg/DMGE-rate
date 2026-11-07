// Search over every role in every field. Plain scoring, no library: a few hundred roles search instantly.
const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9&+# ]+/g, " ").replace(/\s+/g, " ").trim();

/** One entry per role: where it is (field, role index) and the text to match against. */
export function buildIndex(data) {
  const out = [];
  for (const [field, f] of Object.entries(data)) {
    f.roles.forEach((r, index) => {
      const kws = (r.keywords || []).map(norm).filter(Boolean);
      out.push({ field, role: r.name, index, name: norm(r.name), kws, words: kws.join(" "), fieldText: norm(field) });
    });
  }
  return out;
}

const hasWordStart = (text, q) => text.split(" ").some((w) => w.startsWith(q));

/** The best matches for a query, best first: [{ field, role, index, score }]. Every word you type has to match somewhere (name, keyword or field). */
export function searchCrafts(index, query, limit = 12) {
  const q = norm(query);
  if (!q) return [];
  const terms = q.split(" ");
  const hits = [];
  for (const e of index) {
    let score = 0;
    if (e.name === q) score = 100;
    else if (e.name.split(" ").includes(q)) score = 92;                  // a whole word of the name: "pr" finds PR Specialist before Prop Master
    else if (e.name.startsWith(q)) score = 85;
    else if (hasWordStart(e.name, q)) score = 75;
    else if (e.name.includes(q)) score = 62;
    else if (e.kws.includes(q)) score = 58;                              // a whole keyword: "logo"
    else if (e.kws.some((k) => k.startsWith(q))) score = 52;
    else if (e.kws.some((k) => (` ${k} `).includes(` ${q} `))) score = 46; // a word inside a longer keyword: "sonic logo"
    else if (hasWordStart(e.words, q)) score = 40;
    if (!score) {
      const all = terms.every((t) => e.name.includes(t) || e.words.includes(t) || e.fieldText.includes(t));
      if (all) score = 28 + terms.filter((t) => e.name.includes(t)).length * 4;
      else if (e.fieldText.includes(q)) score = 14;
    }
    if (score) hits.push({ field: e.field, role: e.role, index: e.index, score });
  }
  // best score first; among equals the shorter name (closer to what was typed), then alphabetical
  return hits.sort((a, b) => b.score - a.score || a.role.length - b.role.length || a.role.localeCompare(b.role)).slice(0, limit);
}

/** The last few different crafts used, newest first, from saved jobs: [{ field, role }]. */
export function recentCrafts(jobs = [], data, limit = 4) {
  const seen = new Set(), out = [];
  for (const j of [...jobs].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))) {
    const key = `${j.category}::${j.role}`;
    if (!j.category || !j.role || seen.has(key) || !data[j.category]?.roles.some((r) => r.name === j.role)) continue;
    seen.add(key); out.push({ field: j.category, role: j.role });
    if (out.length >= limit) break;
  }
  return out;
}

/** A hand-picked set to start from when nothing has been typed yet: [field, role]. Skipped silently if a role is ever renamed away. */
export const POPULAR = [
  ["Featured Crafts", "Photography"],
  ["Visual And Graphic Arts", "Graphic Designer"],
  ["Film And Tv", "Videographer"],
  ["Writing And Content", "Content Creator / Influencer"],
  ["Design And UX", "UI / UX Designer"],
  ["Writing And Publishing", "Copywriter"],
  ["Performance And Talent", "Musician / Singer"],
  ["Featured Crafts", "Illustration"],
];
