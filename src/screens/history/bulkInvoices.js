// Sending several invoices at once (Jobs tab). Pure helpers: who each invoice would go to, how many the plan's daily PDF allowance covers, and a sequential runner
// that reports each step, can be stopped, and never lets one failure hide the others. The actual email is sent by ctx.emailInvoiceFor (App.jsx), the same code path
// as a single "Invoice & email".

/** The most invoices one run sends (each one makes a PDF and an email; the daily PDF allowance of the plan applies on top). */
export const BATCH_MAX = 25;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where each job's invoice would go: [{ job, client, email, ok, reason }]. `ok` is false when there is no usable address. */
export function planInvoices(jobs, clients = []) {
  const byId = new Map(clients.map((c) => [String(c.id), c]));
  return jobs.map((job) => {
    const client = job.clientId ? byId.get(String(job.clientId)) || null : null;
    const email = String(client?.email || "").trim();
    const ok = EMAIL.test(email);
    const reason = ok ? "" : !client ? "No client on this job" : !email ? `${client.name} has no email address` : `${client.name}'s email address looks wrong`;
    return { job, client, email, ok, reason };
  });
}

/**
 * How many of `ready` rows can go today. `limit` is the plan's PDFs per day (Infinity when there is none), `usedToday` what is already used.
 * Returns { allowed, over }: the rows that may be sent (at most BATCH_MAX) and the number held back.
 */
export function withinAllowance(ready, limit, usedToday) {
  const room = Math.max(0, (Number.isFinite(limit) ? limit - usedToday : Infinity));
  const cap = Math.min(BATCH_MAX, room);
  return { allowed: ready.slice(0, cap), over: Math.max(0, ready.length - cap), room: Number.isFinite(room) ? room : null };
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Sends the rows one after another. `send(row)` does one invoice (throw to fail it); `onUpdate(id, state)` hears queued → sending → sent | failed;
 * `shouldStop()` is checked before each one. Returns { sent, failed, stopped } as lists of rows (stopped = never started).
 */
export async function runBatch(rows, { send, onUpdate, shouldStop = () => false, gap = 250 }) {
  const out = { sent: [], failed: [], stopped: [] };
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (shouldStop()) { out.stopped.push(...rows.slice(i)); break; }
    onUpdate(row.job.id, { state: "sending" });
    try {
      await send(row);
      out.sent.push(row); onUpdate(row.job.id, { state: "sent" });
    } catch (e) {
      out.failed.push(row); onUpdate(row.job.id, { state: "failed", error: String(e?.message || e || "Could not send").slice(0, 160) });
    }
    if (i < rows.length - 1) await wait(gap); // a breath between emails: kind to the email service
  }
  return out;
}
