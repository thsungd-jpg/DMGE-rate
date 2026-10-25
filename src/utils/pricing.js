export const complexityMods = { Simple: 0.8, Standard: 1.0, Complex: 1.4, Masterpiece: 2.0 };
export const usageRightsMods = { Personal: 1.0, Commercial: 1.6, "Merch/Print": 1.9, Exclusive: 2.5 };
// Licence term and exclusivity refine the usage-rights scope. "1 year" and non-exclusive equal 1, so jobs saved before
// these existed (no usageTerm) price exactly as they did.
export const usageTermMods = { "30 days": 0.5, "1 year": 1.0, "3 years": 1.6, Perpetual: 3.0 };
export const EXCLUSIVITY_MOD = 1.5;

// Crafts that sell usage licences (photo, video, film, illustration). Other crafts keep the single scope multiplier.
const LICENSING_CATEGORIES = ["Film And Tv", "Visual And Graphic Arts"];
const LICENSING_ROLE = /photo|video|film|cinemat|illustrat|director|editor|animat/i;
export function hasLicensing(category, roleName) {
  return LICENSING_CATEGORIES.includes(category) || LICENSING_ROLE.test(roleName || "");
}

/** Combined usage multiplier: scope x term x exclusivity. */
export function usageFactor({ usage, usageTerm, exclusive }) {
  return (usageRightsMods[usage] || 1) * (usageTermMods[usageTerm] || 1) * (exclusive ? EXCLUSIVITY_MOD : 1);
}

export const clientMods = { Individual: 1.0, Startup: 1.2, Agency: 1.5, Corporate: 2.2 };

export function calcPrice({
  baseRate,
  units,
  complexity,
  usage,
  usageTerm,
  exclusive,
  rush,
  revisions,
  materialsCost,
  platformFee,
  clientType,
  travelExpense,
  clientMultiplier = 1.0,
}) {
  const base = baseRate * units;
  const cM = complexityMods[complexity] || 1;
  const uM = usageFactor({ usage, usageTerm, exclusive });
  const clM = clientMods[clientType] || 1;
  const rushM = rush ? 1.3 : 1;
  const revM = revisions === 0 ? 0.95 : revisions <= 2 ? 1 : 1.15;
  const subtotal = base * cM * uM * rushM * revM * clM;
  const withMats = subtotal + (Number(materialsCost) || 0);
  const travel = Number(travelExpense) || 0;
  // Share of the price that is the usage licence (the rest is the creative fee). Client multiplier and fees scale both.
  const preClient = withMats + travel;
  const licenseFrac = preClient > 0 && uM > 1 ? (subtotal - subtotal / uM) / preClient : 0;
  const final = (withMats + travel) * clientMultiplier;
  const withFee = final * (1 + (Number(platformFee) || 0) / 100);
  const fair = Math.max(withFee, 50);
  return { low: fair * 0.8, fair, premium: fair * 1.3, travel, licenseFrac, usageFactor: uM };
}

/**
 * Line-item breakdown matching calcPrice (for PDF). Uses stored job fields + client multiplier.
 */
export function buildInvoiceFigures(job, clientMultiplier = 1.0) {
  const baseRate = job.baseRate || 25;
  const units = job.units || 1;
  const base = baseRate * units;
  const cM = complexityMods[job.complexity] || 1;
  const uM = usageFactor(job);
  const clM = clientMods[job.clientType] || 1;
  const rushM = job.rush ? 1.3 : 1;
  const revM = job.revisions === 0 ? 0.95 : job.revisions <= 2 ? 1 : 1.15;
  const subtotal = base * cM * uM * rushM * revM * clM;
  const materialsTotal = Number(job.materialsCost) || 0;
  const travelTotal = Number(job.travelExpense) || 0;
  const preClient = subtotal + materialsTotal + travelTotal;
  const afterClient = preClient * clientMultiplier;
  const platformPct = Number(job.platformFee) || 0;
  const platformFeeAmount = afterClient * (platformPct / 100);
  const totalDue = Math.max(afterClient + platformFeeAmount, 50);

  return {
    base,
    baseRate,
    units,
    cM,
    uM,
    clM,
    rushM,
    revM,
    subtotal,
    materialsTotal,
    travelTotal,
    clientMultiplier,
    preClient,
    afterClient,
    platformPct,
    platformFeeAmount,
    totalDue,
  };
}
