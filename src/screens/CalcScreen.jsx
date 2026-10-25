import React, { useEffect, useRef } from "react";
import { MatChip, OptionGrid, PBtn, PCollapsible, PInput, PSelect, PStepper } from "../components/ui";
import { Screen, Card, Pill, Field, Segmented, IconBtn } from "../components/kit";
import { clientMods, complexityMods, hasLicensing, usageRightsMods, usageTermMods, EXCLUSIVITY_MOD } from "../utils/pricing";
import { IconStar, IconCheck, IconVolume, IconVolumeOff, IconBook, IconPlus, IconCopy } from "../icons";
import "./calc.css";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");

/** Numbered step heading inside a card. */
function Step({ n, title, hint }) {
  return (
    <div className="calc-step">
      <span className="calc-step-n">{n}</span>
      <div>
        <h2>{title}</h2>
        {hint && <p>{hint}</p>}
      </div>
    </div>
  );
}

/** Guided-flow wrapper: the card that should be filled in next glows and shows a small pill. */
function Guided({ step, glowStep, advance, label, children }) {
  const on = glowStep === step;
  return (
    <div className={"calc-guided" + (on ? " lq-glow is-on" : "")} onClick={() => advance(step)}>
      {on && <span className="calc-guide-pill">{label}</span>}
      {children}
    </div>
  );
}

const TIERS_UI = [
  { key: "low", name: "Budget", note: "20% under fair", tone: "blue" },
  { key: "fair", name: "Fair", note: "Your baseline", tone: "mint", star: true },
  { key: "premium", name: "Premium", note: "30% over fair", tone: "pink" },
];

export default function CalcScreen({ ctx }) {
  const {
    ALL_DATA, profile, advanceGlow, catData, category, clients, customMaterials, form, glowStep, handleAddCustomMaterial,
    handleCalc, handleReset, handleResetModel, handleSave, handleToggleMute, matPriceOverrides, matQtys,
    materialSummary, materialsCost, mats, model, modelIdx, muted, price, resetKey, role, roleIdx, saved,
    selectedClientId, selectedTier, set, setCategory, setForm, setMatPriceOverrides, setMatQtys, setModelIdx,
    setNewTemplateForm, setPrice, setRoleIdx, setSelectedClientId, setSelectedTier, setShowSaveTemplateModal, setTab,
  } = ctx;

  // On phones the result panel sits under the form: bring it into view once a quote exists.
  const panelRef = useRef(null);
  useEffect(() => {
    if (price && window.matchMedia?.("(max-width: 979px)").matches) {
      panelRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    }
  }, [price]);

  const takeTax = Math.min(60, Math.max(0, Number(profile?.rateFinder?.taxRate ?? 25)));
  const licensing = hasLicensing(category, role.name);
  const term = form.usageTerm || "1 year";
  const allMats = [...mats, ...customMaterials];
  const unitLabel = model.unit.replace("per hour", "per hr");
  const guideLabel = { role: "Start here", clientType: "Next", usage: "Next" };

  return (
    <Screen
      eyebrow="Quote"
      title={<>Price this <em>job.</em></>}
      subtitle="Pick the work, say who it is for, and get three honest prices. Save the one you quote."
      actions={
        <>
          {form.id && <Pill tone="pink" dot>Editing {form.invoiceNumber}</Pill>}
          <IconBtn label={muted ? "Turn sounds on" : "Turn sounds off"} onClick={handleToggleMute}>
            {muted ? <IconVolumeOff size={19} /> : <IconVolume size={19} />}
          </IconBtn>
          <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={() => setTab("tutorial")}><IconBook size={16} /> Tutorial</PBtn>
        </>
      }
    >
      <div className="calc-layout">
        {/* ───────── inputs ───────── */}
        <div className="calc-form">
          <Card>
            <Field label="Quote for">
              <PSelect
                label="Quote for"
                value={selectedClientId}
                onChange={(id) => {
                  setSelectedClientId(id);
                  const c = clients.find((cl) => cl.id === id);
                  if (c) setForm((f) => ({ ...f, complexity: c.preferredComplexity, usage: c.preferredUsageRights, clientType: c.preferredClientType }));
                  setPrice(null);
                }}
                options={[{ label: "No client (default rates)", value: "" }, ...clients.map((c) => ({ label: `${c.name} (${c.rateMultiplier}x)`, value: c.id }))]}
                iconType="none"
                style={{ marginBottom: 0 }}
              />
            </Field>
          </Card>

          <Guided step="role" glowStep={glowStep} advance={advanceGlow} label={guideLabel.role}>
            <Card pad="lg">
              <Step n="01" title="The work" hint="Choose your field, role and how you charge." />
              <div className="calc-grid2">
                <Field label="Category">
                  <PSelect
                    label="Category"
                    value={category}
                    onChange={(v) => { setCategory(v); setRoleIdx(0); setModelIdx(0); handleResetModel(ALL_DATA[v].roles[0].models[0]); }}
                    options={Object.keys(ALL_DATA).map((c) => ({ label: c, value: c }))}
                    iconType="cat"
                    style={{ marginBottom: 0 }}
                  />
                </Field>
                <Field label="Role">
                  <PSelect
                    label="Role"
                    value={roleIdx}
                    onChange={(v) => { setRoleIdx(v); setModelIdx(0); handleResetModel(catData.roles[v].models[0]); }}
                    options={catData.roles.map((r, i) => ({ label: r.name, value: i }))}
                    iconType="none"
                    style={{ marginBottom: 0 }}
                  />
                </Field>
              </div>
              <Field label="Pricing model">
                <PSelect
                  label="Pricing model"
                  value={modelIdx}
                  onChange={(v) => { setModelIdx(v); handleResetModel(role.models[v]); }}
                  options={role.models.map((m, i) => ({ label: `${m.type} (${m.unit})`, value: i }))}
                  iconType="none"
                  style={{ marginBottom: 0 }}
                />
              </Field>
              <div className="calc-qty">
                <Field label={`Quantity · ${unitLabel}`} hint="How many units are you quoting?">
                  <PStepper value={Number(form.units) || 0} onChange={set("units")} min={0.1} step={1} />
                </Field>
              </div>
              <Field label="Complexity" hint="Simple projects get lower rates; masterpieces command premium pricing.">
                <OptionGrid options={complexityMods} value={form.complexity} onChange={set("complexity")} activeColor="var(--butter)" activeShadow="var(--butter-deep)" />
              </Field>
            </Card>
          </Guided>

          <Guided step="clientType" glowStep={glowStep} advance={advanceGlow} label={guideLabel.clientType}>
            <Card pad="lg">
              <Step n="02" title="Who it's for" hint="Corporate clients typically pay 2 to 2.5x more." />
              <OptionGrid options={clientMods} value={form.clientType} onChange={(v) => { set("clientType")(v); advanceGlow("clientType"); }} activeColor="var(--blue)" activeShadow="var(--blue-deep)" />
            </Card>
          </Guided>

          <Guided step="usage" glowStep={glowStep} advance={advanceGlow} label={guideLabel.usage}>
            <Card pad="lg">
              <Step n="03" title="Usage rights" hint="Personal is one-time use; commercial grants broader rights." />
              <OptionGrid options={usageRightsMods} value={form.usage} onChange={(v) => { set("usage")(v); advanceGlow("usage"); }} activeColor="var(--mint)" activeShadow="var(--mint-deep)" />
              {licensing && (
                <div className="calc-license">
                  <Field label="Licence term" hint="How long the client may use the work.">
                    <Segmented
                      ariaLabel="Licence term"
                      value={term}
                      onChange={(v) => { setForm((f) => ({ ...f, usageTerm: v })); setPrice(null); }}
                      options={Object.keys(usageTermMods).map((k) => ({ value: k, label: k }))}
                    />
                  </Field>
                  <Field label="Category exclusivity" hint={`The client's competitors may not license it. Adds ${Math.round((EXCLUSIVITY_MOD - 1) * 100)}%.`}>
                    <Segmented
                      ariaLabel="Category exclusivity"
                      value={!!form.exclusive}
                      onChange={(v) => { setForm((f) => ({ ...f, exclusive: v })); setPrice(null); }}
                      options={[{ value: false, label: "Not exclusive" }, { value: true, label: "Exclusive" }]}
                    />
                  </Field>
                </div>
              )}
            </Card>
          </Guided>

          <Card pad="lg">
            <Step n="04" title="Extras" hint="Optional details that move the price." />
            <div className="calc-extras">
              <PCollapsible key={`revisions-${resetKey}`} title="Revisions" collapsedInfo={`${form.revisions} revisions`} tooltip="0 revisions = discount; 3+ revisions = premium">
                <Field label="Included revisions"><PInput type="number" value={form.revisions} onChange={set("revisions")} placeholder="0" min={0} step={1} /></Field>
              </PCollapsible>
              <PCollapsible key={`travel-${resetKey}`} title="Commute" collapsedInfo={`$${(form.travelExpense || 0).toFixed(2)}`} tooltip="Add direct travel expenses to the quote">
                <Field label="Travel cost ($)"><PInput type="number" value={form.travelExpense || 0} onChange={(v) => { setForm((f) => ({ ...f, travelExpense: v })); setPrice(null); }} placeholder="0.00" /></Field>
              </PCollapsible>
              <PCollapsible key={`rush-${resetKey}`} title="Rush" collapsedInfo={form.rush ? "Yes (+30%)" : "No"} tooltip="30% markup for expedited delivery">
                <Field label="Expedited delivery">
                  <Segmented
                    ariaLabel="Rush order"
                    value={!!form.rush}
                    onChange={(v) => { setForm((f) => ({ ...f, rush: v })); setPrice(null); }}
                    options={[{ value: false, label: "Standard" }, { value: true, label: "Rush +30%" }]}
                  />
                </Field>
              </PCollapsible>
              <PCollapsible key={`buffer-${resetKey}`} title="Buffer" collapsedInfo={form.buffer ? `+${form.buffer}%` : "None"} tooltip="Contingency for scope creep and slow payers">
                <Field label="Contingency" hint="Most projects need 10 to 25% for surprises.">
                  <Segmented
                    ariaLabel="Contingency buffer"
                    value={form.buffer || 0}
                    onChange={(v) => { setForm((f) => ({ ...f, buffer: v })); setPrice(null); }}
                    options={[0, 10, 15, 25].map((n) => ({ value: n, label: n ? `+${n}%` : "None" }))}
                  />
                </Field>
              </PCollapsible>
              <PCollapsible key={`platform-${resetKey}`} title="Platform fee" collapsedInfo={form.platformFee ? `${form.platformFee}%` : "None"} tooltip="Add a percentage to cover payment processing costs">
                <Field label="Fee (%)"><PInput type="number" value={form.platformFee || 0} onChange={(v) => { setForm((f) => ({ ...f, platformFee: v })); setPrice(null); }} placeholder="0" /></Field>
              </PCollapsible>
              <PCollapsible key={`materials-${resetKey}`} title="Supplies" collapsedInfo={materialSummary}>
                <div className="calc-mats">
                  {allMats.map((mat) => {
                    const displayMat = { ...mat, cost: matPriceOverrides[mat.name] ?? mat.cost };
                    return (
                      <MatChip
                        key={mat.name}
                        mat={displayMat}
                        qty={matQtys[mat.name] || 0}
                        accent="var(--pink)"
                        bg="var(--pink-soft)"
                        onAdd={() => setMatQtys((q) => ({ ...q, [mat.name]: (q[mat.name] || 0) + 1 }))}
                        onRemove={() => setMatQtys((q) => ({ ...q, [mat.name]: Math.max(0, (q[mat.name] || 0) - 1) }))}
                        onCostChange={(name, cost) => setMatPriceOverrides((o) => ({ ...o, [name]: cost }))}
                      />
                    );
                  })}
                </div>
                <PBtn full small color="var(--butter)" onClick={handleAddCustomMaterial}><IconPlus size={16} /> Add custom item</PBtn>
                {materialsCost > 0 && <div className="calc-subtotal">Supplies subtotal <b>${materialsCost.toFixed(2)}</b></div>}
              </PCollapsible>
              <PCollapsible key={`notes-${resetKey}`} title="Invoice notes" collapsedInfo={form.notes ? "Has notes" : "None"} tooltip="Specific details for this job or invoice">
                <Field label="Job notes">
                  <textarea
                    value={form.notes}
                    onChange={(e) => { setForm((f) => ({ ...f, notes: e.target.value })); setPrice(null); }}
                    placeholder="Specific job details…"
                  />
                </Field>
              </PCollapsible>
            </div>
          </Card>
        </div>

        {/* ───────── live quote panel ───────── */}
        <aside className="calc-aside" ref={panelRef}>
          <Card tone="glass" pad="lg" className="calc-panel">
            <p className="kit-eyebrow">Your quote</p>
            <div className="calc-sum-title">{role.name}</div>
            <div className="calc-sum-meta">{category} · {model.type}</div>
            <div className="calc-chips">
              <Pill tone="butter">{form.units} {unitLabel}</Pill>
              <Pill tone="butter">{form.complexity}</Pill>
              <Pill tone="blue">{form.clientType}</Pill>
              <Pill tone="mint">{form.usage}{licensing ? ` · ${term}` : ""}{licensing && form.exclusive ? " · exclusive" : ""}</Pill>
              {form.rush && <Pill tone="pink">Rush</Pill>}
              {form.buffer > 0 && <Pill tone="butter">Buffer +{form.buffer}%</Pill>}
              {materialsCost > 0 && <Pill tone="lilac">Supplies {money(materialsCost)}</Pill>}
            </div>

            <div className="calc-actions">
              <PBtn color="var(--ink)" className="auth-primary" onClick={handleCalc} style={{ flex: 1 }}>
                <IconStar size={18} /> Calculate
              </PBtn>
              <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={handleReset}>Reset</PBtn>
            </div>
            {glowStep === "calculate" && <p className="calc-hint">Ready: press Calculate.</p>}

            {price ? (
              <div className="calc-result">
                <div className="calc-total" aria-live="polite">
                  <span className="kit-eyebrow">Estimated total</span>
                  <b>{money(price[selectedTier])}</b>
                  <small>Pick a tier below to change it</small>
                </div>
                <p className="calc-keep" role="status">
                  You keep about <b>{money(price[selectedTier] * (1 - takeTax / 100))}</b> after a {takeTax}% tax set-aside.
                </p>
                {price.licenseFrac > 0 && (
                  <dl className="calc-split" aria-label="Price split">
                    <div><dt>Creative fee</dt><dd>{money(price[selectedTier] * (1 - price.licenseFrac))}</dd></div>
                    <div><dt>Usage licence</dt><dd>{money(price[selectedTier] * price.licenseFrac)}</dd></div>
                  </dl>
                )}
                <div className="calc-tiers" role="group" aria-label="Choose a price tier">
                  {TIERS_UI.map((t) => (
                    <button key={t.key} type="button" className={`calc-tier calc-tier--${t.tone}`} aria-pressed={selectedTier === t.key} onClick={() => setSelectedTier(t.key)}>
                      <span className="calc-tier-name">{t.name}{t.star && <IconStar size={13} />}</span>
                      <b>{money(price[t.key])}</b>
                      <span className="calc-tier-note">{t.note}</span>
                    </button>
                  ))}
                </div>
                <div className="calc-save">
                  <PBtn full color={saved ? "var(--mint)" : "var(--pink)"} onClick={handleSave}>
                    {saved ? <><IconCheck size={18} /> Saved to log</> : "Save to log"}
                  </PBtn>
                  <PBtn full color="var(--butter)" onClick={() => { setNewTemplateForm({ name: "", notes: "" }); setShowSaveTemplateModal(true); }}>
                    <IconCopy size={17} /> Save as template
                  </PBtn>
                </div>
              </div>
            ) : (
              <div className="calc-empty">
                <div className="calc-empty-bars" aria-hidden="true"><i /><i /><i /></div>
                <p>Fill in the details, then press <b>Calculate</b> to see Budget, Fair and Premium prices.</p>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </Screen>
  );
}
