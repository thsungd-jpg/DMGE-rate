import React, { useState } from "react";
import { Chip, Tag } from "../../world/controls";
import { IconEdit, IconPlus } from "../../icons";

/** The optional details: a row of paper tags; opening one lays its note out below. */
export default function ExtrasStation({ form, set, patch, materialSummary, materialsCost, mats, customMaterials, matPriceOverrides, matQtys, setMatQtys, setMatPriceOverrides, onAddCustom }) {
  const [open, setOpen] = useState(null);
  const [costOf, setCostOf] = useState(null);
  const toggle = (id) => setOpen((o) => (o === id ? null : id));
  const num = (e) => (e.target.value === "" ? "" : Number(e.target.value));
  const all = [...mats, ...customMaterials];

  const tags = [
    { id: "revisions", label: "Revisions", tone: "butter", value: `${form.revisions} revisions`, set: Number(form.revisions) !== 1 },
    { id: "travel", label: "Commute", tone: "blue", value: `$${(Number(form.travelExpense) || 0).toFixed(2)}`, set: Number(form.travelExpense) > 0 },
    { id: "rush", label: "Rush", tone: "pink", value: form.rush ? "Yes (+30%)" : "No", set: !!form.rush },
    { id: "buffer", label: "Buffer", tone: "lilac", value: form.buffer ? `+${form.buffer}%` : "None", set: Number(form.buffer) > 0 },
    { id: "platform", label: "Platform fee", tone: "mint", value: form.platformFee ? `${form.platformFee}%` : "None", set: Number(form.platformFee) > 0 },
    { id: "supplies", label: "Supplies", tone: "pink", value: materialSummary, set: materialsCost > 0 },
    { id: "notes", label: "Invoice notes", tone: "butter", value: form.notes ? "Has notes" : "None", set: !!form.notes },
  ];

  return (
    <div className="qw-group">
      <div className="qw-tags" role="group" aria-label="Extras">
        {tags.map((t) => (
          <Tag key={t.id} tone={t.tone} label={t.label} value={t.value} set={t.set} open={open === t.id} aria-controls={`qw-x-${t.id}`} onClick={() => toggle(t.id)} />
        ))}
      </div>

      {open && (
        <div className="qw-paper" id={`qw-x-${open}`} role="region" aria-label={tags.find((t) => t.id === open)?.label}>
          {open === "revisions" && (
            <>
              <label className="qw-paper-lab" htmlFor="qw-rev">Included revisions</label>
              <input id="qw-rev" className="qw-field" type="number" min={0} step={1} placeholder="0" value={form.revisions} onChange={(e) => set("revisions")(num(e))} />
              <span className="qw-paper-small">0 revisions is a discount; 3 or more is a premium.</span>
            </>
          )}
          {open === "travel" && (
            <>
              <label className="qw-paper-lab" htmlFor="qw-trv">Travel cost ($)</label>
              <input id="qw-trv" className="qw-field" type="number" min={0} placeholder="0.00" value={form.travelExpense || 0} onChange={(e) => patch({ travelExpense: num(e) })} />
              <span className="qw-paper-small">Direct travel expenses, added to the quote.</span>
            </>
          )}
          {open === "rush" && (
            <>
              <span className="qw-paper-lab" id="qw-rush-l">Expedited delivery</span>
              <div className="qw-paper-row" role="group" aria-labelledby="qw-rush-l">
                <Chip className="qw-mini" tone="pink" on={!form.rush} onClick={() => patch({ rush: false })}>Standard</Chip>
                <Chip className="qw-mini" tone="pink" on={!!form.rush} onClick={() => patch({ rush: true })}>Rush +30%</Chip>
              </div>
            </>
          )}
          {open === "buffer" && (
            <>
              <span className="qw-paper-lab" id="qw-buf-l">Contingency</span>
              <div className="qw-paper-row" role="group" aria-labelledby="qw-buf-l">
                {[0, 10, 15, 25].map((n) => <Chip key={n} className="qw-mini" tone="lilac" on={(form.buffer || 0) === n} onClick={() => patch({ buffer: n })}>{n ? `+${n}%` : "None"}</Chip>)}
              </div>
              <span className="qw-paper-small">Most projects need 10 to 25% for surprises, scope creep and slow payers.</span>
            </>
          )}
          {open === "platform" && (
            <>
              <span className="qw-paper-lab" id="qw-fee-l">Common fees</span>
              <div className="qw-paper-row" role="group" aria-labelledby="qw-fee-l">
                {[{ v: 0, l: "None" }, { v: 2.9, l: "Stripe 2.9%" }, { v: 3.5, l: "PayPal 3.5%" }].map((o) => (
                  <Chip key={o.v} className="qw-mini" tone="mint" on={(Number(form.platformFee) || 0) === o.v} onClick={() => patch({ platformFee: o.v })}>{o.l}</Chip>
                ))}
              </div>
              <label className="qw-paper-lab" htmlFor="qw-fee" style={{ marginTop: 14 }}>Fee (%)</label>
              <input id="qw-fee" className="qw-field" type="number" min={0} placeholder="0" value={form.platformFee || 0} onChange={(e) => patch({ platformFee: num(e) })} />
              <span className="qw-paper-small">Add the processor's cut so you are not paying it out of your fee.</span>
            </>
          )}
          {open === "supplies" && (
            <>
              {all.map((mat) => {
                const cost = matPriceOverrides[mat.name] ?? mat.cost, q = matQtys[mat.name] || 0;
                return (
                  <div className="qw-supply" key={mat.name}>
                    <div>
                      <div className="qw-supply-name">{mat.name}</div>
                      {costOf === mat.name ? (
                        <input
                          className="qw-field qw-supply-cost-input" type="number" min={0} aria-label={`Cost of ${mat.name} each`} defaultValue={cost} autoFocus
                          onBlur={(e) => { setMatPriceOverrides((o) => ({ ...o, [mat.name]: parseFloat(e.target.value) || 0 })); setCostOf(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); else if (e.key === "Escape") { e.stopPropagation(); setCostOf(null); } }}
                        />
                      ) : (
                        <button type="button" className="qw-supply-cost" aria-label={`Edit cost of ${mat.name}, $${cost} each`} onClick={() => setCostOf(mat.name)}>${cost} ea. <IconEdit size={13} /></button>
                      )}
                    </div>
                    <div className="qw-supply-q">
                      {q > 0 && <>
                        <button type="button" className="qw-sq qw-tone-pink" aria-label={`Remove one ${mat.name}`} onClick={() => setMatQtys((m) => ({ ...m, [mat.name]: Math.max(0, (m[mat.name] || 0) - 1) }))}>−</button>
                        <output aria-label={`${mat.name} quantity`}>{q}</output>
                      </>}
                      <button type="button" className="qw-sq qw-tone-mint" aria-label={`Add one ${mat.name}`} onClick={() => setMatQtys((m) => ({ ...m, [mat.name]: (m[mat.name] || 0) + 1 }))}>+</button>
                    </div>
                  </div>
                );
              })}
              <div className="qw-paper-row" style={{ marginTop: 14 }}>
                <button type="button" className="qw-paperbtn" onClick={onAddCustom}><IconPlus size={16} /><span>Add custom item</span></button>
                {materialsCost > 0 && <span className="qw-paper-small" style={{ margin: 0 }}>Supplies subtotal <b>${materialsCost.toFixed(2)}</b></span>}
              </div>
            </>
          )}
          {open === "notes" && (
            <>
              <label className="qw-paper-lab" htmlFor="qw-notes">Job notes</label>
              <textarea id="qw-notes" className="qw-field" placeholder="Specific job details…" value={form.notes} onChange={(e) => patch({ notes: e.target.value })} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
