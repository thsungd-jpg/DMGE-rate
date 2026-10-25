import React from "react";
import { Card } from "../../components/kit";

/** One calm settings section: tinted icon, serif title, short description, optional aside (a pill or button). */
export default function SettingsCard({ id, icon, iconTone = "butter", title, description, aside, danger = false, children }) {
  return (
    <Card as="section" id={id} aria-labelledby={`${id}-title`} pad="lg" className={"prof-card" + (danger ? " prof-card--danger" : "")}>
      <header className="prof-card-head">
        {icon && <span className="prof-card-icon" data-tone={iconTone} aria-hidden="true">{icon}</span>}
        <div className="prof-card-title">
          <h2 id={`${id}-title`}>{title}</h2>
          {description && <p>{description}</p>}
        </div>
        {aside && <div className="prof-card-aside">{aside}</div>}
      </header>
      {children}
    </Card>
  );
}

/** Label + control group for controls that cannot take a <label for> (steppers, swatch rows). */
export function Group({ id, label, hint, children }) {
  return (
    <div className="kit-field" role="group" aria-labelledby={id}>
      <span className="kit-field-label" id={id}>{label}</span>
      {children}
      {hint && <span className="kit-field-hint">{hint}</span>}
    </div>
  );
}
