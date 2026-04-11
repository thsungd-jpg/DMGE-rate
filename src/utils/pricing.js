export const complexityMods = { Simple: 0.8, Standard: 1.0, Complex: 1.4, Masterpiece: 2.0 };
export const usageRightsMods = { Personal: 1.0, Commercial: 1.6, "Merch/Print": 1.9, Exclusive: 2.5 };
export const clientMods = { Individual: 1.0, Startup: 1.2, Agency: 1.5, Corporate: 2.2 };

export function calcPrice({
  baseRate,
  units,
  complexity,
  usage,
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
  const uM = usageRightsMods[usage] || 1;
  const clM = clientMods[clientType] || 1;
  const rushM = rush ? 1.3 : 1;
  const revM = revisions === 0 ? 0.95 : revisions <= 2 ? 1 : 1.15;
  const subtotal = base * cM * uM * rushM * revM * clM;
  const withMats = subtotal + (Number(materialsCost) || 0);
  const travel = Number(travelExpense) || 0;
  const final = (withMats + travel) * clientMultiplier;
  const withFee = final * (1 + (Number(platformFee) || 0) / 100);
  const fair = Math.max(withFee, 50);
  return { low: fair * 0.8, fair, premium: fair * 1.3, travel };
}

/**
 * Line-item breakdown matching calcPrice (for PDF). Uses stored job fields + client multiplier.
 */
export function buildInvoiceFigures(job, clientMultiplier = 1.0) {
  const baseRate = job.baseRate || 25;
  const units = job.units || 1;
  const base = baseRate * units;
  const cM = complexityMods[job.complexity] || 1;
  const uM = usageRightsMods[job.usage] || 1;
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
