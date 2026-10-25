import React, { useState } from "react";
import { Screen, Card, Segmented, Pill, SectionTitle } from "./kit";
import { PBtn } from "./ui";
import { PROMO } from "../utils/subscription";
import { IconArrowLeft } from "../icons";
import PlanCard from "../screens/plans/PlanCard";
import FeatureTable from "../screens/plans/FeatureTable";
import { PLAN_ORDER, PLAN_NAMES, normTier } from "../screens/plans/planData";
import "../screens/plans/plans.css";

const CYCLES = [
  { value: "month", label: "Monthly" },
  { value: "year", label: "Annual" },
];

// Pricing / plans. Billing logic is untouched: the same onSelectPlan(tier, interval) handler as before.
export default function PricingPage({ currentTier, onSelectPlan, onBack }) {
  const [cycle, setCycle] = useState("month"); // 'month' | 'year'
  const tier = normTier(currentTier);

  return (
    <Screen
      eyebrow="Plans"
      title={<>Pick the plan that <em>fits your work</em></>}
      subtitle="Start free and upgrade when your client list or invoice days outgrow it. Change or cancel any time."
      actions={
        <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={onBack}>
          <IconArrowLeft size={16} /> Back to calculator
        </PBtn>
      }
    >
      {tier !== "free" && (
        <Card tone="glass" pad="md" className="plans-manage">
          <div className="plans-manage-text">
            <h2>You are on <em>{PLAN_NAMES[tier]}</em></h2>
            <p>Downgrade, change plan or cancel in the Stripe billing portal.</p>
          </div>
          <PBtn color="var(--butter)" onClick={() => onSelectPlan("portal")}>Manage subscription</PBtn>
        </Card>
      )}

      <div className="plans-toolbar">
        <Segmented options={CYCLES} value={cycle} onChange={setCycle} ariaLabel="Billing period" />
        {cycle === "year" ? (
          <Pill tone="mint">{PROMO.annualPercentOff}% off your first year</Pill>
        ) : (
          <Pill tone="mint">First month ${PROMO.firstMonthPrice}</Pill>
        )}
      </div>

      <div className="plans-grid">
        {PLAN_ORDER.map((k, i) => (
          <PlanCard key={k} tierKey={k} cycle={cycle} currentTier={tier} onSelectPlan={onSelectPlan} index={i} />
        ))}
      </div>

      <SectionTitle>Compare <em>every</em> feature</SectionTitle>
      <FeatureTable currentTier={tier} />
      <p className="plans-fine">Prices are in US dollars and billed through Stripe. Promo prices are applied automatically at checkout.</p>
    </Screen>
  );
}
