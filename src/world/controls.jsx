import React, { useId, useState } from "react";
import { IconCheck } from "../icons";

// The world's controls (styles in world.css): little paper pieces on the scene. They are ordinary buttons and inputs underneath, so keyboard,
// screen readers and touch work as they always did; the look is only paint.

/** A choice. `on` is the selected one; `tone` is the colour it is filled with when selected. */
export function Chip({ on = false, tone = "butter", icon, sub, children, className = "", ...rest }) {
  return (
    <button type="button" className={`qw-chip qw-tone-${tone} ${className}`} aria-pressed={on} {...rest}>
      {icon && <span className="qw-chip-ico" aria-hidden="true">{icon}</span>}
      <span className="qw-chip-txt"><b>{children}</b>{sub && <small>{sub}</small>}</span>
      <span className="qw-tick" aria-hidden="true"><IconCheck size={14} strokeWidth={2.6} /></span>
    </button>
  );
}

/**
 * Say what a choice means. `peek(text)` goes on a chip's props: pointing at it or tabbing to it previews its description, and the one picked is always shown.
 * Usage: const [d, peek] = useDescribe(); <Chip {...peek(desc)} /> ... <Desc d={d} selected={{ name, text }} tone="mint" />
 */
export function useDescribe() {
  const [d, setD] = useState(null);
  const peek = (entry) => ({ onMouseEnter: () => setD(entry), onMouseLeave: () => setD(null), onFocus: () => setD(entry), onBlur: () => setD(null) });
  return [d, peek];
}

/** The description line: what you are pointing at, else what is picked. Screen readers hear the picked one when it changes. */
export function Desc({ d, selected, tone = "butter" }) {
  const shown = d || selected;
  return (
    <>
      <p className={`qw-desc qw-tone-${tone}`} aria-hidden="true">{shown && <><b>{shown.name}</b> {shown.text}</>}</p>
      <span className="qw-sr" role="status" aria-live="polite">{selected ? `${selected.name}. ${selected.text}` : ""}</span>
    </>
  );
}

/** A labelled set of choices, with an optional line of help under it. */
export function Group({ label, hint, children }) {
  const id = useId();
  return (
    <div className="qw-group" role="group" aria-labelledby={label ? id : undefined}>
      {label && <p className="qw-lab" id={id}>{label}</p>}
      {children}
      {hint && <p className="qw-small">{hint}</p>}
    </div>
  );
}

export function Row({ children, className = "" }) {
  return <div className={`qw-row ${className}`}>{children}</div>;
}

/** Minus, a number you can also type into, plus. */
export function Stepper({ value, onChange, min = 0, step = 1, label }) {
  const n = Number(value) || 0;
  const nudge = (d) => onChange(Math.max(min, Math.round((n + d) * 100) / 100));
  return (
    <div className="qw-step">
      <button type="button" className="qw-round qw-tone-pink" aria-label={`Decrease ${label}`} onClick={() => nudge(-step)}>−</button>
      <input
        className="qw-num" type="number" inputMode="decimal" aria-label={label} value={value} min={min} step={step}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
      <button type="button" className="qw-round qw-tone-butter" aria-label={`Increase ${label}`} onClick={() => nudge(step)}>+</button>
    </div>
  );
}

/** A dollar amount you type: a "$" on the scene and the number on a paper tile. Empty stays empty. */
export function Money({ value, onChange, label, min = 0, placeholder = "0" }) {
  return (
    <label className="qw-money">
      <span className="qw-money-sign" aria-hidden="true">$</span>
      <input
        className="qw-num qw-num--money" type="number" inputMode="decimal" aria-label={label} value={value ?? ""} min={min} step="any" placeholder={placeholder}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
      />
    </label>
  );
}

/** The big toy button. */
export function Go({ tone = "butter", icon, wide = false, className = "", children, ...rest }) {
  return (
    <button type="button" className={`qw-go qw-tone-${tone} ${wide ? "qw-go--wide" : ""} ${className}`} {...rest}>
      {children}{icon}
    </button>
  );
}

/** A tag for an optional detail: shows its name and current value, and opens its note. */
export function Tag({ open, set, tone = "butter", label, value, ...rest }) {
  return (
    <button type="button" className={`qw-tag qw-tone-${tone} ${set ? "is-set" : ""}`} aria-expanded={open} {...rest}>
      <b>{label}</b>
      <small>{value}</small>
    </button>
  );
}
