import React from "react";
import { PBtn } from "../../components/ui";
import { Pill } from "../../components/kit";
import { IconStar, IconTierAgency, IconTierFree, IconTierPro } from "../../icons";
import { TIERS, getUsageStats } from "../../utils/subscription";
import SettingsCard from "./SettingsCard";

const TIER_LOOK = {
  free: { tone: "ink", icon: IconTierFree },
  pro: { tone: "butter", icon: IconTierPro },
  agency: { tone: "lilac", icon: IconTierAgency },
};

function Usage({ label, used, max, atLimit }) {
  const measurable = typeof max === "number";
  return (
    <div className="prof-usage" data-limit={atLimit ? "" : undefined}>
      <span className="prof-usage-label">{label}</span>
      <b className="prof-usage-value">{used}<span> / {max}</span></b>
      {measurable && (
        <div className="prof-meter" role="progressbar" aria-label={`${label} used`} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(used, max)}>
          <i style={{ width: `${Math.min(100, Math.round((used / max) * 100))}%` }} />
        </div>
      )}
      {atLimit && <span className="prof-usage-flag">Limit reached</span>}
    </div>
  );
}

export default function PlanCard({ userTier, clients, templates, todayPdfCount, handlePlanSelect, setTab }) {
  const look = TIER_LOOK[userTier] || TIER_LOOK.free;
  const TierIcon = look.icon;
  const stats = getUsageStats(userTier, clients.length, templates.length, todayPdfCount);

  return (
    <SettingsCard
      id="plan" iconTone="mint" icon={<IconStar size={22} />}
      title="Your plan"
      description="What is included today and how much of it you have used."
      aside={<Pill tone={look.tone}><TierIcon size={14} />{TIERS[userTier]?.badge || "FREE"}</Pill>}
    >
      <div className="prof-usage-grid">
        <Usage label="Clients" {...stats.clients} />
        <Usage label="Templates" {...stats.templates} />
        <Usage label="PDFs today" {...stats.pdfsToday} />
        <div className="prof-usage">
          <span className="prof-usage-label">History</span>
          <b className="prof-usage-value">{stats.historyDays}<span> days</span></b>
        </div>
      </div>

      {userTier !== "free" ? (
        <div className="prof-row">
          <p className="prof-row-text"><strong>Billing and cancellation</strong>Opens the Stripe portal, where you can change your plan or cancel.</p>
          <PBtn color="var(--pink)" onClick={() => handlePlanSelect("portal")}>Manage or cancel</PBtn>
        </div>
      ) : (
        <div className="prof-row">
          <p className="prof-row-text"><strong>Want more room?</strong>Paid plans raise your limits, and Agency adds insights, sync and white-label branding.</p>
          <PBtn color="var(--butter)" onClick={() => setTab("pricing")}><IconStar size={18} /> Upgrade your plan</PBtn>
        </div>
      )}
    </SettingsCard>
  );
}
