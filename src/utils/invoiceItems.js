// Default invoice line items for a saved job. They always add up to the quoted price (job.price).
import { usageFactor } from "./pricing";

export function buildInvoiceItems(job) {
  const items = [];
  const qty = job.units || 1;
  const materials = (job.materials || []).reduce((sum, m) => sum + (Number(m.qty) || 0) * (Number(m.cost) || 0), 0);
  const travel = Number(job.travelExpense) || 0;

  // The sheet must add up to the quote the client was given (job.price): the main line carries everything that moved
  // the price (complexity, usage, client type, rush, buffer, fees), so materials and travel are listed at face value.
  const quoted = Number(job.price);
  const main = Number.isFinite(quoted) && quoted > 0
    ? Math.max(0, quoted - materials - travel)
    : qty * (job.baseRate || 0);

  // Usage licence is its own line when the job was quoted with a licence term.
  const uf = usageFactor(job);
  const licensed = !!job.usageTerm && uf > 1;
  const license = licensed ? Math.round(main * (1 - 1 / uf) * 100) / 100 : 0;
  const creative = Math.round((main - license) * 100) / 100;
  const detail = [job.complexity || "Standard", job.usage || "Personal"].join(", ");

  items.push({
    id: "primary",
    desc: `${job.role} - ${job.category}`,
    note: `${job.model} (${detail})`,
    qty,
    rate: Math.round((creative / qty) * 100) / 100,
    amount: creative,
  });

  if (licensed) {
    items.push({
      id: "license",
      desc: "Usage licence",
      note: `${job.usage}, ${job.usageTerm}${job.exclusive ? ", exclusive" : ""}`,
      qty: 1,
      rate: license,
      amount: license,
    });
  }

  (job.materials || []).forEach((m, idx) => {
    items.push({
      id: `mat-${idx}`,
      desc: `Material: ${m.name}`,
      note: `Unit cost: $${m.cost}`,
      qty: m.qty,
      rate: m.cost,
      amount: m.qty * m.cost,
    });
  });

  if (travel > 0) {
    items.push({
      id: "travel",
      desc: "Travel Expenses",
      note: "Direct commute costs",
      qty: 1,
      rate: travel,
      amount: travel,
    });
  }

  return items;
}
