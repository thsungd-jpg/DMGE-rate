import React, { useMemo, useState } from "react";
import { Card, EmptyState, Screen, Segmented, Stat } from "../components/kit";
import { PBtn } from "../components/ui";
import { IconDownload, IconJobs, IconLock, IconPlus, IconSend } from "../icons";
import { canExportCSV, canExportPDF, TIERS } from "../utils/subscription";
import JobCard from "./history/JobCard";
import BulkSend from "./history/BulkSend";
import { BATCH_MAX } from "./history/bulkInvoices";
import useJobActions from "./history/useJobActions";
import { fmtMoney, normalizeStatus, STATUS_META } from "./history/statusModel";
import "./history.css";

// Screen for tab "history" (Jobs): summary, status filter and the list of saved quotes / invoices.
// Everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function HistoryScreen({ ctx }) {
  const {
    clients,
    handleGatedCSV,
    historyJobs,
    jobStatusFilter,
    jobs,
    setJobStatusFilter,
    setShowUpgradeModal,
    setTab,
    setUpgradeFeature,
    todayPdfCount,
    totalBilled,
    userTier,
  } = ctx;

  const actions = useJobActions(ctx);

  // "Send several": tick the jobs whose invoices should go out, review, send (see history/BulkSend.jsx). Paid jobs have nothing left to send.
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState(() => new Set());
  const [reviewing, setReviewing] = useState(false);
  const togglePick = (id) => setPicked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const stopSelecting = () => { setSelecting(false); setPicked(new Set()); setReviewing(false); };

  const clientById = useMemo(() => {
    const m = new Map();
    (clients || []).forEach((c) => m.set(String(c.id), c));
    return m;
  }, [clients]);

  // Newest first, with the status normalised once so counts, filter and cards agree.
  const rows = useMemo(
    () => [...historyJobs]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map((j) => ({ j, status: normalizeStatus(j) })),
    [historyJobs]
  );

  const counts = useMemo(() => {
    const c = { all: rows.length, pending: 0, in_progress: 0, completed: 0 };
    rows.forEach((r) => { c[r.status] += 1; });
    return c;
  }, [rows]);

  const filter = ["all", "pending", "in_progress", "completed"].includes(jobStatusFilter) ? jobStatusFilter : "all";
  const visible = filter === "all" ? rows : rows.filter((r) => r.status === filter);

  const paid = rows.reduce((s, r) => (r.status === "completed" ? s + (Number(r.j.price) || 0) : s), 0);
  const avg = rows.length ? Math.round(totalBilled / rows.length) : 0;

  const windowDays = TIERS[userTier]?.limits.historyDays;
  const windowLabel = Number.isFinite(windowDays) ? `Last ${windowDays} days` : "All time";
  const hiddenCount = Math.max(0, (jobs?.length || 0) - historyJobs.length);

  const csvLocked = !canExportCSV(userTier);
  const pdfLimit = TIERS[userTier]?.limits.pdfsPerDay;
  const pdfLocked = !canExportPDF(userTier, todayPdfCount || 0);

  const openUpgrade = (feature) => { setUpgradeFeature(feature); setShowUpgradeModal(true); };

  const filterOptions = [
    { value: "all", label: "All", count: counts.all },
    { value: "pending", label: STATUS_META.pending.label, count: counts.pending },
    { value: "in_progress", label: STATUS_META.in_progress.label, count: counts.in_progress },
    { value: "completed", label: STATUS_META.completed.label, count: counts.completed },
  ];

  const hasJobs = (jobs?.length || 0) > 0;

  const headerActions = hasJobs ? (
    <>
      <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={() => (selecting ? stopSelecting() : setSelecting(true))} aria-pressed={selecting}>
        <IconSend size={16} /> {selecting ? "Done choosing" : "Send several"}
      </PBtn>
      <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={handleGatedCSV} aria-label={csvLocked ? "Export CSV (upgrade to unlock)" : "Export CSV"}>
        <IconDownload size={16} /> Export CSV {csvLocked && <IconLock size={14} />}
      </PBtn>
      <PBtn small color="var(--butter)" onClick={() => setTab("calc")}>
        <IconPlus size={16} /> New quote
      </PBtn>
    </>
  ) : null;

  return (
    <Screen
      className="jb-screen"
      eyebrow="Quotes & invoices"
      title={<>Your <em>jobs</em></>}
      subtitle="Every quote you have saved, with its invoice and payment status. Open one to edit the invoice and email it."
      actions={headerActions}
    >
      {!hasJobs && (
        <Card pad="lg">
          <EmptyState
            icon={<IconJobs size={28} />}
            title="No jobs yet"
            body="Price a job in the calculator and save it. It will show up here with its invoice, PDF and payment status."
            action={<PBtn color="var(--butter)" onClick={() => setTab("calc")}><IconPlus size={16} /> Price your first job</PBtn>}
          />
        </Card>
      )}

      {hasJobs && historyJobs.length === 0 && (
        <Card pad="lg">
          <EmptyState
            icon={<IconJobs size={28} />}
            title={`Nothing in the ${windowLabel.toLowerCase()}`}
            body="Your older jobs are safe, but your plan only shows recent ones."
            action={userTier !== "agency" ? <PBtn color="var(--butter)" onClick={() => openUpgrade("history")}>See plans</PBtn> : null}
          />
        </Card>
      )}

      {historyJobs.length > 0 && (
        <>
          <Card className="jb-stats" pad="lg">
            <Stat label="Total billed" value={fmtMoney(totalBilled)} hint={paid > 0 ? `${fmtMoney(paid)} paid · ${fmtMoney(Math.max(0, totalBilled - paid))} to collect` : `${fmtMoney(totalBilled)} to collect`} />
            <Stat label="Average job" value={fmtMoney(avg)} hint="Per quote" />
            <Stat label="Jobs" value={String(rows.length)} hint={windowLabel} />
          </Card>

          <div className="jb-bar">
            <Segmented ariaLabel="Filter jobs by status" options={filterOptions} value={filter} onChange={setJobStatusFilter} />
            {Number.isFinite(pdfLimit) && (
              <p className="jb-quota">PDFs today <b>{Math.min(todayPdfCount || 0, pdfLimit)}</b> of {pdfLimit}</p>
            )}
          </div>

          {selecting && (
            <div className="jb-selbar" role="region" aria-label="Choose the invoices to send">
              <span className="jb-selcount" role="status">{picked.size} selected{picked.size > BATCH_MAX ? ` (${BATCH_MAX} go at a time)` : ""}</span>
              <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={() => setPicked(new Set(visible.filter((r) => r.status !== "completed").map((r) => r.j.id)))}>Select all unpaid</PBtn>
              <PBtn small color="var(--butter)" disabled={picked.size === 0} onClick={() => setReviewing(true)}><IconSend size={16} /> Review &amp; send</PBtn>
              <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={stopSelecting}>Cancel</PBtn>
            </div>
          )}

          <p className="jb-sr" role="status">{visible.length} {visible.length === 1 ? "job" : "jobs"} shown</p>

          {visible.length > 0 ? (
            <ul className="jb-list">
              {visible.map(({ j, status }, i) => (
                <li key={j.id} style={{ "--i": Math.min(i, 8) }}>
                  <JobCard
                    job={j}
                    client={j.clientId ? clientById.get(String(j.clientId)) : null}
                    ctx={ctx}
                    actions={actions}
                    pdfLocked={pdfLocked}
                    pick={selecting && status !== "completed" ? { checked: picked.has(j.id), onChange: () => togglePick(j.id) } : null}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <Card pad="lg">
              <EmptyState
                icon={<IconJobs size={28} />}
                title={`No ${STATUS_META[filter]?.label.toLowerCase() || ""} jobs`}
                body="Nothing matches this filter right now."
                action={<PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => setJobStatusFilter("all")}>Show all jobs</PBtn>}
              />
            </Card>
          )}
        </>
      )}

      {hasJobs && hiddenCount > 0 && (
        <p className="jb-note">
          {hiddenCount} older {hiddenCount === 1 ? "job is" : "jobs are"} not shown. Your plan keeps the {windowLabel.toLowerCase()} in view.
          {userTier !== "agency" && (
            <> <button type="button" className="auth-link" onClick={() => openUpgrade("history")}>See plans</button></>
          )}
        </p>
      )}
      {reviewing && <BulkSend jobs={rows.filter((r) => picked.has(r.j.id)).map((r) => r.j)} ctx={ctx} onClose={stopSelecting} />}
    </Screen>
  );
}
