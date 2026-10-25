import React, { useMemo } from "react";
import { PBtn, PInput } from "../../components/ui";
import { Field } from "../../components/kit";
import { IconCalc, IconCheck } from "../../icons";
import { calcBaseRate, RATE_FINDER_DEFAULTS } from "../../utils/baseRate";
import SettingsCard from "./SettingsCard";

const money = (n) => "$" + Math.round(n).toLocaleString("en-US");

/** Works out an hourly base rate from income goal, tax, costs and real billable hours. Free on every plan. */
export default function BaseRateFinder({ profile, update }) {
  const inputs = { ...RATE_FINDER_DEFAULTS, ...(profile.rateFinder || {}) };
  const res = useMemo(() => calcBaseRate(inputs), [inputs.goal, inputs.taxRate, inputs.expenses, inputs.hoursPerWeek, inputs.weeksOff]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (key) => (v) => update({ rateFinder: { ...inputs, [key]: v } });
  const applied = res.valid && Number(profile.defaultBaseRate) === res.rate;

  return (
    <SettingsCard
      id="ratefinder" iconTone="mint" icon={<IconCalc size={22} />}
      title="Find your base rate"
      description="Work backward from what you want to take home to an hourly rate that actually gets you there."
    >
      <div className="prof-grid2">
        <Field label="Yearly take-home goal ($)" htmlFor="rf-goal" hint="What you want to keep after tax.">
          <PInput id="rf-goal" type="number" inputMode="numeric" min={0} value={inputs.goal} onChange={set("goal")} />
        </Field>
        <Field label="Tax set-aside (%)" htmlFor="rf-tax" hint="Share of income you put aside for tax. Freelancers in the US often set aside 25 to 30%.">
          <PInput id="rf-tax" type="number" inputMode="numeric" min={0} value={inputs.taxRate} onChange={set("taxRate")} />
          <div className="rf-presets" role="group" aria-label="Quick tax set-aside">
            {[20, 25, 30, 35].map((n) => (
              <button key={n} type="button" className="rf-preset" aria-pressed={Number(inputs.taxRate) === n} onClick={() => set("taxRate")(n)}>{n}%</button>
            ))}
          </div>
        </Field>
        <Field label="Yearly business costs ($)" htmlFor="rf-exp" hint="Software, gear, insurance, workspace.">
          <PInput id="rf-exp" type="number" inputMode="numeric" min={0} value={inputs.expenses} onChange={set("expenses")} />
        </Field>
        <Field label="Billable hours per week" htmlFor="rf-hours" hint="Hours you bill, not hours you work. 15 to 25 is typical.">
          <PInput id="rf-hours" type="number" inputMode="numeric" min={0} value={inputs.hoursPerWeek} onChange={set("hoursPerWeek")} />
        </Field>
        <Field label="Weeks off per year" htmlFor="rf-off" hint="Holidays, sick days, slow weeks.">
          <PInput id="rf-off" type="number" inputMode="numeric" min={0} value={inputs.weeksOff} onChange={set("weeksOff")} />
        </Field>
      </div>

      <div className="rf-result" role="status" aria-live="polite">
        {res.valid ? (
          <>
            <div className="rf-rate"><span>Your base rate</span><b>{money(res.rate)}<small>/hr</small></b></div>
            <ul className="rf-break">
              <li><span>Income to bill</span><b>{money(res.gross)}</b></li>
              <li><span>Billable hours a year</span><b>{res.hours.toLocaleString("en-US")}</b></li>
              <li><span>Tax set aside</span><b>{money(res.taxSetAside)}</b></li>
              <li><span>US self-employment tax (est.)</span><b>{money(res.seTax)}</b></li>
              <li><span>Typical week</span><b>{money(res.perWeek)}</b></li>
            </ul>
            <p className="rf-note">Estimates only, not tax advice. Self-employment tax is part of your set-aside, not on top of it.</p>
            <PBtn color="var(--butter)" disabled={applied} onClick={() => update({ defaultBaseRate: res.rate, rateFinder: inputs })}>
              {applied ? <><IconCheck size={18} /> Set as your default rate</> : "Use as my default rate"}
            </PBtn>
          </>
        ) : (
          <p className="rf-empty">{res.reason}</p>
        )}
      </div>
    </SettingsCard>
  );
}
