import React, { useState } from "react";
import { Go } from "../../world/controls";
import { buildInvoiceFigures, EXCLUSIVITY_MOD, hasLicensing, usageRightsMods, usageTermMods } from "../../utils/pricing";
import { modelKind, sizesOf, unitNoun } from "../../utils/rateModels";
import { IconCopy, IconStar } from "../../icons";
import { countOf, fitFor, money, rateText, reduced } from "./common";
import { CLIENT, COMPLEXITY, TERM, USAGE } from "./describe";

const TIERS = [
  { key: "low", name: "Budget", note: "20% under fair", tone: "blue" },
  { key: "fair", name: "Fair", note: "Your baseline", tone: "mint", star: true },
  { key: "premium", name: "Premium", note: "30% over fair", tone: "pink" },
];

// The last step: three honest prices, what you keep, and what the price is based on.
export default function PriceStation({ ctx, onRestart, goTo }) {
  const { baseRate, category, clients, selectedClientId, form, handleSave, materialsCost, model, price, profile, rate, role, saved, selectedTier, setNewTemplateForm, setSelectedTier, setShowSaveTemplateModal } = ctx;
  const takeTax = Math.min(60, Math.max(0, Number(profile?.rateFinder?.taxRate ?? 25)));
  const licensing = hasLicensing(category, role.name), term = form.usageTerm || "1 year";
  const noun = unitNoun(model), percent = modelKind(model) === "percent" && !!form.deal;
  const tier = TIERS.find((t) => t.key === selectedTier);

  if (!price) return <p className="qw-small qw-in">Working out your price…</p>;
  // calcPrice never quotes under $50 (an existing rule). Small jobs (a word, an image, a sound effect) hit it, and then the numbers say nothing about the rate.
  const minimum = Math.abs(price.fair - 50) < 0.005;

  // a price built on no rate is $0: say what is missing instead of showing it
  if (!(baseRate > 0)) {
    const deal = rate.wanted === "deal";
    return (
      <div className="qw-in qw-note">
        <span className="qw-paper-lab">Not quite yet</span>
        <p className="qw-paper-small" style={{ fontSize: 16 }}>{deal ? "Add the deal amount to see your fee." : "Set your rate to see a price."}</p>
        <div className="qw-paper-row" style={{ marginTop: 14 }}>
          <Go tone="mint" className="qw-go--sm" onClick={() => goTo(deal ? "job" : "rate")}>{deal ? "Back to the deal" : "Back to the rate"}</Go>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="qw-in qw-note">
        <span className={`qw-stamp qw-tone-${tier?.tone || "mint"}`}>{tier?.name}</span>
        <span className="qw-paper-lab">Estimated total</span>
        <b className="qw-total" style={{ "--fit": fitFor(money(price[selectedTier]), 7) }} aria-live="polite">{money(price[selectedTier])}</b>
        <span className="qw-paper-small" role="status">You keep about <b>{money(price[selectedTier] * (1 - takeTax / 100))}</b> after a {takeTax}% tax set-aside.</span>
        <span className="qw-paper-small"><button type="button" className="qw-link" onClick={() => document.getElementById("qw-how-sec")?.scrollIntoView({ behavior: reduced() ? "auto" : "smooth", block: "start" })}>See how it was worked out ↓</button></span>
        {minimum && <span className="qw-paper-small">This is the $50 minimum quote: the job itself adds up to less, so it is rounded up.</span>}
      </div>
      {price.licenseFrac > 0 && (
        <dl className="qw-split qw-in" aria-label="Price split">
          <div><dt>Creative fee</dt><dd>{money(price[selectedTier] * (1 - price.licenseFrac))}</dd></div>
          <div><dt>Usage licence</dt><dd>{money(price[selectedTier] * price.licenseFrac)}</dd></div>
        </dl>
      )}
      <div className="qw-tiers qw-in" role="group" aria-label="Choose a price tier">
        {TIERS.map((t) => {
          const text = money(price[t.key]);
          return (
            <button key={t.key} type="button" className={`qw-tier qw-tone-${t.tone}`} aria-pressed={selectedTier === t.key} onClick={() => setSelectedTier(t.key)}>
              <span className="qw-tier-name">{t.name}{t.star && <IconStar size={12} />}</span>
              <b style={{ "--fit": fitFor(text) }}>{text}</b>
              <small>{t.note}</small>
            </button>
          );
        })}
      </div>
      <div className="qw-actions qw-in">
        <Go tone={saved ? "mint" : "pink"} onClick={handleSave}>{saved ? "Saved to log" : "Save to log"}</Go>
        <button type="button" className="qw-paperbtn" onClick={() => { setNewTemplateForm({ name: "", notes: "" }); setShowSaveTemplateModal(true); }}><IconCopy size={17} /><span>Save as template</span></button>
        <button type="button" className="qw-ghost" onClick={onRestart}>Start over</button>
      </div>
      <Breakdown ctx={ctx} licensing={licensing} term={term} noun={noun} percent={percent} />
      <ul className="qw-summary qw-in" aria-label="What this price is based on">
        <li className="qw-tone-lilac">{role.name}</li>
        {form.size && sizesOf(model) && <li className="qw-tone-blue">{form.size}</li>}
        {percent
          ? <li className="qw-tone-mint">{Number(form.deal.pct ?? model.base)}% of {money(form.deal.amount)}</li>
          : <>
              <li className="qw-tone-mint">{countOf(form.units, noun)}</li>
              <li className="qw-tone-butter">{rateText(baseRate)} {String(model.unit).replace("per hour", "per hr")}</li>
            </>}
        <li className="qw-tone-butter">{form.complexity}</li>
        <li className="qw-tone-blue">{form.clientType}</li>
        <li className="qw-tone-mint">{form.usage}{licensing ? ` · ${term}` : ""}{licensing && form.exclusive ? " · exclusive" : ""}</li>
        {form.rush && <li className="qw-tone-pink">Rush</li>}
        {form.buffer > 0 && <li className="qw-tone-lilac">Buffer +{form.buffer}%</li>}
        {materialsCost > 0 && <li className="qw-tone-pink">Supplies {money(materialsCost)}</li>}
      </ul>
    </>
  );
}

const first = (t) => String(t || "").split(". ")[0].replace(/\.$/, "") + ".";

/** "How we got this price": every step from your rate to the fair price, with what it means, then how Budget and Premium come from the fair one. */
function Breakdown({ ctx, licensing, term, noun, percent }) {
  const { baseRate, clients = [], form, materialsCost, model, price, selectedClientId } = ctx;
  const [open, setOpen] = useState(true);
  const cm = clients.find((c) => c.id === selectedClientId)?.rateMultiplier || 1;
  const fig = buildInvoiceFigures({ ...form, baseRate, materialsCost, usageTerm: licensing ? form.usageTerm : undefined, exclusive: licensing && !!form.exclusive }, cm);
  if (Math.abs(fig.totalDue - price.fair) > 0.01) return null; // never explain a different number from the one shown

  const rows = [];
  const sm = ctx.rate?.sizeMult || 1;
  let t = fig.base / sm; // for a model sold in sizes the rate on the first line is the base size's; the size is its own step below
  rows.push({
    name: percent ? "Your cut of the deal" : "Your rate × quantity",
    why: percent ? `${Number(form.deal.pct ?? model.base)}% of ${money(form.deal.amount)}.` : `${rateText(baseRate / sm)} × ${countOf(form.units, noun)}.`,
    total: t,
  });
  const times = (name, mult, why) => { if (mult === 1) return; t *= mult; rows.push({ name, mult, why: first(why), total: t }); };
  times(`Size · ${form.size}`, sm, "A different size scales the rate (print cost follows the paper).");
  times(`Complexity · ${form.complexity}`, fig.cM, COMPLEXITY[form.complexity]);
  times(`Usage · ${form.usage}`, usageRightsMods[form.usage] || 1, USAGE[form.usage]);
  if (licensing) {
    times(`Licence term · ${term}`, usageTermMods[term] || 1, TERM[term]);
    if (form.exclusive) times("Exclusive", EXCLUSIVITY_MOD, "No competitor of the client may use it");
  }
  times(`Client · ${form.clientType}`, fig.clM, CLIENT[form.clientType]);
  times("Rush delivery", fig.rushM, "A faster turnaround costs 30% more");
  times(`Revisions · ${form.revisions} included`, fig.revM, fig.revM < 1 ? "No revisions, so a small discount" : "Three or more rounds of revisions take extra time");
  if (fig.materialsTotal > 0) { t += fig.materialsTotal; rows.push({ name: "Supplies", add: fig.materialsTotal, why: "What the materials cost, passed on.", total: t }); }
  if (fig.travelTotal > 0) { t += fig.travelTotal; rows.push({ name: "Travel", add: fig.travelTotal, why: "Your travel costs, added as they are.", total: t }); }
  times("Saved client's rate", fig.clientMultiplier, "The rate multiplier set on this client");
  times(`Buffer · ${fig.bufferPct}%`, 1 + fig.bufferPct / 100, "Contingency for scope creep and slow payers");
  if (fig.platformFeeAmount > 0) { t += fig.platformFeeAmount; rows.push({ name: `Platform fee · ${fig.platformPct}%`, add: fig.platformFeeAmount, why: "The payment processor's cut, so it does not come out of your fee.", total: t }); }
  const minimum = t < 50;
  if (minimum) rows.push({ name: "Minimum quote", why: "This calculator never quotes under $50.", total: 50 });
  // the price tiles show whole dollars, so the ledger ends on the same figure; when the exact amount has cents it says so (otherwise $801 above would meet $800.80 below)
  const cents = Math.abs(fig.totalDue - Math.round(fig.totalDue)) > 0.004;

  return (
    <section className="qw-in qw-group" id="qw-how-sec" aria-label="How this price was worked out">
      {!open && <button type="button" className="qw-paperbtn" aria-expanded="false" aria-controls="qw-how" onClick={() => setOpen(true)}><span>How was this worked out?</span></button>}
      {open && (
        <div className="qw-paper qw-how" id="qw-how">
          <div className="qw-how-head">
            <span className="qw-paper-lab">How we got your fair price</span>
            <button type="button" className="qw-link" aria-expanded="true" aria-controls="qw-how" onClick={() => setOpen(false)}>Hide</button>
          </div>
          <ol className="qw-how-list">
            {rows.map((r, i) => (
              <li key={i}>
                <div><b>{r.name}</b><small>{r.why}</small></div>
                <div className="qw-how-num">{r.mult && <i>×{+r.mult.toFixed(3)}</i>}{r.add != null && <i>+{rateText(r.add)}</i>}<b>{rateText(r.total)}</b></div>
              </li>
            ))}
            <li className="qw-how-total"><div><b>Fair price</b><small>What you quote if nothing else changes.{cents && ` Worked out to ${rateText(fig.totalDue)}; the prices on this page are shown to the nearest dollar.`}</small></div><div className="qw-how-num"><b>{money(fig.totalDue)}</b></div></li>
          </ol>
          <p className="qw-paper-small">
            <b>Budget</b> is 80% of fair ({money(price.low)}): for a client with a tight budget, or work you really want to win.
            {" "}<b>Premium</b> is 130% of fair ({money(price.premium)}): for a rush, a difficult client, or when your calendar is full.
          </p>
          {rows.length === 1 && <p className="qw-paper-small">Every setting is at its standard value, so nothing adjusted your rate. Change complexity, client or usage on the earlier steps to see them here.</p>}
        </div>
      )}
    </section>
  );
}
