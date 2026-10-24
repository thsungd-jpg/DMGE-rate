import React, { useState, useRef, useEffect } from "react";
import { IconEdit } from "../icons";
import { PALETTE as P } from "../styles/palette";
import { fill, textOn, edge, halo } from "../styles/tone";

// ─────────────────────────────────────────────
// SORBET INK PRIMITIVES
// Same exports + prop signatures as the old pixel components. Legacy hex colors passed by existing
// call sites are translated through ../styles/tone; styling lives in src/styles/base.css.
// ─────────────────────────────────────────────

function Chevron({ className }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3.5 6l4.5 4.5L12.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PBox({ children, style = {}, bg = "#1A1A1A", borderColor = "#FFB347", shadowColor = "#E91E63", onClick, glow = false, className = "", ...rest }) {
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

export function PBtn({ children, onClick, color = "#b5d5f5", full = false, small = false, disabled = false, style = {}, glow = false, className = "", type, ...rest }) {
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

export function PModal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div className="modal-overlay lq-overlay">
      <PBox
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        style={{ maxWidth: "min(50rem, calc(100vw - 1rem))", width: "100%", maxHeight: "95vh", overflowY: "auto", boxShadow: "var(--sh-3)" }}
        bg="#1A1A1A"
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div className="lq-modal-title">{title}</div>
          <PBtn small color="#E91E63" onClick={onClose} aria-label="Close" style={{ minWidth: 36, padding: "7px 12px" }}>✕</PBtn>
        </div>
        {children}
      </PBox>
    </div>
  );
}

export function PLbl({ children, accent = "#FFB34788", style = {} }) {
  return <div className="lq-lbl" style={{ color: textOn(accent), ...style }}>{children}</div>;
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
      <PBtn small className="lq-stepper-btn" color="#E91E63" aria-label="Decrease" onClick={() => onChange(Math.max(min, value - step))}>
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
      <PBtn small className="lq-stepper-btn" color="#FFB347" aria-label="Increase" onClick={() => onChange(value + step)}>
        +
      </PBtn>
    </div>
  );
}

export function PSelect({ label, value, options, onChange, iconType = "cat", style = {}, smallBtnStyle = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    const handleEsc = (e) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEsc);
    };
  }, []);

  const currentValue = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} className="lq-select" data-open={isOpen ? "" : undefined} style={style}>
      <button
        type="button"
        className={"lq-select-trigger" + (smallBtnStyle ? " lq-select-trigger--lg" : "")}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentValue.label}</span>
        <Chevron className="lq-select-chevron" />
      </button>

      {isOpen && (
        <div className="lq-select-menu" role="listbox">
          {options.map((opt, i) => (
            <div
              key={i}
              role="option"
              tabIndex={0}
              aria-selected={value === opt.value}
              className="lq-option"
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(opt.value); setIsOpen(false); } }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PCollapsible({ title, accent = "#000", children, defaultOpen = false, bg = "#FFB347", activeBg, collapsedInfo = "", collapsedColor = "#FFB347", tooltip = null, modelShadow = "#E91E63", modelColor }) {
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
        borderColor="#0A0A0A"
        shadowColor={isOpen ? modelShadow : "#E91E63"}
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
        <div className="res-in lq-collapse-body">
          <PBox shadowColor={modelShadow} bg={modelColor || "#1A1A1A"} style={{ padding: "16px 24px 24px 16px" }}>
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
        <div className="lq-chip-cost" onClick={() => setEditingCost(true)}>
          {editingCost ? (
            <input
              ref={costInputRef}
              type="number"
              defaultValue={mat.cost}
              onBlur={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => e.key === "Enter" && handleCostChange(parseFloat(e.target.value) || 0)}
            />
          ) : (
            <>
              ${mat.cost} ea.
              <IconEdit size={14} color={P.ink3} />
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        {active && <>
          <PBtn small aria-label={`Remove one ${mat.name}`} onClick={(e) => { e.stopPropagation(); onRemove(); }} color="#ffd6e8" style={{ minWidth: 36, padding: "7px 12px" }}>−</PBtn>
          <div className="lq-chip-qty">{qty}</div>
        </>}
        <PBtn small aria-label={`Add one ${mat.name}`} onClick={(e) => { e.stopPropagation(); onAdd(); }} color="#d6f5e3" style={{ minWidth: 36, padding: "7px 12px" }}>+</PBtn>
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
