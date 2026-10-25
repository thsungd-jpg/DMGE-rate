import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Mark } from "./Brand";
import { IconCross, IconEdit, IconPlus } from "../icons";
import { normalizeStatus } from "../screens/history/statusModel";
import "../screens/invoice-editor.css";

// Editable invoice sheet. It owns `invoiceData` and reports { ...invoiceData, subtotal, taxAmount, totalDue } to
// `onUpdate` on every change; that object is the `editorData` that src/utils/pdfExport.js turns into the PDF,
// so the field names and shapes below must not change.

const STATUS_FROM_JOB = { pending: "UNPAID", in_progress: "SENT", completed: "PAID" };

const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Same tint rules as the PDF status pill, so what you see here is what is printed.
function statusTone(status) {
  const s = String(status || "").toLowerCase();
  if (/overdue|late/.test(s)) return "pink";
  if (/draft|void|cancel/.test(s)) return "blue";
  if (/paid/.test(s) && !/un/.test(s)) return "mint";
  return "butter";
}

function buildItems(job) {
  const items = [];

  // Primary role item
  items.push({
    id: "primary",
    desc: `${job.role} - ${job.category}`,
    note: `${job.model} (${job.complexity || "Standard"}, ${job.usage || "Personal"})`,
    qty: job.units || 1,
    rate: job.baseRate || 0,
    amount: (job.units || 1) * (job.baseRate || 0)
  });

  // Materials
  if (job.materials && job.materials.length > 0) {
    job.materials.forEach((m, idx) => {
      items.push({
        id: `mat-${idx}`,
        desc: `Material: ${m.name}`,
        note: `Unit cost: $${m.cost}`,
        qty: m.qty,
        rate: m.cost,
        amount: m.qty * m.cost
      });
    });
  }

  // Travel
  if (job.travelExpense > 0) {
    items.push({
      id: "travel",
      desc: "Travel Expenses",
      note: "Direct commute costs",
      qty: 1,
      rate: job.travelExpense,
      amount: job.travelExpense
    });
  }

  return items;
}

// Free-text field: a textarea that grows with its content, so long descriptions and addresses wrap instead of scrolling.
function TextField({ value, onChange, label, className = "", placeholder, ...rest }) {
  const ref = useRef(null);
  const fit = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + 2 + "px";
  };
  useLayoutEffect(fit, [value]);
  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);
  return (
    <textarea
      ref={ref}
      rows={1}
      className={"iv-input " + className}
      value={value}
      placeholder={placeholder}
      aria-label={label}
      onChange={(e) => onChange(e.target.value)}
      {...rest}
    />
  );
}

// Numeric field that keeps what the person is typing ("1.", "0.5") while the parent stores the parsed number.
function NumField({ value, onCommit, label, prefix = "", className = "", ...rest }) {
  const [draft, setDraft] = useState(null);
  const ref = useRef(null);
  const justFocused = useRef(false);
  // Select the whole number right after focus, once the "$" prefix has been swapped out of the text.
  useLayoutEffect(() => {
    if (justFocused.current && draft !== null) {
      justFocused.current = false;
      ref.current?.select();
    }
  }, [draft]);
  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      autoComplete="off"
      className={"iv-input iv-input--num " + className}
      aria-label={label}
      value={draft ?? prefix + String(value ?? "")}
      onFocus={() => { justFocused.current = true; setDraft(String(value ?? "")); }}
      onChange={(e) => { setDraft(e.target.value); onCommit(e.target.value); }}
      onBlur={() => { justFocused.current = false; setDraft(null); }}
      {...rest}
    />
  );
}

export default function DMGEInvoiceEditor({ job, profile, clients, onUpdate }) {
  profile = profile || {};
  const client = (clients || []).find(c => c.id === job.clientId) || { name: "Client name / company", email: "", phone: "", address: "", city: "" };
  const uid = useId();
  const statusListId = `${uid}-status`;

  // Initial state derived from job and profile
  const [invoiceData, setInvoiceData] = useState(() => ({
    invoiceNumber: job.invoiceNumber || "#INV-0001",
    issuedDate: job.invoiceDate ? new Date(job.invoiceDate).toLocaleDateString() : new Date().toLocaleDateString(),
    dueDate: job.dueDate ? new Date(job.dueDate).toLocaleDateString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
    status: STATUS_FROM_JOB[normalizeStatus(job)],
    fromName: profile.companyName || profile.name || "DMGE Rate System",
    fromAddress: [profile.companyAddress, profile.companyEmail, profile.companyPhone].filter(Boolean).join("\n")
      || "Your street address\nCity, State ZIP\nyou@example.com\n+1 (000) 000-0000",
    toName: client.name || "Client name / company",
    toAddress: [client.address, client.city, client.email, client.phone].filter(Boolean).join("\n")
      || "Client street address\nCity, State ZIP\nclient@email.com",
    items: buildItems(job),
    discount: 0,
    taxRate: 0,
    notes: job.notes || "Thank you for your business.\nReach out with any questions\nregarding this invoice.",
    paymentDetails: [
      profile.paypalEmail || !profile.paymentInstructions
        ? { key: "PayPal", val: profile.paypalEmail || "pay@dmgeratesystem.com" }
        : { key: "Payment", val: profile.paymentInstructions }
    ],
    footerNote: "questions? hello@dmgeratesystem.com"
  }));

  // A different job replaces the line items (the rest of the sheet keeps what was typed).
  const lastJob = useRef(job);
  useEffect(() => {
    if (lastJob.current === job) return;
    lastJob.current = job;
    setInvoiceData(prev => ({ ...prev, items: buildItems(job) }));
  }, [job]);

  // Recalculate totals
  const subtotal = invoiceData.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const taxAmount = (subtotal - invoiceData.discount) * (invoiceData.taxRate / 100);
  const totalDue = Math.max(0, subtotal - invoiceData.discount + taxAmount);

  // Notify parent of updates
  useEffect(() => {
    if (onUpdate) {
      onUpdate({ ...invoiceData, subtotal, taxAmount, totalDue });
    }
  }, [invoiceData, subtotal, taxAmount, totalDue, onUpdate]);

  const handleFieldChange = (field, value) => {
    setInvoiceData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setInvoiceData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === 'qty' || field === 'rate') {
            const q = parseFloat(String(updated.qty).replace(/[^0-9.-]/g, '')) || 0;
            const r = parseFloat(String(updated.rate).replace(/[^0-9.-]/g, '')) || 0;
            updated.qty = q;
            updated.rate = r;
            updated.amount = q * r;
          }
          return updated;
        }
        return item;
      });
      return { ...prev, items: newItems };
    });
  };

  const addRow = () => {
    const newItem = {
      id: "new-" + Date.now(),
      desc: "Service / Project Name",
      note: "Brief description",
      qty: 1,
      rate: 0,
      amount: 0
    };
    setInvoiceData(prev => ({ ...prev, items: [...prev.items, newItem] }));
  };

  const removeRow = (id) => {
    if (invoiceData.items.length <= 1) return;
    setInvoiceData(prev => ({ ...prev, items: prev.items.filter(item => item.id !== id) }));
  };

  const setPayment = (idx, field, value) => {
    setInvoiceData(prev => ({
      ...prev,
      paymentDetails: prev.paymentDetails.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    }));
  };

  const branding = profile.branding || {};
  const brandName = (branding.companyName || "").trim() || "DMGE Rate System";
  const onlyOne = invoiceData.items.length <= 1;

  return (
    <div className="iv-sheet">
      <div className="iv-sheet-bar" aria-hidden="true" />

      <header className="iv-top">
        <div className="iv-brand">
          {branding.logoBase64
            ? <img className="iv-logo" src={branding.logoBase64} alt="" />
            : <Mark size={40} />}
          <span className="iv-brand-name">{brandName}</span>
        </div>
        <div className="iv-docname">
          <h2 className="iv-title">Invoice</h2>
          <p className="iv-hint"><IconEdit size={14} /> Every field on this sheet is editable</p>
        </div>
      </header>

      <section className="iv-meta" aria-label="Invoice details">
        <label className="iv-meta-item">
          <span className="iv-label">Invoice no.</span>
          <input className="iv-input iv-input--mono" value={invoiceData.invoiceNumber} onChange={e => handleFieldChange("invoiceNumber", e.target.value)} />
        </label>
        <label className="iv-meta-item">
          <span className="iv-label">Issued</span>
          <input className="iv-input iv-input--mono" value={invoiceData.issuedDate} onChange={e => handleFieldChange("issuedDate", e.target.value)} />
        </label>
        <label className="iv-meta-item">
          <span className="iv-label">Due</span>
          <input className="iv-input iv-input--mono" value={invoiceData.dueDate} onChange={e => handleFieldChange("dueDate", e.target.value)} />
        </label>
        <label className="iv-meta-item iv-meta-item--status" data-tone={statusTone(invoiceData.status)}>
          <span className="iv-label">Status</span>
          <input className="iv-input iv-input--status" list={statusListId} value={invoiceData.status} onChange={e => handleFieldChange("status", e.target.value)} />
          <datalist id={statusListId}>
            <option value="UNPAID" />
            <option value="SENT" />
            <option value="PAID" />
            <option value="OVERDUE" />
            <option value="DRAFT" />
          </datalist>
        </label>
      </section>

      <section className="iv-parties">
        <div className="iv-party">
          <p className="iv-label">From</p>
          <TextField className="iv-input--name" label="From: name" value={invoiceData.fromName} onChange={v => handleFieldChange("fromName", v)} />
          <TextField className="iv-input--block" label="From: address and contact" value={invoiceData.fromAddress} onChange={v => handleFieldChange("fromAddress", v)} />
        </div>
        <div className="iv-party">
          <p className="iv-label">Billed to</p>
          <TextField className="iv-input--name" label="Billed to: name" value={invoiceData.toName} onChange={v => handleFieldChange("toName", v)} />
          <TextField className="iv-input--block" label="Billed to: address and contact" value={invoiceData.toAddress} onChange={v => handleFieldChange("toAddress", v)} />
        </div>
      </section>

      <section className="iv-items" aria-label="Services">
        <p className="iv-label iv-label--section">Services</p>
        <div className="iv-items-head" aria-hidden="true">
          <span>Description</span>
          <span className="iv-r">Qty</span>
          <span className="iv-r">Rate</span>
          <span className="iv-r">Amount</span>
          <span />
        </div>
        <ul className="iv-item-list">
          {invoiceData.items.map((item, i) => (
            <li className="iv-item" key={item.id}>
              <div className="iv-cell iv-cell--desc">
                <TextField className="iv-input--desc" label={`Line ${i + 1}: description`} value={item.desc} onChange={v => handleItemChange(item.id, "desc", v)} />
                <TextField className="iv-input--note" label={`Line ${i + 1}: note`} value={item.note} onChange={v => handleItemChange(item.id, "note", v)} placeholder="Add a note" />
              </div>
              <div className="iv-cell iv-cell--qty">
                <span className="iv-cell-label" aria-hidden="true">Qty</span>
                <NumField label={`Line ${i + 1}: quantity`} value={item.qty} onCommit={v => handleItemChange(item.id, "qty", v)} />
              </div>
              <div className="iv-cell iv-cell--rate">
                <span className="iv-cell-label" aria-hidden="true">Rate</span>
                <NumField label={`Line ${i + 1}: rate in dollars`} prefix="$" value={item.rate} onCommit={v => handleItemChange(item.id, "rate", v)} />
              </div>
              <div className="iv-cell iv-cell--amt">
                <span className="iv-cell-label" aria-hidden="true">Amount</span>
                <output className="iv-amt" aria-label={`Line ${i + 1}: amount`}>{money(item.amount)}</output>
              </div>
              <button
                type="button"
                className="iv-del"
                onClick={() => removeRow(item.id)}
                disabled={onlyOne}
                aria-label={`Remove line ${i + 1}`}
                title={onlyOne ? "An invoice needs at least one line" : "Remove this line"}
              >
                <IconCross size={16} />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="iv-add" onClick={addRow}><IconPlus size={16} /> Add line item</button>
      </section>

      <section className="iv-totals" aria-label="Totals">
        <div className="iv-trow">
          <span className="iv-trow-key">Subtotal</span>
          <span className="iv-trow-val">{money(subtotal)}</span>
        </div>
        <div className="iv-trow">
          <label className="iv-trow-key" htmlFor={`${uid}-discount`}>Discount</label>
          <span className="iv-trow-val iv-trow-val--edit">
            <NumField id={`${uid}-discount`} label="Discount in dollars" prefix="−$" value={invoiceData.discount} onCommit={v => handleFieldChange("discount", parseFloat(v) || 0)} />
          </span>
        </div>
        <div className="iv-trow">
          <span className="iv-trow-key">
            <label htmlFor={`${uid}-tax`}>Tax</label>
            <NumField id={`${uid}-tax`} label="Tax rate in percent" value={invoiceData.taxRate} onCommit={v => handleFieldChange("taxRate", parseFloat(v) || 0)} />
            <span className="iv-affix" aria-hidden="true">%</span>
          </span>
          <span className="iv-trow-val">{money(taxAmount)}</span>
        </div>
        <div className="iv-due">
          <span className="iv-due-label">Total due</span>
          <output className="iv-due-amount">{money(totalDue)}</output>
        </div>
      </section>

      <section className="iv-foot">
        <div>
          <p className="iv-label">Notes</p>
          <TextField className="iv-input--block iv-input--notes" label="Notes" value={invoiceData.notes} onChange={v => handleFieldChange("notes", v)} />
        </div>
        <div>
          <p className="iv-label">Payment details</p>
          {invoiceData.paymentDetails.map((pay, idx) => (
            <div className="iv-pay" key={idx}>
              <input className="iv-input iv-input--paykey" aria-label={`Payment method ${idx + 1}`} value={pay.key} onChange={e => setPayment(idx, "key", e.target.value)} />
              <TextField className="iv-input--payval" label={`Payment details ${idx + 1}`} value={pay.val} onChange={v => setPayment(idx, "val", v)} />
            </div>
          ))}
        </div>
      </section>

      <footer className="iv-page-foot">Made with DMGE</footer>
    </div>
  );
}
