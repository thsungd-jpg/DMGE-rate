import React from "react";
import "../styles/kit.css";

// Screen kit: the shared building blocks every in-app screen uses, so they feel like one product.
// Sizing is px/clamp (never rem) so it is independent of the legacy root font-size.

/** Page container + editorial header. `title` may contain <em> for an italic accent word. */
export function Screen({ eyebrow, title, subtitle, actions, children, wide = false, className = "" }) {
  return (
    <section className={"kit-screen " + (wide ? "kit-screen--wide " : "") + className}>
      {(title || eyebrow) && (
        <header className="kit-head">
          <div className="kit-head-text">
            {eyebrow && <p className="kit-eyebrow">{eyebrow}</p>}
            {title && <h1 className="kit-title">{title}</h1>}
            {subtitle && <p className="kit-sub">{subtitle}</p>}
          </div>
          {actions && <div className="kit-head-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/** Frosted paper card. tone: "paper" | "glass" | "pink" | "blue" | "mint" | "butter" | "lilac" */
export function Card({ children, tone = "paper", pad = "md", className = "", as: As = "div", ...rest }) {
  return (
    <As className={`kit-card kit-card--${tone} kit-pad-${pad} ${className}`} {...rest}>
      {children}
    </As>
  );
}

/** Section heading inside a screen. */
export function SectionTitle({ children, aside }) {
  return (
    <div className="kit-sectiontitle">
      <h2>{children}</h2>
      {aside && <div className="kit-sectiontitle-aside">{aside}</div>}
    </div>
  );
}

/** Big number with a label (serif numerals). */
export function Stat({ label, value, hint, tone }) {
  return (
    <div className={"kit-stat" + (tone ? ` kit-stat--${tone}` : "")}>
      <span className="kit-stat-label">{label}</span>
      <b className="kit-stat-value">{value}</b>
      {hint && <span className="kit-stat-hint">{hint}</span>}
    </div>
  );
}

/** Small status / tag pill. tone: pink | blue | mint | butter | lilac | ink | danger */
export function Pill({ children, tone = "ink", dot = false }) {
  return (
    <span className={`kit-pill kit-pill--${tone}`}>
      {dot && <i />}
      {children}
    </span>
  );
}

/** Label + control + optional hint/error, stacked. */
export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div className="kit-field">
      {label && <label className="kit-field-label" htmlFor={htmlFor}>{label}</label>}
      {children}
      {hint && !error && <span className="kit-field-hint">{hint}</span>}
      {error && <span className="kit-field-error" role="alert">{error}</span>}
    </div>
  );
}

/** Empty state with an optional call to action. */
export function EmptyState({ icon, title, body, action }) {
  return (
    <div className="kit-empty">
      {icon && <div className="kit-empty-icon">{icon}</div>}
      <h3>{title}</h3>
      {body && <p>{body}</p>}
      {action}
    </div>
  );
}

/** Segmented control / filter tabs. options: [{ value, label, count? }] */
export function Segmented({ options, value, onChange, ariaLabel }) {
  return (
    <div className="kit-seg" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o.value} type="button" className="kit-seg-btn" aria-pressed={o.value === value} onClick={() => onChange(o.value)}>
          {o.label}
          {o.count != null && <span className="kit-seg-count">{o.count}</span>}
        </button>
      ))}
    </div>
  );
}

/** Clickable list row (jobs, clients, templates). */
export function Row({ title, meta, aside, onClick, leading, children, tone }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag type={onClick ? "button" : undefined} className={"kit-row" + (tone ? ` kit-row--${tone}` : "")} onClick={onClick}>
      {leading && <span className="kit-row-lead">{leading}</span>}
      <span className="kit-row-main">
        <span className="kit-row-title">{title}</span>
        {meta && <span className="kit-row-meta">{meta}</span>}
        {children}
      </span>
      {aside && <span className="kit-row-aside">{aside}</span>}
    </Tag>
  );
}

/** Round icon-only button. */
export function IconBtn({ label, children, onClick, tone = "paper", size = 40, ...rest }) {
  return (
    <button type="button" className={`kit-iconbtn kit-iconbtn--${tone}`} aria-label={label} title={label} onClick={onClick} style={{ width: size, height: size }} {...rest}>
      {children}
    </button>
  );
}

/** Responsive grid helper. */
export function Grid({ min = 260, gap = 16, children, className = "" }) {
  return (
    <div className={"kit-grid " + className} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(min(${min}px, 100%), 1fr))`, gap }}>
      {children}
    </div>
  );
}
