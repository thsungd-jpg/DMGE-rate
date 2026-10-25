import React from "react";
import { Card, IconBtn, Pill, Stat } from "../../components/kit";
import { PBtn } from "../../components/ui";
import { IconCalc, IconCopy, IconDelete, IconEdit, getCategoryIcon } from "../../icons";
import { fmtDate, money, toneFor } from "./format";

export default function TemplateCard({ t, index = 0, onUse, onDuplicate, onEdit, onDelete }) {
  const Icon = getCategoryIcon(t.category || "");
  const tone = toneFor(t.category);
  const f = t.form || {};
  const used = t.usageCount || 0;
  const created = fmtDate(t.createdAt);
  const materials = (t.materials || []).length;
  const units = Number(f.units);

  return (
    <Card as="article" className="tpl-card" style={{ "--i": Math.min(index, 8) }}>
      <div className="tpl-card-top">
        <span className={`tpl-badge tpl-badge--${tone}`} aria-hidden="true"><Icon size={22} /></span>
        <span className="tpl-cat">{t.category}</span>
      </div>

      <h2 className="tpl-name">{t.name}</h2>
      <p className="tpl-role">{t.role}</p>

      <Stat label="Base rate" value={money(t.baseRate)} hint={t.model} />

      <ul className="tpl-pills" aria-label="Key settings">
        {units > 0 && <li><Pill tone="ink">{units} {units === 1 ? "unit" : "units"}</Pill></li>}
        {f.complexity && <li><Pill tone="blue">{f.complexity}</Pill></li>}
        {f.usage && <li><Pill tone="lilac">{f.usage}</Pill></li>}
        {f.clientType && <li><Pill tone="mint">{f.clientType}</Pill></li>}
        {f.rush && <li><Pill tone="pink" dot>Rush</Pill></li>}
        {materials > 0 && <li><Pill tone="butter">{materials} {materials === 1 ? "material" : "materials"}</Pill></li>}
      </ul>

      {t.notes && <p className="tpl-notes">“{t.notes}”</p>}

      <div className="tpl-card-foot">
        <div className="tpl-foot-row">
          <p className="tpl-meta">
            <span>{used > 0 ? `Used ${used} ${used === 1 ? "time" : "times"}` : "Not used yet"}</span>
            {created && <span>Saved {created}</span>}
          </p>
          <div className="tpl-actions">
            <IconBtn label={`Duplicate ${t.name}`} size={44} onClick={() => onDuplicate(t)}><IconCopy size={18} /></IconBtn>
            <IconBtn label={`Edit ${t.name}`} size={44} onClick={() => onEdit(t)}><IconEdit size={18} /></IconBtn>
            <IconBtn label={`Delete ${t.name}`} size={44} data-danger="" onClick={() => onDelete(t.id)}><IconDelete size={18} /></IconBtn>
          </div>
        </div>
        <PBtn full color="var(--butter)" onClick={() => onUse(t)} aria-label={`Use template ${t.name}`}>
          <IconCalc size={18} /> Use template
        </PBtn>
      </div>
    </Card>
  );
}
