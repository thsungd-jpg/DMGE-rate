import React, { useRef, useState } from "react";
import { Card, Field } from "../../components/kit";
import { PBtn, PInput, PSelect } from "../../components/ui";
import { clientMods, complexityMods, usageRightsMods } from "../../utils/pricing";
import { selectOptions } from "./format";

const COMPLEXITY = Object.keys(complexityMods);
const USAGE = Object.keys(usageRightsMods);
const CLIENT_TYPES = Object.keys(clientMods);

function Pick({ label, value, onChange, keys }) {
  return (
    <Field label={label}>
      <div role="group" aria-label={label}>
        <PSelect value={value} onChange={onChange} options={selectOptions(keys, value)} iconType="none" style={{ marginBottom: 0 }} />
      </div>
    </Field>
  );
}

/** Inline editor for a saved template: name, base rate, key settings and notes. */
export default function TemplateEditor({ template, onSave, onCancel }) {
  const f = template.form || {};
  const [name, setName] = useState(template.name || "");
  const [baseRate, setBaseRate] = useState(template.baseRate ?? "");
  const [units, setUnits] = useState(f.units ?? 1);
  const [complexity, setComplexity] = useState(f.complexity || "Standard");
  const [usage, setUsage] = useState(f.usage || "Personal");
  const [clientType, setClientType] = useState(f.clientType || "Individual");
  const [rush, setRush] = useState(!!f.rush);
  const [notes, setNotes] = useState(template.notes || "");
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const formRef = useRef(null);

  const errors = {};
  if (!name.trim()) errors.name = "Give this template a name so you can find it later.";
  if (baseRate === "" || !Number.isFinite(Number(baseRate)) || Number(baseRate) < 0) errors.baseRate = "Enter a base rate of 0 or more.";
  if (units === "" || !Number.isFinite(Number(units)) || Number(units) <= 0) errors.units = "Units must be more than 0.";
  const show = (k) => (submitted ? errors[k] : undefined);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...template,
        name: name.trim(),
        baseRate: Number(baseRate),
        notes: notes.trim(),
        form: { ...f, units: Number(units), complexity, usage, clientType, rush },
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card pad="lg">
      <form ref={formRef} className="tpl-form" onSubmit={handleSubmit} noValidate>
        <Field label="Template name" htmlFor="tpl-name" error={show("name")}>
          <PInput id="tpl-name" value={name} onChange={setName} placeholder="e.g. Brand identity: agency" aria-invalid={!!show("name")} maxLength={80} />
        </Field>

        <div className="tpl-form-grid">
          <Field label="Base rate ($)" htmlFor="tpl-rate" error={show("baseRate")}>
            <PInput id="tpl-rate" type="number" value={baseRate} onChange={setBaseRate} min={0} step="0.01" inputMode="decimal" aria-invalid={!!show("baseRate")} />
          </Field>
          <Field label="Units" htmlFor="tpl-units" hint="Hours, days or deliverables, depending on the pricing model." error={show("units")}>
            <PInput id="tpl-units" type="number" value={units} onChange={setUnits} min={0} step="0.5" inputMode="decimal" aria-invalid={!!show("units")} />
          </Field>
        </div>

        <div className="tpl-form-grid">
          <Pick label="Complexity" value={complexity} onChange={setComplexity} keys={COMPLEXITY} />
          <Pick label="Usage rights" value={usage} onChange={setUsage} keys={USAGE} />
          <Pick label="Client type" value={clientType} onChange={setClientType} keys={CLIENT_TYPES} />
        </div>

        <label className="tpl-check">
          <input type="checkbox" checked={rush} onChange={(e) => setRush(e.target.checked)} />
          <span>Rush job <span className="tpl-check-hint">adds 30% to the price</span></span>
        </label>

        <Field label="Notes" htmlFor="tpl-notes" hint="Shown on the template card. Optional.">
          <textarea id="tpl-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Starting point for identity work" maxLength={500} />
        </Field>

        <div className="tpl-form-actions">
          <PBtn type="submit" color="var(--butter)" disabled={saving}>{saving ? "Saving..." : "Save changes"}</PBtn>
          <PBtn type="button" color="var(--paper)" className="lq-btn--neutral" onClick={onCancel}>Cancel</PBtn>
        </div>
      </form>
    </Card>
  );
}
