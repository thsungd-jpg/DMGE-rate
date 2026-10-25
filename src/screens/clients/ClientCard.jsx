import React from "react";
import { Card, IconBtn, Pill } from "../../components/kit";
import { IconDelete } from "../../icons";
import { initials, money, multiplierLabel, multiplierTone, toneFor } from "./format";

/** One client in the list. The card body opens the detail view; delete is a separate button beside it. */
export default function ClientCard({ client: c, count, total, index = 0, onOpen, onDelete }) {
  return (
    <Card as="article" pad="none" className="cli-card" style={{ "--i": Math.min(index, 8) }}>
      <button type="button" className="cli-card-open" onClick={() => onOpen(c)} aria-label={`Open ${c.name}`}>
        <span className="cli-card-top">
          <span className={`cli-avatar cli-avatar--${toneFor(c.name)}`} aria-hidden="true">{initials(c.name)}</span>
          <span className="cli-card-id">
            <span className="cli-card-name">{c.name}</span>
            <span className="cli-card-sub">{c.email || "No email yet"}</span>
          </span>
          <Pill tone={multiplierTone(c.rateMultiplier)}>{multiplierLabel(c.rateMultiplier)}</Pill>
        </span>
        <span className="cli-card-stats">
          <span><b>{count}</b><i>{count === 1 ? "quote" : "quotes"}</i></span>
          <span><b>{money(total)}</b><i>billed</i></span>
        </span>
      </button>
      <div className="cli-card-del">
        <IconBtn label={`Delete ${c.name}`} size={44} data-danger="" onClick={() => onDelete(c.id)}><IconDelete size={18} /></IconBtn>
      </div>
    </Card>
  );
}
