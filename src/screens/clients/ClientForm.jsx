import React, { useEffect, useRef, useState } from "react";
import { Card, Field } from "../../components/kit";
import { PBtn, PInput, PSelect } from "../../components/ui";
import { clientMods, complexityMods, usageRightsMods } from "../../utils/pricing";
import { selectOptions } from "./format";

const COMPLEXITY = Object.keys(complexityMods);
const USAGE = Object.keys(usageRightsMods);
const CLIENT_TYPES = Object.keys(clientMods);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Pick({ label, value, onChange, keys }) {
  return (
    <Field label={label}>
      <div role="group" aria-label={label}>
        <PSelect value={value} onChange={onChange} options={selectOptions(keys, value)} iconType="none" style={{ marginBottom: 0 }} />
      </div>
    </Field>
  );
}

function validate(f) {
  const e = {};
  if (!String(f.name || "").trim()) e.name = "Add a name so you can find this client later.";
  const email = String(f.email || "").trim();
  if (email && !EMAIL_RE.test(email)) e.email = "That email doesn't look right. Try name@company.com.";
  const m = Number(f.rateMultiplier);
  if (f.rateMultiplier === "" || !Number.isFinite(m) || m < 0.1 || m > 10) e.rateMultiplier = "Enter a multiplier between 0.1 and 10. Use 1 for your standard rate.";
  return e;
}

/** Create / edit form. `initial` is the client being edited (or a blank new one); onSave receives the cleaned client. */
export default function ClientForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);

  // A brand-new client starts with the cursor in the name field.
  useEffect(() => {
    if (!initial.name) formRef.current?.querySelector("#cli-name")?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const errors = validate(form);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const touch = (k) => () => setTouched((t) => ({ ...t, [k]: true }));
  const err = (k) => (submitted || touched[k] ? errors[k] : undefined);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) {
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    onSave({
      ...form,
      name: form.name.trim(),
      email: String(form.email || "").trim(),
      phone: String(form.phone || "").trim(),
      rateMultiplier: Number(form.rateMultiplier),
    });
  };

  return (
    <Card pad="lg">
      <form ref={formRef} className="cli-form" onSubmit={handleSubmit} noValidate>
        <div className="cli-form-grid cli-form-grid--2">
          <Field label="Name" htmlFor="cli-name" error={err("name")}>
            <PInput id="cli-name" value={form.name} onChange={set("name")} onBlur={touch("name")} placeholder="e.g. Acme Corp" aria-invalid={!!err("name")} autoComplete="off" maxLength={120} />
          </Field>
          <Field label="Email" htmlFor="cli-email" error={err("email")}>
            <PInput id="cli-email" type="email" value={form.email} onChange={set("email")} onBlur={touch("email")} placeholder="contact@acme.com" aria-invalid={!!err("email")} autoComplete="off" />
          </Field>
          <Field label="Phone" htmlFor="cli-phone">
            <PInput id="cli-phone" type="tel" value={form.phone} onChange={set("phone")} placeholder="+1 555 555 5555" autoComplete="off" />
          </Field>
          <Field label="Rate multiplier" htmlFor="cli-mult" hint="1.2 means 20% more than your standard rate." error={err("rateMultiplier")}>
            <PInput id="cli-mult" type="number" value={form.rateMultiplier} onChange={set("rateMultiplier")} onBlur={touch("rateMultiplier")} min={0.1} step="0.1" inputMode="decimal" placeholder="1.0" aria-invalid={!!err("rateMultiplier")} />
          </Field>
        </div>

        <div>
          <h2 className="cli-form-h">Quote defaults</h2>
          <p className="cli-form-p">These pre-fill the calculator when you use this client for a new quote.</p>
          <div className="cli-form-grid cli-form-grid--3">
            <Pick label="Complexity" value={form.preferredComplexity} onChange={set("preferredComplexity")} keys={COMPLEXITY} />
            <Pick label="Usage rights" value={form.preferredUsageRights} onChange={set("preferredUsageRights")} keys={USAGE} />
            <Pick label="Client type" value={form.preferredClientType} onChange={set("preferredClientType")} keys={CLIENT_TYPES} />
          </div>
        </div>

        <Field label="Notes" htmlFor="cli-notes" hint="Anything worth remembering. Optional.">
          <textarea id="cli-notes" value={form.notes || ""} onChange={(e) => set("notes")(e.target.value)} placeholder="e.g. VIP client, prefers invoices on the 1st" maxLength={1000} />
        </Field>

        <div className="cli-form-actions">
          <PBtn type="submit" color="var(--butter)">Save client</PBtn>
          <PBtn type="button" color="var(--paper)" className="lq-btn--neutral" onClick={onCancel}>Cancel</PBtn>
        </div>
      </form>
    </Card>
  );
}
