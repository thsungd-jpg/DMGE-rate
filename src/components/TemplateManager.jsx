import React, { useState } from 'react';
import { PBox, PBtn, PLbl, PInput, PSelect } from './ui';
import { IconArrowLeft, IconEdit, IconCross, IconCopy, IconStar } from '../icons';

export default function TemplateManager({ templates, onUseTemplate, onDeleteTemplate, onBack, onSaveTemplate }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");

  const categories = ["all", ...new Set(templates.map(t => t.category))];

  const filtered = templates.filter(t => {
    if (filterCat !== "all" && t.category !== filterCat) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const handleDuplicate = (t) => {
    const newTpl = {
      ...t,
      id: "tpl-" + Date.now(),
      name: `${t.name} (Copy)`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    onSaveTemplate && onSaveTemplate(newTpl);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.1875rem", flexWrap: "wrap", gap: "1.25rem" }}>
        <PBtn small color="#FFB347" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#000" }}>
          <IconArrowLeft size={18} color="#000" /> CALC
        </PBtn>
      </div>

      <div style={{ display: "flex", gap: "1.25rem", marginBottom: "2.1875rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "15.625rem" }}>
          <PLbl>SEARCH TEMPLATES</PLbl>
          <PInput value={search} onChange={setSearch} placeholder="Template name..." />
        </div>
        <div style={{ flex: 1, minWidth: "15.625rem" }}>
          <PLbl>CATEGORY</PLbl>
          <PSelect
            value={filterCat}
            onChange={setFilterCat}
            options={categories.map(c => ({ label: c === "all" ? "All Categories" : c, value: c }))}
            iconType="none"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <PBox bg="var(--pixel-surface)" style={{ textAlign: "center", padding: "2.5rem 1.25rem" }}>
          <div style={{ fontSize: "1.125rem", color: "#999" }}>NO TEMPLATES FOUND</div>
        </PBox>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(20rem, 1fr))", gap: "1.25rem" }}>
          {filtered.map(t => (
            <div 
              key={t.id} 
              style={{ 
                background: "var(--pixel-surface)", border: "0.4rem solid #2a2a2a", boxShadow: "0.4rem 0.4rem 0 #2a2a2a", 
                padding: "1.5625rem", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}
            >
              <div 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onDeleteTemplate(t.id); 
                }}
                style={{ 
                  position: "absolute", top: "0.5rem", right: "0.5rem", 
                  cursor: "pointer", padding: "0.75rem", background: "rgba(233, 30, 99, 0.1)",
                  border: "2px solid #E91E63",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 2
                }} 
                title="Delete Template"
              >
                <IconCross color="#E91E63" size={24} />
              </div>
              
              <div>
                <div style={{ fontSize: "1.25rem", color: "#FFB347", marginBottom: "0.625rem", paddingRight: "2rem" }}>{t.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#FFB34788", marginBottom: "0.9375rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                   <IconStar size={16} color="#FFB34788" /> {t.category}
                </div>
                <div style={{ fontSize: "0.6875rem", color: "#FFB347", marginBottom: "0.9375rem", background: "rgba(255,179,71,0.05)", padding: "0.625rem", borderLeft: "0.25rem solid #FFB347" }}>
                  {t.role} / {t.model}
                  {t.notes && <div style={{ marginTop: "0.5rem", fontStyle: "italic", opacity: 0.8 }}>"{t.notes}"</div>}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.6875rem", color: "#aaa", marginBottom: "1.25rem" }}>
                   <span>Used {t.usageCount}x</span>
                   <span>{fmtDate(t.createdAt)}</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.625rem" }}>
                <PBtn small color="#FFB347" onClick={() => onUseTemplate(t)} style={{ flex: 2, color: "#000" }}>LOAD</PBtn>
                <PBtn small color="#9C27B0" onClick={() => handleDuplicate(t)} style={{ flex: 1, padding: 0, display: "flex", justifyContent: "center", alignItems: "center", color: "#fff" }}>
                  <IconCopy size={18} color="#fff" />
                </PBtn>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
