import React, { useState } from "react";
import { Chip, Desc, Go, Group, Money, Row, Stepper, useDescribe } from "../../world/controls";
import { EXPERIENCE, RATE_NAME, RATE_WAY } from "./describe";
import { anchorFor } from "../../data/wageAnchors";
import { calcBaseRate, RATE_FINDER_DEFAULTS } from "../../utils/baseRate";
import { EXPERIENCE_DEFAULT, experienceMods, finderInputs, freelanceEquivalent, goalHourly, hourlyEquivalent, modelKind, RATE_MODES, ratesByMode, unitNoun } from "../../utils/rateModels";
import { money, rateText } from "./common";

const MODE_TONE = { typical: "butter", goal: "mint", mine: "lilac" };
const unitShort = (model) => String(model.unit || "").replace("per hour", "per hr");

// Step 3: what should you charge? Your base rate for one unit of this job, reached one of three ways, with a sourced reality check where one honestly applies.
export default function RateStation({ ctx, patch, goTo }) {
  const { category, currentUser, form, model, ownRate, profile, rate, role, saveProfile, setOwnRate, setPrice, setProfile, setTab, userTier } = ctx;
  const noun = unitNoun(model), unit = unitShort(model);
  const [dw, peekW] = useDescribe(), [dx, peekX] = useDescribe();

  // a share of a deal: the rate is your cut of the amount, set on the Job step
  if (modelKind(model) === "percent" && form.deal) {
    const d = form.deal;
    return (
      <>
        <div className="qw-in qw-note qw-rate" aria-live="polite">
          <span className="qw-paper-lab">Your fee</span>
          <b className="qw-rate-num">{rate.rate > 0 ? money(rate.rate) : "$0"}</b>
          <span className="qw-paper-small">{rate.rate > 0 ? <><b>{Number(d.pct ?? model.base)}%</b> of <b>{money(d.amount)}</b>, one flat fee.</> : "Add the deal amount to see your fee."}</span>
        </div>
        <p className="qw-small qw-in">Your cut and the amount are set on the Job step. {" "}
          <button type="button" className="qw-link" onClick={() => goTo("job")}>Change them</button>
        </p>
      </>
    );
  }

  const by = ratesByMode({ model, form, profile, own: ownRate });
  const hourly = goalHourly(profile);
  const hourlyEq = rate.wanted ? null : hourlyEquivalent(rate.rate, model, form);
  const perHour = /^per hour$/i.test(model.unit);   // an hour is an hour: nothing to ask
  const fast = rate.hours > 0 && rate.hours < 0.25; // a unit that takes minutes (a word, an image): ask how many you get through in an hour instead
  const anchor = anchorFor(category, role.name);

  const sub = (m) => {
    const r = by[m];
    if (r.wanted === "goal") return "Set a goal first";
    if (r.wanted === "hours") return "Add the hours";
    if (r.wanted === "mine") return "Type your number";
    return `${rateText(r.rate)} ${unit}`;
  };
  const choose = (m) => {
    if (m === "mine" && rate.mode !== "mine" && rate.rate > 0) setOwnRate(rate.rate);   // start from the number you were just looking at
    patch({ rateMode: m });
  };
  const useGoal = (inputs, hourlyRate) => {
    const p = { ...profile, defaultBaseRate: hourlyRate, rateFinder: inputs };
    setProfile(p); saveProfile(p, userTier, currentUser); setPrice(null);
  };
  const need = {
    goal: "Set a goal rate below to use this way. Until then the typical start stands in.",
    hours: `Tell us how many hours one ${noun.one} takes to use your goal rate. Until then the typical start stands in.`,
    mine: "Type the rate you use.",
  }[rate.wanted];

  return (
    <>
      <div className="qw-in">
        <Group label="Start from">
          <Row>{Object.entries(RATE_MODES).map(([m, info]) => <Chip key={m} tone={MODE_TONE[m]} on={rate.mode === m} sub={sub(m)} onClick={() => choose(m)} {...peekW({ name: RATE_NAME[m], text: RATE_WAY[m] })}>{info.label}</Chip>)}</Row>
          <Desc d={dw} selected={{ name: RATE_NAME[rate.mode], text: RATE_WAY[rate.mode] }} tone={MODE_TONE[rate.mode]} />
        </Group>
      </div>

      {rate.mode === "typical" && (
        <div className="qw-in">
          <Group label="Where are you in your career?" hint="A typical rate assumes a few years of paid work.">
            <Row>{Object.entries(experienceMods).map(([k, v]) => <Chip key={k} tone="butter" on={(form.experience || EXPERIENCE_DEFAULT) === k} sub={v === 1 ? "typical" : `×${v}`} onClick={() => patch({ experience: k })} {...peekX({ name: k, text: EXPERIENCE[k] })}>{k}</Chip>)}</Row>
            <Desc d={dx} selected={{ name: form.experience || EXPERIENCE_DEFAULT, text: EXPERIENCE[form.experience || EXPERIENCE_DEFAULT] }} tone="butter" />
          </Group>
        </div>
      )}

      {rate.mode === "goal" && (
        <>
          {hourly ? (
            <p className="qw-small qw-in">
              Your goal rate is <b>{rateText(hourly)} an hour</b>. {" "}
              <button type="button" className="qw-link" onClick={() => setTab("profile")}>Change it in Profile</button>
            </p>
          ) : (
            <div className="qw-in"><GoalNote profile={profile} onUse={useGoal} /></div>
          )}
          {!perHour && (fast ? (
            <div className="qw-in">
              <Group label={`How many ${noun.many} in an hour?`} hint="Count checking and fixing too, not just the first pass.">
                <Throughput key={model.type} hours={rate.hours} onHours={(h) => patch({ hoursPerUnit: h })} label={`${noun.many} in an hour`} step={rate.hours < 0.01 ? 100 : rate.hours < 0.05 ? 5 : 1} />
              </Group>
            </div>
          ) : (
            <div className="qw-in">
              <Group label={`How many hours is one ${noun.one}?`} hint="Count prep, the work, edits and back-and-forth.">
                <Stepper value={form.hoursPerUnit ?? rate.hours ?? ""} onChange={(v) => patch({ hoursPerUnit: v })} min={0.1} step={0.5} label={`Hours for one ${noun.one}`} />
              </Group>
            </div>
          ))}
        </>
      )}

      {rate.mode === "mine" && (
        <div className="qw-in">
          <Group label={`Your rate, ${unit}`} hint="The number you already charge, or want to.">
            <Money value={ownRate || ""} onChange={(v) => { setOwnRate(v === "" ? 0 : v); patch({ rateMode: "mine" }); }} label={`Your rate, ${unit}`} />
          </Group>
        </div>
      )}

      <div className="qw-in qw-note qw-rate" aria-live="polite">
        <span className="qw-paper-lab">Your base rate</span>
        <b className="qw-rate-num">{rateText(rate.rate)}<small>{unit}</small></b>
        {hourlyEq != null && !perHour && (
          <span className="qw-paper-small">
            About <b>{rateText(hourlyEq)} an hour</b> at {fast ? <>{Math.round(1 / rate.hours).toLocaleString("en-US")} {noun.many} an hour</> : <>{rate.hours} {rate.hours === 1 ? "hour" : "hours"} each</>}.
          </span>
        )}
        {need && <span className="qw-paper-small">{need}</span>}
      </div>

      {anchor && <div className="qw-in"><QuickCheck anchor={anchor} profile={profile} hourlyEq={hourlyEq} /></div>}
    </>
  );
}

/** "How many an hour?" for a unit that takes minutes: stored as hours for one, shown as a count. Keeps what you type while you type it. */
function Throughput({ hours, onHours, label, step }) {
  const [txt, setTxt] = useState(String(Math.round(1 / hours)));
  return (
    <Stepper
      value={txt} min={1} step={step} label={label}
      onChange={(v) => { setTxt(v === "" ? "" : String(v)); if (Number(v) > 0) onHours(1 / Number(v)); }}
    />
  );
}

/** A small paper note for working out a goal rate from what you want to take home (the same maths as the Rate finder in Profile). */
function GoalNote({ profile, onUse }) {
  const base = finderInputs(profile);
  const [goal, setGoal] = useState(base.goal), [hrs, setHrs] = useState(base.hoursPerWeek);
  const inputs = { ...base, goal, hoursPerWeek: hrs };
  const res = calcBaseRate(inputs);
  return (
    <form className="qw-paper" aria-label="Work out my goal rate" onSubmit={(e) => { e.preventDefault(); if (res.valid) onUse(inputs, res.rate); }}>
      <span className="qw-paper-lab">Work out my goal rate</span>
      <label className="qw-paper-lab" htmlFor="qw-g-goal">Yearly take-home goal ($)</label>
      <input id="qw-g-goal" className="qw-field" type="number" inputMode="numeric" min={0} value={goal} onChange={(e) => setGoal(e.target.value === "" ? "" : Number(e.target.value))} />
      <label className="qw-paper-lab" htmlFor="qw-g-hrs">Billable hours a week</label>
      <input id="qw-g-hrs" className="qw-field" type="number" inputMode="numeric" min={0} value={hrs} onChange={(e) => setHrs(e.target.value === "" ? "" : Number(e.target.value))} />
      <span className="qw-paper-small" role="status">
        {res.valid ? <>That works out to <b>{rateText(res.rate)} an hour</b>, after a {base.taxRate}% tax set-aside, {money(base.expenses)} a year of costs and {base.weeksOff} weeks off.</> : res.reason}
      </span>
      <div className="qw-paper-row" style={{ marginTop: 14 }}>
        <Go tone="mint" className="qw-go--sm" type="submit" disabled={!res.valid}>{res.valid ? `Use ${rateText(res.rate)} an hour` : "Use this rate"}</Go>
      </div>
      <span className="qw-paper-small">Estimates only, not tax advice. It is saved as your default rate, and you can fine-tune it any time in Profile.</span>
    </form>
  );
}

/** What US employees in a matching job earn per hour (US Bureau of Labor Statistics), and what you would bill to take home the same. Orientation, not a rule. */
function QuickCheck({ anchor, profile, hourlyEq }) {
  const fe = freelanceEquivalent(anchor.median, profile), own = !!profile?.rateFinder;
  return (
    <aside className="qw-paper qw-check" aria-label="Quick check against US wages">
      <span className="qw-paper-lab">Quick check · US wages</span>
      <p>
        US employees BLS lists as “{anchor.title}” earn a middle wage of <b>{rateText(anchor.median)} an hour</b>; the middle half earn {rateText(anchor.p25)} to {rateText(anchor.p75)}.
      </p>
      {fe && (
        <p>
          To take home what that wage does, you would bill about <b>{rateText(fe.rate)} an hour</b>: {own ? "your" : "typical"} rate-finder settings are a {fe.inputs.taxRate}% tax
          set-aside, {money(fe.inputs.expenses)} a year of costs, {fe.inputs.hoursPerWeek} billable hours a week and {fe.inputs.weeksOff} weeks off.
        </p>
      )}
      {hourlyEq != null && fe && <p>Your base rate comes to about <b>{rateText(hourlyEq)} an hour</b>, {hourlyEq < fe.rate ? "under" : "at or above"} that.</p>}
      <small>
        Source: <a href={anchor.url} target="_blank" rel="noopener noreferrer">US Bureau of Labor Statistics, Occupational Employment and Wage Statistics, May {anchor.year}</a>.
        These are employee wages, for orientation only. They are not a freelance rate or advice.
      </small>
    </aside>
  );
}
