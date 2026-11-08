import React, { useCallback, useState } from "react";
import { Card, EmptyState, Field, Screen } from "../components/kit";
import { PBtn, PInput } from "../components/ui";
import { IconArrowLeft, IconCheck, IconCross, IconJobs, IconPending, IconSend } from "../icons";
import DMGEInvoiceEditor from "../components/DMGEInvoiceEditor";
import { fmtMoney2 } from "./history/statusModel";
import "./invoice-editor.css";

const looksLikeEmail = (s) => /^\S+@\S+\.\S+$/.test(String(s || "").trim());

// Screen for tab "invoice_editor": the editable invoice sheet plus the "email it" panel.
// Everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function InvoiceEditorScreen({ ctx }) {
  const {
    clients,
    emailForm,
    emailStatus,
    isSendingEmail,
    profile,
    selectedJobForEmail,
    sendEmail,
    setEmailForm,
    setEmailStatus,
    setInvoiceEditorData,
    setTab,
  } = ctx;

  const [liveTotal, setLiveTotal] = useState(null);
  const [toTouched, setToTouched] = useState(false);

  // Stable identity: the sheet re-reports on every change and re-runs its effect if this changes.
  const handleUpdate = useCallback((data) => {
    setInvoiceEditorData(data);
    setLiveTotal(data.totalDue);
  }, [setInvoiceEditorData]);

  const goBack = () => { setTab("history"); setEmailStatus({ type: null, message: "" }); };

  const job = selectedJobForEmail;
  const client = job ? (clients || []).find((c) => c.id === job.clientId) : null;
  const to = emailForm.to || "";
  const canSend = !!emailForm.to && !!emailForm.subject && !isSendingEmail;
  const toInvalid = toTouched && !!to.trim() && !looksLikeEmail(to);
  const attachmentName = job ? `${job.invoiceNumber || "INV"}_${String(job.role || "").replace(/\s+/g, "_")}.pdf` : "";

  const backBtn = (
    <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={goBack}>
      <IconArrowLeft size={16} /> Back to jobs
    </PBtn>
  );

  if (!job) {
    return (
      <Screen
        className="iv-screen"
        eyebrow="Invoice"
        title={<>Invoice <em>editor</em></>}
        actions={backBtn}
      >
        <Card pad="lg" className="iv-nojob">
          <EmptyState
            icon={<IconJobs size={28} />}
            title="No invoice open"
            body="Pick a job on the Jobs tab and choose Invoice & email to edit its invoice here."
            action={<PBtn color="var(--butter)" onClick={goBack}>Go to jobs</PBtn>}
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      wide
      className="iv-screen"
      eyebrow="Invoice"
      title={<>Invoice <em>editor</em></>}
      subtitle="Change anything on the sheet, then email it as a PDF. What you see here is what your client gets."
      actions={backBtn}
    >
      <div className="iv-layout">
        <Card as="section" className="iv-send" pad="md" aria-labelledby="iv-send-title" aria-busy={isSendingEmail || undefined}>
          <div>
            <h2 className="iv-send-title" id="iv-send-title">Email <em>invoice</em></h2>
            <p className="iv-send-sub">Sent as a PDF attachment{client?.name ? ` to ${client.name}` : ""}.</p>
          </div>

          <Field label="Recipient email" htmlFor="iv-to" error={toInvalid ? "That does not look like a full email address." : undefined}>
            <PInput
              id="iv-to"
              type="email"
              autoComplete="email"
              value={emailForm.to}
              onChange={(v) => setEmailForm((f) => ({ ...f, to: v }))}
              onBlur={() => setToTouched(true)}
              placeholder="client@example.com"
              disabled={isSendingEmail}
              aria-invalid={toInvalid || undefined}
            />
          </Field>
          {client?.email && !emailForm.to && (
            <button type="button" className="iv-quickfill" onClick={() => setEmailForm((f) => ({ ...f, to: client.email }))} disabled={isSendingEmail}>
              Use {client.email}
            </button>
          )}

          <Field label="Subject" htmlFor="iv-subject">
            <PInput
              id="iv-subject"
              value={emailForm.subject}
              onChange={(v) => setEmailForm((f) => ({ ...f, subject: v }))}
              placeholder="Invoice for your project"
              disabled={isSendingEmail}
            />
          </Field>

          <dl className="iv-summary">
            <div><dt>Attachment</dt><dd className="iv-summary-file">{attachmentName}</dd></div>
            {liveTotal != null && <div><dt>Total due</dt><dd className="iv-summary-total">{fmtMoney2(liveTotal)}</dd></div>}
          </dl>

          {isSendingEmail ? (
            <div className="iv-banner iv-banner--info" role="status">
              <span className="iv-spinner" aria-hidden="true" />
              <span>Building the PDF and sending it. This can take a few seconds.</span>
            </div>
          ) : emailStatus.type ? (
            <div className={`iv-banner iv-banner--${emailStatus.type}`} role={emailStatus.type === "error" ? "alert" : "status"}>
              {emailStatus.type === "error" ? <IconCross size={18} /> : emailStatus.type === "success" ? <IconCheck size={18} /> : <IconPending size={18} />}
              <span>{emailStatus.message}</span>
            </div>
          ) : null}

          <PBtn color="var(--butter)" className="iv-send-btn" onClick={sendEmail} disabled={!canSend}>
            {isSendingEmail
              ? <><span className="iv-spinner" aria-hidden="true" /> Sending…</>
              : <><IconSend size={18} /> Send invoice</>}
          </PBtn>
        </Card>

        <div className="iv-sheet-wrap">
          <DMGEInvoiceEditor job={job} profile={ctx.brandProfile || profile} whiteLabel={!!ctx.whiteLabel} clients={clients} onUpdate={handleUpdate} />
        </div>
      </div>
    </Screen>
  );
}
