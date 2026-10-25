import React from "react";
import { PBtn, PModal } from "./ui";
import { Card, Pill } from "./kit";
import { TIERS, PROMO } from "../utils/subscription";
import { IconTierFree, IconTierPro, IconTierAgency, IconLock, IconCheck } from "../icons";
import { PLAN_NAMES, planBullets, normTier } from "../screens/plans/planData";
import "../screens/plans/plans.css";

const ICON = { free: IconTierFree, pro: IconTierPro, agency: IconTierAgency };
const BTN = { pro: "var(--butter)", agency: "var(--lilac)" };

// Does moving to `target` lift the limit the user just ran into?
function unlocks(feature, current, target) {
  const a = TIERS[current].limits;
  const b = TIERS[target].limits;
  switch (feature) {
    case "clients": return b.clients > a.clients;
    case "templates": return b.templates > a.templates;
    case "pdf": return b.pdfsPerDay > a.pdfsPerDay;
    case "analytics": return b.analytics && !a.analytics;
    case "csv": return b.csvExport && !a.csvExport;
    case "whiteLabel": return b.whiteLabel && !a.whiteLabel;
    case "history": return b.historyDays > a.historyDays;
    default: return false;
  }
}

// The perk worth highlighting inside each plan's list for the locked feature.
const HIT = {
  clients: /clients/i,
  templates: /templates/i,
  pdf: /invoices a day|PDF invoices/i,
  analytics: /analytics/i,
  csv: /CSV/i,
  whiteLabel: /white-label/i,
};

export default function UpgradeModal({ isOpen, onClose, feature, currentTier, onUpgrade, onSeePlans }) {
  if (!isOpen) return null;

  const tier = normTier(currentTier);
  const tierInfo = TIERS[tier];
  const limits = tierInfo.limits;
  const CurrentIcon = ICON[tier];
  const targets = tier === "free" ? ["pro", "agency"] : tier === "pro" ? ["agency"] : [];
  const next = targets[targets.length - 1];

  const messages = {
    clients: { title: "Client limit reached", desc: `Your ${tierInfo.name} plan holds ${limits.clients} clients.${next ? ` Upgrade to ${PLAN_NAMES[targets[0]]} for ${TIERS[targets[0]].limits.clients}${targets.length > 1 ? ` or Agency for ${TIERS.agency.limits.clients}` : ""}.` : ""}` },
    templates: { title: "Template limit reached", desc: `Your ${tierInfo.name} plan holds ${limits.templates} templates.${next ? ` Upgrade to ${PLAN_NAMES[targets[0]]} for ${TIERS[targets[0]].limits.templates}${targets.length > 1 ? ` or Agency for ${TIERS.agency.limits.templates}` : ""}.` : ""}` },
    analytics: { title: "Analytics is locked", desc: "The analytics dashboard is an Agency feature. Upgrade to unlock it." },
    csv: { title: "CSV export is locked", desc: "CSV export is an Agency feature. Upgrade to export your data." },
    pdf: { title: "PDF limit reached", desc: `Your ${tierInfo.name} plan allows ${limits.pdfsPerDay} PDF invoices a day. Upgrade to the next plan for more.` },
    whiteLabel: { title: "White-label is locked", desc: "Custom branding is an Agency feature. Upgrade to unlock it." },
    history: { title: "History is limited", desc: `Your ${tierInfo.name} plan shows the last ${limits.historyDays} days of jobs.` },
  };
  const msg = messages[feature] || { title: "Upgrade required", desc: "This feature needs a higher plan." };

  return (
    <PModal isOpen={isOpen} onClose={onClose} title={msg.title}>
      <div className="upg">
        <div className="upg-lede">
          <span className="upg-lock" aria-hidden="true"><IconLock size={24} /></span>
          <p className="upg-desc">{msg.desc}</p>
        </div>

        <div className="upg-meta">
          <span>You are on</span>
          <Pill tone="ink"><CurrentIcon size={14} /> {tierInfo.name}</Pill>
        </div>

        {targets.length > 0 && (
          <div className="upg-grid">
            {targets.map((k) => {
              const Icon = ICON[k];
              const hit = unlocks(feature, tier, k);
              return (
                <Card key={k} tone={k === "pro" ? "butter" : "lilac"} pad="md" className={`upg-card upg-card--${k}${hit ? " is-hit" : ""}`}>
                  <div className="upg-card-top">
                    <h3 className="upg-name"><Icon size={22} /> {PLAN_NAMES[k]}</h3>
                    {hit && <Pill tone="mint"><IconCheck size={13} /> Unlocks this</Pill>}
                  </div>
                  <p className="upg-price">
                    <b>${TIERS[k].prices.monthly}</b>/month, first month ${PROMO.firstMonthPrice}
                  </p>
                  <ul className="plan-list">
                    {planBullets(k).map((b) => (
                      <li key={b} className={hit && HIT[feature]?.test(b) ? "is-hit" : undefined}>
                        <IconCheck size={18} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <PBtn full color={BTN[k]} onClick={() => onUpgrade(k)}>Upgrade to {PLAN_NAMES[k]}</PBtn>
                </Card>
              );
            })}
          </div>
        )}

        <div className="upg-actions">
          {onSeePlans ? <button type="button" className="upg-link" onClick={onSeePlans}>Compare all plans</button> : <span />}
          <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={onClose}>
            {targets.length > 0 ? "Maybe later" : "Got it"}
          </PBtn>
        </div>
      </div>
    </PModal>
  );
}
