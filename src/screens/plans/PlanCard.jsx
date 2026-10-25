import React from "react";
import { Card, Pill } from "../../components/kit";
import { PBtn } from "../../components/ui";
import { TIERS, PROMO } from "../../utils/subscription";
import { IconTierFree, IconTierPro, IconTierAgency, IconCheck } from "../../icons";
import { PLAN_NAMES, listPrice, promoPrice, planBullets } from "./planData";
import "./plans.css";

const TONE = { free: "blue", pro: "butter", agency: "lilac" };
const BTN = { free: "var(--paper)", pro: "var(--butter)", agency: "var(--lilac)" };
const ICON = { free: IconTierFree, pro: IconTierPro, agency: IconTierAgency };
const BLURB = {
  free: "Everything you need to price your work and keep a tidy log.",
  pro: "More room for a growing client list and busier invoice days.",
  agency: "The full toolkit for studios: analytics, sync and your own branding.",
};

/** One plan: header, price (with the live promo), highlight list and a call to action. */
export default function PlanCard({ tierKey, cycle, currentTier, onSelectPlan, index = 0 }) {
  const Icon = ICON[tierKey];
  const name = PLAN_NAMES[tierKey];
  const isCurrent = currentTier === tierKey;
  const isPaid = tierKey !== "free";
  const popular = tierKey === "pro";
  const per = cycle === "year" ? "yr" : "mo";
  const titleId = `plan-${tierKey}-title`;

  return (
    <Card
      as="article"
      tone={TONE[tierKey]}
      pad="lg"
      className={`plan plan--${tierKey}${isCurrent ? " is-current" : ""}${popular ? " is-popular" : ""}`}
      style={{ "--i": index }}
      aria-labelledby={titleId}
    >
      <div className="plan-top">
        <span className="plan-icon"><Icon size={24} /></span>
        <h3 id={titleId} className="plan-name">{name}</h3>
      </div>
      <div className="plan-badges">
        {isCurrent && <Pill tone="mint"><IconCheck size={13} /> Current plan</Pill>}
        {popular && <Pill tone="ink">Most popular</Pill>}
      </div>
      <p className="plan-blurb">{BLURB[tierKey]}</p>

      <div className="plan-price">
        {isPaid ? (
          <>
            <div className="plan-promo">
              <Pill tone="mint">
                {cycle === "year" ? `${PROMO.annualPercentOff}% off year one` : `First month $${PROMO.firstMonthPrice}`}
              </Pill>
            </div>
            <p className="plan-was">
              <span className="plan-sr">Regular price </span>
              <s>${listPrice(tierKey, cycle)}/{per}</s>
            </p>
            <p className="plan-now">
              <span className="plan-amount">${promoPrice(tierKey, cycle)}</span>
            </p>
            <p className="plan-then">
              {cycle === "year"
                ? "First year, renews at full price"
                : `First month, then $${TIERS[tierKey].prices.monthly}/mo`}
            </p>
          </>
        ) : (
          <>
            <div className="plan-promo">
              <Pill tone="ink">Free forever</Pill>
            </div>
            <p className="plan-was" aria-hidden="true">&nbsp;</p>
            <p className="plan-now">
              <span className="plan-amount">$0</span>
            </p>
            <p className="plan-then">Upgrade whenever you outgrow it</p>
          </>
        )}
      </div>

      <ul className="plan-list">
        {planBullets(tierKey).map((b) => (
          <li key={b}>
            <IconCheck size={18} />
            <span>{b}</span>
          </li>
        ))}
      </ul>

      <div className="plan-cta">
        {isCurrent ? (
          <PBtn full color={BTN[tierKey]} className={tierKey === "free" ? "lq-btn--neutral" : ""} disabled>
            Your current plan
          </PBtn>
        ) : tierKey === "free" ? (
          <PBtn full color={BTN.free} className="lq-btn--neutral" onClick={() => onSelectPlan("free")}>
            Downgrade to Free
          </PBtn>
        ) : (
          <PBtn full color={BTN[tierKey]} onClick={() => onSelectPlan(tierKey, cycle === "year" ? "year" : "month")}>
            {currentTier === "free" ? `Upgrade to ${name}` : `Switch to ${name}`}
          </PBtn>
        )}
      </div>
    </Card>
  );
}
