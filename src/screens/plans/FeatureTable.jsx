import React from "react";
import { Card } from "../../components/kit";
import { TIERS } from "../../utils/subscription";
import { IconTierFree, IconTierPro, IconTierAgency, IconCheck, IconCross } from "../../icons";
import { PLAN_ORDER, PLAN_NAMES, FEATURE_ROWS } from "./planData";
import "./plans.css";

const ICON = { free: IconTierFree, pro: IconTierPro, agency: IconTierAgency };

function Cell({ value }) {
  if (value === true) {
    return (
      <span className="cmp-yes">
        <IconCheck size={20} />
        <span className="cmp-txt">Included</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="cmp-no">
        <IconCross size={16} />
        <span className="cmp-txt">Not included</span>
      </span>
    );
  }
  return <span className="cmp-val">{value}</span>;
}

/** Feature-by-plan comparison. Yes/no cells carry an icon AND text, so meaning never rides on colour alone. */
export default function FeatureTable({ currentTier }) {
  return (
    <Card pad="none" className="cmp-card">
      <table className="cmp">
        <caption className="plan-sr">Feature comparison across the Free, Pro and Agency plans</caption>
        <thead>
          <tr>
            <th scope="col" className="cmp-corner"><span className="plan-sr">Feature</span></th>
            {PLAN_ORDER.map((k) => {
              const Icon = ICON[k];
              return (
                <th key={k} scope="col" data-plan={k} data-current={currentTier === k ? "" : undefined}>
                  <span className="cmp-head">
                    <Icon size={18} />
                    <span>{PLAN_NAMES[k]}</span>
                  </span>
                  {currentTier === k && <span className="cmp-you">Your plan</span>}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {FEATURE_ROWS.map((row) => (
            <tr key={row.key}>
              <th scope="row">{row.label}</th>
              {PLAN_ORDER.map((k) => (
                <td key={k} data-plan={k} data-current={currentTier === k ? "" : undefined}>
                  <Cell value={row.value(TIERS[k])} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
