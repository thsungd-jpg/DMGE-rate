import React from "react";
import { PBtn } from "../components/ui";
import { Screen, Card, EmptyState } from "../components/kit";
import { IconCheck, IconLock, IconPlus } from "../icons";
import { TIERS, canViewAnalytics } from "../utils/subscription";
import AnalyticsDashboard from "../components/AnalyticsDashboard";
import "./insights.css";

// Screen for tab "analytics" (shown to users as "Insights").
// Everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function AnalyticsScreen({ ctx }) {
  const {
    setShowUpgradeModal,
    setTab,
    setUpgradeFeature,
    userTier,
    windowedJobs,
  } = ctx;

  const title = <>Your <em>insights</em></>;
  const unlocked = canViewAnalytics(userTier);
  const windowDays = TIERS[userTier]?.limits.historyDays;

  if (!unlocked) {
    return (
      <Screen eyebrow="Analytics" title={title} subtitle="Totals, trends and payment status for the work you quote.">
        <Card pad="sm" className="ins-lock">
          <EmptyState
            icon={<IconLock size={28} />}
            title="Insights is part of Agency"
            body="Upgrade to see how much you have billed, what is still unpaid, and which kinds of work earn the most."
            action={
              <>
                <ul className="ins-lock-perks">
                  {["Total billed and average job", "Paid vs outstanding", "Revenue and category charts"].map((perk) => (
                    <li key={perk}><span aria-hidden="true"><IconCheck size={16} /></span>{perk}</li>
                  ))}
                </ul>
                <div className="ins-lock-actions">
                  <PBtn color="var(--butter)" onClick={() => { setUpgradeFeature("analytics"); setShowUpgradeModal(true); }}>
                    <IconLock size={18} /> Unlock Insights
                  </PBtn>
                  <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => setTab("pricing")}>Compare plans</PBtn>
                </div>
              </>
            }
          />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      eyebrow="Analytics"
      title={title}
      subtitle="Totals, trends and payment status for the work you quote."
      actions={windowedJobs.length > 0 && <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={() => setTab("calc")}><IconPlus size={16} /> New quote</PBtn>}
    >
      <AnalyticsDashboard jobs={windowedJobs} windowDays={windowDays} onNewQuote={() => setTab("calc")} />
    </Screen>
  );
}
