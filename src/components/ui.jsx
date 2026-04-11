import React, { useState, useRef, useEffect } from "react";
import { IconHelp, IconEdit } from "../icons";

// ─────────────────────────────────────────────
// PIXEL COMPONENTS (SCALED 2.5X)
// ─────────────────────────────────────────────
export function PBox({ children, style = {}, bg = "#1A1A1A", borderColor = "#FFB347", shadowColor = "#E91E63", onClick }) {
  return (
    <div onClick={onClick} style={{ 
      background: bg, border: "0.375rem solid " + borderColor, boxShadow: "0.375rem 0.375rem 0 " + shadowColor, padding: "clamp(0.5rem,2vw,1.25rem)", boxSizing: "border-box", ...style, position: "relative", zIndex: 1 
    }}>
      {children}
    </div>
  );
}

export function PBtn({ children, onClick, color = "#b5d5f5", full = false, small = false, disabled = false, style = {} }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)} disabled={disabled}
      style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: small ? "1.125rem" : "1.25rem", color: "#0A0A0A",
        background: color, border: "0.5rem solid #0A0A0A",
        boxShadow: p ? "0.1875rem 0.1875rem 0 #0A0A0A" : "0.625rem 0.625rem 0 #0A0A0A",
        padding: small ? "0.5rem 0.75rem" : "0.75rem 1.25rem", cursor: disabled ? "default" : "pointer",
        width: full ? "100%" : "auto", transform: p ? "translate(0.4375rem,0.4375rem)" : "none",
        transition: "box-shadow 0.05s, transform 0.05s", lineHeight: 1.8, opacity: disabled ? 0.5 : 1,
        boxSizing: "border-box", wordBreak: "keep-all",
        ...style
      }}
    >{children}</button>
  );
}

export function PModal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <PBox style={{ maxWidth: "50rem", width: "100%", position: "relative", maxHeight: "95vh", overflowY: "auto" }} bg="#1A1A1A">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "clamp(1rem, 4vw, 1.5625rem)", color: "#FFB347", fontFamily: "'Press Start 2P'" }}>{title}</div>
          <PBtn small color="#E91E63" onClick={onClose}>X</PBtn>
        </div>
        {children}
      </PBox>
    </div>
  );
}

export function PLbl({ children, accent = "#FFB34788", style = {} }) {
  return <div style={{ fontFamily: "'Press Start 2P'", fontSize: "0.875rem", color: accent, marginBottom: "0.5rem", lineHeight: 1.6, ...style }}>{children}</div>;
}

export function PInput({ value, onChange, placeholder, style = {}, type = "text", min, step }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(type === "number" ? (parseFloat(e.target.value) || 0) : e.target.value)}
      placeholder={placeholder}
      min={min}
      step={step}
      style={{
        width: "100%", fontFamily: "'Press Start 2P'", fontSize: "1rem", padding: "clamp(0.5rem,1.5vw,0.75rem) clamp(0.5rem,2vw,1rem)",
        background: "#0A0A0A", border: "0.375rem solid #FFB347", boxShadow: "0.375rem 0.375rem 0 #E91E63",
        outline: "none", color: "#FFB347", boxSizing: "border-box", ...style
      }}
    />
  );
}

export function PStepper({ value, onChange, min = 0, step = 1, suffix = "" }) {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.9375rem", flexWrap: "wrap", justifyContent: "center" }}>
      <PBtn small color="#E91E63" onClick={() => onChange(Math.max(min, value - step))}>
        -
      </PBtn>
      <div
        onClick={() => setEditing(true)}
        style={{
          fontFamily: "'Press Start 2P'", fontSize: "clamp(1.25rem, 4.16vw, 2.0625rem)", color: "#FFB347", 
          flex: 1, minWidth: "7.5rem", maxWidth: "15.625rem", textAlign: "center",
          background: "#0A0A0A", border: "0.5rem solid #FFB347", boxShadow: "0.5rem 0.5rem 0 #E91E63", padding: "1.25rem 0.625rem",
          cursor: "text"
        }}
      >
        {editing ? (
          <input
            ref={inputRef}
            type="number"
            value={value}
            onChange={e => onChange(parseFloat(e.target.value) || 0)}
            onBlur={() => setEditing(false)}
            onKeyDown={e => e.key === "Enter" && setEditing(false)}
            style={{ width: "100%", border: "none", background: "transparent", textAlign: "center", fontFamily: "inherit", fontSize: "inherit", outline: "none", color: "var(--pixel-text, #2a2a2a)" }}
          />
        ) : (
          <>{value}{suffix}</>
        )}
      </div>
      <PBtn small color="#FFB347" onClick={() => onChange(value + step)}>
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentValue = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: "relative", width: "100%", marginBottom: "0.75rem", ...style }}>
      <div onClick={() => setIsOpen(!isOpen)} style={{ 
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", 
        padding: smallBtnStyle ? "0.5rem 0.75rem" : "0.625rem 1rem",
        border: smallBtnStyle ? "0.5rem solid #FFB347" : "0.375rem solid #FFB347",
        boxShadow: smallBtnStyle ? "0.625rem 0.625rem 0 #E91E63" : "0.375rem 0.375rem 0 #E91E63",
        background: "#0A0A0A",
        boxSizing: "border-box" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, overflow: "hidden" }}>
          <div style={{ fontSize: smallBtnStyle ? "1.125rem" : "1rem", whiteSpace: "nowrap", fontFamily: "'Press Start 2P', monospace", lineHeight: 1.8, color: "#FFB347" }}>
            {currentValue.label}
          </div>
        </div>
        <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.1s", display: "flex", alignItems: "center", color: "#FFB347" }}>
          ▼
        </div>
      </div>

      {isOpen && (
        <PBox style={{
          position: "absolute", top: "calc(100% + 0.9375rem)", left: 0, minWidth: "100%", width: "max-content", zIndex: 100,
          padding: "0.625rem", paddingRight: "1.25rem", maxHeight: 450, overflowY: "auto", overflowX: "hidden", scrollbarGutter: "stable", boxShadow: "0.9375rem 0.9375rem 0 #2a2a2a"
        }}>
          {options.map((opt, i) => (
            <div
              key={i}
              onClick={() => { onChange(opt.value); setIsOpen(false); }}
              style={{
                padding: "1.25rem 1.875rem", cursor: "pointer", fontSize: "1.125rem",
                background: value === opt.value ? "#FFB347" : "transparent",
                color: value === opt.value ? "#0A0A0A" : "#FFB347",
                display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1.25rem", marginBottom: "0.3125rem",
                whiteSpace: "nowrap"
              }}
            >
              {opt.label}
            </div>
          ))}
        </PBox>
      )}
    </div>
  );
}

export function PCollapsible({ title, accent = "#000", children, defaultOpen = false, bg = "#FFB347", activeBg, collapsedInfo = "", collapsedColor = "#FFB347", tooltip = null, modelShadow = "#E91E63", modelColor }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <PBox
        onClick={() => setIsOpen(!isOpen)}
        bg={isOpen ? (activeBg || bg) : bg}
        borderColor="#0A0A0A"
        shadowColor={isOpen ? modelShadow : "#E91E63"}
        style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.625rem 1rem", gap: "1rem", boxShadow: isOpen ? `0.375rem 0.375rem 0 ${modelShadow}` : "0.25rem 0.25rem 0 #E91E63", transition: "background 0.3s, box-shadow 0.3s" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div>
            <div style={{ fontSize: "clamp(0.65rem, 2.5vw, 0.875rem)", lineHeight: 1.6, fontFamily: "'Press Start 2P'", color: accent }}>{title}</div>
          </div>
        </div>
        <div style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.1s", color: "#0A0A0A" }}>
          ▼
        </div>
      </PBox>
       {!isOpen && collapsedInfo && (
        <div style={{ margin: "0.375rem 0 0 0" }}>
          <div style={{ marginTop: 0, padding: "0.5rem 0.75rem", border: `0.375rem solid #0A0A0A`, background: modelColor || `#1A1A1A`, boxShadow: `0.25rem 0.25rem 0 ${modelShadow}`, color: "#FFB347", fontSize: "0.75rem", fontFamily: "'Press Start 2P'", maxWidth: "100%", lineHeight: 1.6, transition: "box-shadow 0.3s, background 0.3s", overflowWrap: "break-word", wordBreak: "break-word" }}>
            {collapsedInfo}
          </div>
        </div>
      )}
      {isOpen && (
        <div className="res-in" style={{ marginTop: "0.5rem" }}>
          <PBox shadowColor={modelShadow} bg={modelColor || "#1A1A1A"} style={{ padding: "1rem 1.5rem 1.5rem 1rem", transition: "background 0.3s" }}>
            {children}
          </PBox>
        </div>
      )}
    </div>
  );
}

export function MatChip({ mat, qty, onAdd, onRemove, onCostChange, accent, bg }) {
  const [editingCost, setEditingCost] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const costInputRef = useRef(null);

  useEffect(() => { if (editingCost) costInputRef.current?.focus(); }, [editingCost]);

  const handleCostChange = (newCost) => {
    onCostChange?.(mat.name, newCost);
    setEditingCost(false);
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: qty > 0 ? bg : "#0A0A0A",
        border: "0.5rem solid " + (qty > 0 ? accent : "#FFB347"),
        boxShadow: qty > 0 ? "0.5rem 0.5rem 0 " + accent : "0.3125rem 0.3125rem 0 #E91E63",
        padding: "1.25rem 1.5rem", marginBottom: "1.25rem", transition: "border 0.1s, background 0.1s",
        cursor: isHovered ? "pointer" : "default",
        boxSizing: "border-box", width: "100%", gap: "1rem"
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Press Start 2P'", fontSize: "0.9375rem", color: "#FFB347", lineHeight: 1.9, whiteSpace: "normal", overflowWrap: "break-word" }}>{mat.name}</div>
        <div
          onClick={() => setEditingCost(true)}
          style={{
            fontFamily: "'Press Start 2P'",
            fontSize: "0.9375rem",
            color: isHovered ? accent : "#FFB34788",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.3125rem",
            transition: "color 0.2s"
          }}
        >
          {editingCost ? (
            <input
              ref={costInputRef}
              type="number"
              defaultValue={mat.cost}
              onBlur={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
              onKeyDown={(e) => e.key === "Enter" && handleCostChange(parseFloat(e.target.value) || 0)}
              style={{ width: "3.75rem", border: "0.25rem solid #FFB347", background: "#0A0A0A", fontFamily: "inherit", fontSize: "inherit", padding: "0.3125rem", outline: "none", color: "#FFB347" }}
            />
          ) : (
            <>
              ${mat.cost} ea.
              {isHovered && <IconEdit size={16} color="#2a2a2a" />}
            </>
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0, marginRight: "0.5rem" }}>
        {qty > 0 && <>
          <PBtn small onClick={(e) => { e.stopPropagation(); onRemove(); }} color="#ffd6e8">-</PBtn>
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: "1.25rem", minWidth: "2.5rem", textAlign: "center", color: qty > 0 ? "#0A0A0A" : "#FFB347" }}>{qty}</div>
        </>}
        <PBtn small onClick={(e) => { e.stopPropagation(); onAdd(); }} color="#d6f5e3">+</PBtn>
      </div>
    </div>
  );
}

export function OptionGrid({ options, value, onChange, cols = 4, activeColor, activeShadow }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fit, minmax(clamp(6.25rem, 20vw, 9.375rem), 1fr))`, gap: "0.9375rem" }}>
      {Object.entries(options).map(([k, v]) => {
        const active = k === value;
        
        let label = k;
        if (label === "Masterpiece") label = "Master";
        if (label === "Commercial") label = "Commrl";
        if (label === "Individual") label = "Indiv";
        if (label === "Corporate") label = "Corp";
        if (label === "Exclusive") label = "Exclu";
        if (label === "Standard") label = "Stndrd";
        if (label === "Merch/Print") label = "Merch";

        return (
          <button key={k} onClick={() => onChange(k)} style={{
            fontFamily: "'Press Start 2P'", fontSize: "0.875rem", color: active ? "#0A0A0A" : "#FFB347", lineHeight: 1.6,
            background: active ? activeColor : "#0A0A0A",
            border: "0.5rem solid " + (active ? activeShadow : "#FFB347"),
            boxShadow: active ? "0.5rem 0.5rem 0 " + activeShadow : "0.3125rem 0.3125rem 0 #E91E63",
            padding: "0.75rem 0.625rem", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", boxSizing: "border-box"
          }}>
            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{label}</span>
            <span style={{ color: active ? "#0A0A0A88" : "#FFB34744", marginTop: "0.25rem" }}>x{v}</span>
          </button>
        );
      })}
    </div>
  );
}