import React, { useMemo, useRef, useState } from "react";
import { PBtn, PModal } from "../../components/ui";
import { TIERS } from "../../utils/subscription";
import { fmtMoney2 } from "./statusModel";
import { BATCH_MAX, planInvoices, runBatch, withinAllowance } from "./bulkInvoices";

const STATE_LABEL = { queued: "Ready", sending: "Sending…", sent: "Sent", failed: "Failed", skipped: "Not sent" };

/** "Send invoices": review who gets what, then send them one after another. Nothing is sent until the button is pressed. */
export default function BulkSend({ jobs, ctx, onClose }) {
  const { clients, emailInvoiceFor, markJobSent, addPdfCount, todayPdfCount = 0, userTier } = ctx;
  const plan = useMemo(() => planInvoices(jobs, clients), [jobs, clients]);
  const limit = TIERS[userTier]?.limits.pdfsPerDay ?? Infinity;
  const { allowed, over, room } = useMemo(() => withinAllowance(plan.filter((r) => r.ok), limit, todayPdfCount), [plan, limit, todayPdfCount]);
  const allowedIds = useMemo(() => new Set(allowed.map((r) => r.job.id)), [allowed]);

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState({}); // job id -> { state, error }
  const [phase, setPhase] = useState("review"); // review | running | done
  const stop = useRef(false);

  const stateOf = (row) => status[row.job.id]?.state || (allowedIds.has(row.job.id) ? "queued" : "skipped");
  const reasonOf = (row) => status[row.job.id]?.error || (!row.ok ? row.reason : !allowedIds.has(row.job.id) ? "Over today's PDF allowance or the per-run limit" : "");
  const count = (s) => plan.filter((r) => stateOf(r) === s).length;

  const start = async (rows) => {
    stop.current = false; setPhase("running");
    const result = await runBatch(rows, {
      shouldStop: () => stop.current,
      onUpdate: (id, st) => setStatus((m) => ({ ...m, [id]: st })),
      send: async (row) => { await emailInvoiceFor(row.job, { to: row.email, message }); await markJobSent(row.job.id); },
    });
    if (result.sent.length) await addPdfCount(result.sent.length);
    setPhase("done");
  };

  const retry = () => start(plan.filter((r) => status[r.job.id]?.state === "failed" || (allowedIds.has(r.job.id) && !status[r.job.id])));
  const sent = count("sent"), failed = count("failed"), cannot = plan.filter((r) => !r.ok).length;
  const toSend = phase === "review" ? allowed : [];

  return (
    <PModal isOpen onClose={phase === "running" ? () => { stop.current = true; } : onClose} title={phase === "done" ? "Invoices sent" : "Send invoices"}>
      <div className="bs">
        {phase === "review" && (
          <p className="mdl-lede">
            {allowed.length > 0
              ? <>Each invoice goes to its client as a PDF. Review who gets what, then press send. <b>Nothing is sent until you do.</b></>
              : <>None of these invoices can be sent yet. Add an email address to the client on each job and try again.</>}
          </p>
        )}
        {(phase === "running" || phase === "done") && (
          <p className="mdl-lede" role="status" aria-live="polite">
            {phase === "running" ? `Sending… ${sent + failed} of ${allowed.length} done.` : `${sent} sent${failed ? `, ${failed} failed` : ""}${cannot || over ? `, ${cannot + over} not sent` : ""}.`}
          </p>
        )}

        <ul className="bs-list" aria-label="Invoices to send">
          {plan.map((r) => {
            const st = stateOf(r), why = reasonOf(r);
            return (
              <li key={r.job.id} className="bs-row" data-state={st}>
                <div className="bs-main">
                  <b>{r.client?.name || r.job.role}</b>
                  <span>{r.job.invoiceNumber || "Estimate"} · {r.job.role}{r.ok ? ` · ${r.email}` : ""}</span>
                  {why && <small className={st === "failed" ? "is-error" : ""}>{why}</small>}
                </div>
                <div className="bs-side"><b>{fmtMoney2(r.job.price)}</b><span className="bs-state" data-state={st}>{STATE_LABEL[st]}</span></div>
              </li>
            );
          })}
        </ul>

        {phase === "review" && allowed.length > 0 && (
          <>
            <label className="bs-msg">
              <span>Message (optional, added to every email)</span>
              <textarea className="mdl-textarea" rows={3} value={message} maxLength={600} placeholder="Thank you for your business." onChange={(e) => setMessage(e.target.value)} />
            </label>
            <p className="bs-note">
              {room !== null && <>Each invoice makes a PDF, so this uses {allowed.length} of the {room} left in today's allowance on your {TIERS[userTier]?.name || ""} plan. </>}
              {over > 0 && <>{over} more will have to wait (up to {BATCH_MAX} at a time, and your daily allowance). </>}
              {cannot > 0 && <>{cannot} can't be sent without an email address. </>}
            </p>
          </>
        )}

        <div className="mdl-actions">
          {phase === "review" && <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={onClose}>Cancel</PBtn>}
          {phase === "review" && <PBtn color="var(--butter)" disabled={allowed.length === 0} onClick={() => start(toSend)}>Send {allowed.length} invoice{allowed.length === 1 ? "" : "s"}</PBtn>}
          {phase === "running" && <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => { stop.current = true; }}>Stop after this one</PBtn>}
          {phase === "done" && failed > 0 && <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={retry}>Try the {failed} failed again</PBtn>}
          {phase === "done" && <PBtn color="var(--butter)" onClick={onClose}>Done</PBtn>}
        </div>
      </div>
    </PModal>
  );
}
