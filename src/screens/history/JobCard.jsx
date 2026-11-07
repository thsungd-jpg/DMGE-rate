import React, { useState } from "react";
import { Card } from "../../components/kit";
import { PBtn } from "../../components/ui";
import { createInvoicePayLink, PAY_LINK_ENABLED } from "../../utils/payments";
import { IconClients, IconDelete, IconDownload, IconEdit, IconLock, IconSend, IconTemplates } from "../../icons";
import { fmtMoney, isValidDate, normalizeStatus, STATUS_META, STATUS_ORDER } from "./statusModel";

// One job: reference + status, client / role, amount, due line, actions, and a status control.
// All behavior comes from ctx handlers and from `actions` (useJobActions).
export default function JobCard({ job: j, client, ctx, actions, pdfLocked }) {
  const { fmtDate, handleDeleteJob, handleEditJob, handleGatedPDF, handleSendQuote, userTier } = ctx;
  const [pay, setPay] = useState({ busy: false, msg: "", error: false });

  const status = normalizeStatus(j);
  const meta = STATUS_META[status];
  const busy = actions.busyId === j.id;
  const label = j.invoiceNumber || j.role;
  const day = (iso) => (isValidDate(iso) ? fmtDate(iso) : null);

  const title = client?.name || j.role;
  const subtitle = client ? `${j.role} · ${j.model}` : j.model;
  const travel = Number(j.travelExpense) || 0;

  // Invoice line (only for jobs that have an invoice number, like before).
  const overdue = !!j.invoiceNumber && status !== "completed" && isValidDate(j.dueDate) && new Date(j.dueDate) < new Date();
  let dueText = null;
  if (j.invoiceNumber) {
    const bits = [];
    if (status === "completed") {
      bits.push(day(j.paidAt) ? `Paid ${day(j.paidAt)}` : "Paid");
    } else {
      if (day(j.sentAt)) bits.push(`Sent ${day(j.sentAt)}`);
      if (day(j.dueDate)) bits.push(overdue ? `was due ${day(j.dueDate)}` : `due ${day(j.dueDate)}`);
    }
    if (bits.length) dueText = (bits.join(" · ")).replace(/^./, (c) => c.toUpperCase());
  }

  return (
    <Card as="article" className="jb-card" data-status={status} aria-busy={busy || undefined} aria-label={`${label}, ${meta.label}`}>
      <div className="jb-head">
        <p className="jb-ref">
          <span className="jb-num">{j.invoiceNumber || "Estimate"}</span>
          {day(j.date) && (
            <>
              <span aria-hidden="true">·</span>
              <time dateTime={isValidDate(j.date) ? new Date(j.date).toISOString() : undefined}>{day(j.date)}</time>
            </>
          )}
        </p>
        <div className="jb-pills">
          {overdue && <span className="jb-pill" data-tone="danger"><i aria-hidden="true" />Overdue</span>}
          <span className="jb-pill" data-tone={meta.tone}><i aria-hidden="true" />{meta.label}</span>
        </div>
      </div>

      <div className="jb-body">
        <div className="jb-info">
          <h3 className="jb-client">{title}</h3>
          <p className="jb-role">{subtitle}</p>
          {j.notes ? <p className="jb-notes">{j.notes}</p> : null}
        </div>
        <div className="jb-amount">
          <span className="jb-money">{fmtMoney(j.price)}</span>
          {travel > 0 && <span className="jb-travel">Travel {fmtMoney(travel)}</span>}
        </div>
      </div>

      {dueText && <p className={"jb-due" + (overdue ? " jb-due--late" : "")}>{dueText}</p>}

      <div className="jb-actions">
        <div className="jb-primary">
          <PBtn small color="var(--butter)" onClick={() => handleSendQuote(j)} aria-label={`Open the invoice for ${label} to edit and email it`}>
            <IconSend size={16} /> Invoice &amp; email
          </PBtn>
          <PBtn
            small
            color="var(--paper)"
            className="lq-btn--neutral"
            onClick={() => handleGatedPDF(j)}
            aria-label={pdfLocked ? `Download PDF for ${label} (daily limit reached, upgrade for more)` : `Download PDF for ${label}`}
          >
            <IconDownload size={16} /> PDF {pdfLocked && <IconLock size={14} />}
          </PBtn>
          {PAY_LINK_ENABLED && userTier === "agency" && status !== "completed" && (
            <PBtn
              small color="var(--mint)" disabled={pay.busy}
              aria-label={`Create an online payment link for ${label}`}
              onClick={async () => {
                setPay({ busy: true, msg: "", error: false });
                try {
                  const url = await createInvoicePayLink(j.id);
                  try { await navigator.clipboard.writeText(url); setPay({ busy: false, msg: "Pay link copied. Paste it into your email or message.", error: false }); }
                  catch { setPay({ busy: false, msg: url, error: false }); }
                } catch (e) { setPay({ busy: false, msg: e.message, error: true }); }
              }}
            >
              <IconSend size={16} /> {pay.busy ? "Creating link..." : "Pay link"}
            </PBtn>
          )}
        </div>

        <div className="jb-quiet">
          <button type="button" className="jb-link" onClick={() => handleEditJob(j)} aria-label={`Edit job ${label} in the calculator`}>
            <IconEdit size={16} /> Edit job
          </button>
          <button type="button" className="jb-link" onClick={() => actions.saveAsTemplate(j)} disabled={busy} aria-label={`Save ${label} as a template`}>
            <IconTemplates size={16} /> Save as template
          </button>
          {!j.clientId && (
            <button type="button" className="jb-link" onClick={() => actions.addAsClient(j)} disabled={busy} aria-label={`Add ${label} as a client`}>
              <IconClients size={16} /> Add as client
            </button>
          )}
          <button type="button" className="jb-link jb-link--danger" onClick={() => handleDeleteJob(j.id)} aria-label={`Delete ${label}`}>
            <IconDelete size={16} /> <span className="jb-link-text">Delete</span>
          </button>
        </div>
      </div>

      {pay.msg && <p className={"jb-pay-msg" + (pay.error ? " is-error" : "")} role={pay.error ? "alert" : "status"}>{pay.msg}</p>}

      <div className="jb-status" role="group" aria-label={`Payment status for ${label}`}>
        <span className="jb-status-label">Mark as</span>
        <div className="jb-status-btns">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              className="jb-status-btn"
              data-tone={STATUS_META[s].tone}
              aria-pressed={s === status}
              disabled={busy}
              onClick={() => { if (s !== status) actions.setStatus(j, s); }}
            >
              {STATUS_META[s].short}
            </button>
          ))}
        </div>
        {busy && <span className="jb-saving" role="status">Saving…</span>}
      </div>
    </Card>
  );
}
