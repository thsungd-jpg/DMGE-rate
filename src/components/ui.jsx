import React, { useState, useRef, useEffect } from "react";
import { IconEdit, IconCross } from "../icons";
import { PALETTE as P } from "../styles/palette";
import { fill, textOn, edge, halo } from "../styles/tone";

// ─────────────────────────────────────────────
// SORBET INK PRIMITIVES
// Same exports + prop signatures as the old pixel components. Legacy hex colors passed by existing
// call sites are translated through ../styles/tone; styling lives in src/styles/base.css.
// ─────────────────────────────────────────────

// soft pink glow under cards (what the old default shadow colour mapped to)
const PINK_HALO = "color-mix(in srgb, var(--pink) 80%, transparent)";

function Chevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 6l4.5 4.5L12.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PBox({ children, style = {}, bg = "var(--paper)", borderColor = "var(--line)", shadowColor = PINK_HALO, onClick, glow = false, className = "", ...rest }) {
  return (
    <div
      onClick={onClick}
      data-clickable={onClick ? "" : undefined}
      className={"lq-box " + (glow ? "lq-glow " : "") + className}
      style={{ "--lq-bg": fill(bg), "--lq-edge": edge(borderColor), "--lq-halo": halo(shadowColor), ...style, position: "relative", zIndex: 1 }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function PBtn({ children, onClick, color = "var(--blue)", full = false, small = false, disabled = false, style = {}, glow = false, className = "", type, ...rest }) {
  // `type` is intentionally left undefined unless passed: Auth relies on PBtn acting as a form submit button.
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={"lq-btn " + (small ? "lq-btn--sm " : "") + (glow ? "lq-glow " : "") + className}
      style={{ "--lq-fill": fill(color), width: full ? "100%" : undefined, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// A child with autoFocus steals focus before PModal's effect runs, so remember the last element focused outside any
// dialog and return to it on close.
let lastOutsideFocus = null;
if (typeof document !== "undefined") {
  document.addEventListener("focusin", (e) => {
    if (e.target instanceof HTMLElement && !e.target.closest(".lq-overlay")) lastOutsideFocus = e.target;
  });
}

export function PModal({ isOpen, onClose, title, children }) {
  const overlayRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // parents pass a fresh onClose each render; the effect must not restart (it would lose the opener)
  const titleId = useRef(`lq-modal-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    if (!isOpen) return undefined;
    const opener = lastOutsideFocus || document.activeElement;
    const overlay = overlayRef.current;
    const items = () => [...(overlay?.querySelectorAll(FOCUSABLE) || [])].filter((el) => el.offsetParent !== null || el === document.activeElement);

    // move focus into the dialog unless a child (autoFocus) already claimed it
    if (overlay && !overlay.contains(document.activeElement)) {
      const list = items();
      // skip the close button so the first real control (or the dialog itself) gets focus
      (list.find((el) => !el.hasAttribute("data-modal-close")) || list[0] || overlay.querySelector('[role="dialog"]'))?.focus();
    }

    const onKey = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); onCloseRef.current?.(); return; }
      if (e.key !== "Tab") return;
      const list = items();
      if (!list.length) { e.preventDefault(); return; }
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // after the dialog is gone: put focus back where the user was
      if (opener && typeof opener.focus === "function") setTimeout(() => { if (document.contains(opener)) opener.focus(); }, 0);
    };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay lq-overlay" ref={overlayRef}>
      <PBox
        role="dialog"
        aria-modal="true"
        aria-labelledby={typeof title === "string" ? undefined : titleId}
        aria-label={typeof title === "string" ? title : undefined}
        tabIndex={-1}
        style={{ maxWidth: "min(700px, calc(100vw - 16px))", width: "100%", maxHeight: "95vh", overflowY: "auto", boxShadow: "var(--sh-3)" }}
        bg="var(--paper)"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div className="lq-modal-title" id={titleId}>{title}</div>
          <PBtn small color="var(--pink)" onClick={onClose} aria-label="Close" data-modal-close="" style={{ minWidth: 44, minHeight: 44, padding: "7px 12px" }}><IconCross size={16} /></PBtn>
        </div>
        {children}
      </PBox>
    </div>
  );
}

export function PLbl({ children, accent, style = {} }) {
  return <div className="lq-lbl" style={{ color: accent ? textOn(accent) : "var(--ink-2)", ...style }}>{children}</div>;
}

export function PInput({ value, onChange, placeholder, style = {}, type = "text", min, step, ...rest }) {
  return (
    <input
      {...rest}
      className="lq-input"
      type={type}
      value={value}
      onChange={e => {
        if (type === "number") {
          onChange(e.target.value === "" ? "" : Number(e.target.value));
        } else {
          onChange(e.target.value);
        }
      }}
      placeholder={placeholder}
      min={min}
      step={step}
      style={style}
    />
  );
}

export function PStepper({ value, onChange, min = 0, step = 1, suffix = "" }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  return (
    <div className="lq-stepper">
      <PBtn small className="lq-stepper-btn" color="var(--pink)" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - step))}>
        −
      </PBtn>
      <div
        className="lq-stepper-value"
        onClick={() => setEditing(true)}
        role="spinbutton"
        aria-valuenow={Number(value) || 0}
        aria-valuemin={min}
        tabIndex={editing ? -1 : 0}
        onKeyDown={e => { if (!editing && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); setEditing(true); } }}
      >
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={value}
            onChange={e => onChange(e.target.value === "" ? "" : Number(e.target.value))}
            onBlur={() => setEditing(false)}
            onKeyDown={e => e.key === "Enter" && setEditing(false)}
          />
        ) : (
          <>{value}{suffix}</>
        )}
      </div>
      <PBtn small className="lq-stepper-btn" color="var(--butter)" aria-label="Increase" onClick={() => onChange(value + step)}>
        +
      </PBtn>
    </div>
  );
}

export function PSelect({ label, value, options, onChange, iconType = "cat", style = {}, smallBtnStyle = false, ...rest }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listId = useRef(`lq-list-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentValue = options.find(o => o.value === value) || options[0];
  const optionEls = () => [...(menuRef.current?.querySelectorAll('[role="option"]') || [])];

  // when the menu opens, focus the selected option (or the first) so arrow keys work immediately
  useEffect(() => {
    if (!isOpen) return;
    const els = optionEls();
    (els.find((el) => el.getAttribute("aria-selected") === "true") || els[0])?.focus();
  }, [isOpen]);

  const close = (refocus = true) => { setIsOpen(false); if (refocus) triggerRef.current?.focus(); };
  const choose = (opt) => { onChange(opt.value); close(); };

  const onTriggerKey = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); setIsOpen(true); }
  };
  const onMenuKey = (e) => {
    const els = optionEls();
    const i = els.indexOf(document.activeElement);
    if (e.key === "ArrowDown") { e.preventDefault(); els[Math.min(els.length - 1, i + 1)]?.focus(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); els[Math.max(0, i - 1)]?.focus(); }
    else if (e.key === "Home") { e.preventDefault(); els[0]?.focus(); }
    else if (e.key === "End") { e.preventDefault(); els[els.length - 1]?.focus(); }
    else if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); }
    else if (e.key === "Tab") { setIsOpen(false); }
    else if (e.key.length === 1 && /\S/.test(e.key)) {
      // typeahead: jump to the next option starting with the typed letter
      const k = e.key.toLowerCase();
      const ordered = [...els.slice(i + 1), ...els.slice(0, i + 1)];
      ordered.find((el) => el.textContent.trim().toLowerCase().startsWith(k))?.focus();
    }
  };

  return (
    <div ref={ref} className="lq-select" data-open={isOpen ? "" : undefined} style={style}>
      <button
        ref={triggerRef}
        type="button"
        className={"lq-select-trigger" + (smallBtnStyle ? " lq-select-trigger--lg" : "")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? listId : undefined}
        aria-label={label ? `${label}: ${currentValue.label}` : rest["aria-label"]}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={onTriggerKey}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentValue.label}</span>
        <Chevron className="lq-select-chevron" />
      </button>

      {isOpen && (
        <div className="lq-select-menu" role="listbox" id={listId} ref={menuRef} aria-label={label || rest["aria-label"]} onKeyDown={onMenuKey}>
          {options.map((opt, i) => (
            <div
              key={i}
              role="option"
              tabIndex={-1}
              aria-selected={value === opt.value}
              className="lq-option"
              onClick={() => choose(opt)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(opt); } }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PCollapsible({ title, accent = "var(--ink)", children, defaultOpen = false, bg = "var(--butter)", activeBg, collapsedInfo = "", collapsedColor = "var(--butter)", tooltip = null, modelShadow = PINK_HALO, modelColor }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const toggle = () => setIsOpen(o => !o);
  return (
    <div className="lq-collapse" data-open={isOpen ? "" : undefined}>
      <PBox
        onClick={toggle}
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        title={tooltip || undefined}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
        bg={isOpen ? (activeBg || bg) : bg}
        borderColor="var(--line)"
        shadowColor={isOpen ? modelShadow : PINK_HALO}
        className="lq-collapse-head"
        style={{ padding: "12px 18px" }}
      >
        <div className="lq-collapse-title" style={{ color: textOn(accent) }}>{title}</div>
        <Chevron className="lq-collapse-chevron" />
      </PBox>
      {!isOpen && collapsedInfo && (
        <div className="lq-collapse-info" style={{ "--lq-bg": modelColor ? fill(modelColor) : "var(--paper)" }}>
          {collapsedInfo}
        </div>
      )}
      {isOpen && (
        <div className="lq-collapse-body">
          <PBox shadowColor={modelShadow} bg={modelColor || "var(--paper)"} style={{ padding: "16px 24px 24px 16px" }}>
            {children}
          </PBox>
        </div>
      )}
    </div>
  );
}

export function MatChip({ mat, qty, onAdd, onRemove, onCostChange, accent, bg }) {
  const [editingCost, setEditingCost] = useState(false);
  const costInputRef = useRef(null);

  useEffect(() => { if (editingCost) costInputRef.current?.focus(); }, [editingCost]);

  const handleCostChange = (newCost) => {
    onCostChange?.(mat.name, newCost);
    setEditingCost(false);
  };

  const active = qty > 0;
  return (
    <div
      className="lq-chip"
      data-active={active ? "" : undefined}
      style={active ? { "--lq-bg": fill(bg || "var(--pink-soft)"), "--lq-edge": edge(accent || "var(--pink)") } : undefined}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="lq-chip-name">{mat.name}</div>
        {editingCost ? (
          <div className="lq-chip-cost">
            <input
              ref={costInputRef}
              type="number"
              aria-label={`Cost of ${mat.name} each`}
              defaultValue={mat.cost}
              onBlur={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => { if (e.key === "Enter") handleCostChange(parseFloat(e.target.value) || 0); else if (e.key === "Escape") { e.stopPropagation(); setEditingCost(false); } }}
            />
          </div>
        ) : (
          <button type="button" className="lq-chip-cost" aria-label={`Edit cost of ${mat.name}, $${mat.cost} each`} onClick={() => setEditingCost(true)}>
            ${mat.cost} ea.
            <IconEdit size={14} color={P.ink3} />
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {active && <>
          <PBtn small aria-label={`Remove one ${mat.name}`} onClick={(e) => { e.stopPropagation(); onRemove(); }} color="var(--pink-soft)" style={{ minWidth: 36, padding: "7px 12px" }}>−</PBtn>
          <div className="lq-chip-qty">{qty}</div>
        </>}
        <PBtn small aria-label={`Add one ${mat.name}`} onClick={(e) => { e.stopPropagation(); onAdd(); }} color="var(--mint)" style={{ minWidth: 36, padding: "7px 12px" }}>+</PBtn>
      </div>
    </div>
  );
}

export function OptionGrid({ options, value, onChange, cols = 4, activeColor, activeShadow }) {
  return (
    <div className="lq-optgrid">
      {Object.entries(options).map(([k, v]) => {
        const active = k === value;
        return (
          <button
            key={k}
            type="button"
            className="lq-opt"
            aria-pressed={active}
            onClick={() => onChange(k)}
            style={active ? { "--lq-fill": fill(activeColor || "var(--butter)"), "--lq-edge": edge(activeShadow || "var(--butter)") } : undefined}
          >
            <span style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
            <span className="lq-opt-mult">×{v}</span>
          </button>
        );
      })}
    </div>
  );
}
