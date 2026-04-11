import React, { useState } from 'react';
import Papa from 'papaparse';
import { PBox, PBtn, PLbl, PInput, PSelect } from './ui';
import { IconArrowLeft, IconCross } from '../icons';
import { exportClientsToCSV } from '../utils/csvExport';
import { canAddClient, canAddClientsBatch } from '../utils/subscription';

export default function ClientManager({ clients, jobs, tier, onClientLimitReached, onUseClient, onSaveClient, onDeleteClient, onImportClients, onBack }) {
  const [search, setSearch] = useState("");
  const [viewingClient, setViewingClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);

  // Stats for the detail view
  const clientJobs = jobs.filter(j => j.clientId === viewingClient?.id);
  const totalBilled = clientJobs.reduce((acc, j) => acc + j.price, 0);

  const filtered = clients.filter(c => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !(c.email || "").toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map(row => ({
          name: row.Name || row.name,
          email: row.Email || row.email || "",
          phone: row.Phone || row.phone || "",
          rateMultiplier: parseFloat(row.RateMultiplier || row.rateMultiplier) || 1,
          preferredComplexity: row.PreferredComplexity || row.preferredComplexity || "Standard",
          preferredUsageRights: row.PreferredUsageRights || row.preferredUsageRights || "Personal",
          preferredClientType: row.PreferredClientType || row.preferredClientType || "Individual",
          notes: row.Notes || row.notes || ""
        })).filter(c => c.name);
        if (!parsed.length || !onImportClients) return;
        if (!canAddClientsBatch(tier, clients.length, parsed.length)) {
          onClientLimitReached?.();
          return;
        }
        onImportClients(parsed);
      }
    });
    // Reset file input
    e.target.value = null;
  };

  const handleEditNew = () => {
    if (!canAddClient(tier, clients.length)) {
      onClientLimitReached?.();
      return;
    }
    setForm({
      id: "cli-" + Date.now(),
      name: "",
      email: "",
      phone: "",
      preferredComplexity: "Standard",
      preferredUsageRights: "Personal",
      preferredClientType: "Individual",
      rateMultiplier: 1.0,
      notes: ""
    });
    setIsEditing(true);
    setViewingClient(null);
  };

  const handleEditExisting = (c) => {
    setForm({ ...c });
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!form.name) return;
    const isNew = !clients.some(c => c.id === form.id);
    if (isNew && !canAddClient(tier, clients.length)) {
      onClientLimitReached?.();
      return;
    }
    onSaveClient(form);
    setIsEditing(false);
    setViewingClient(form);
  };

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  if (isEditing && form) {
    return (
      <div>
        <PBtn small color="#FFB347" onClick={() => setIsEditing(false)} style={{ marginBottom: "2.1875rem", display: "flex", alignItems: "center", gap: "0.9375rem", color: "#000" }}>
          <IconArrowLeft size={18} color="#000" /> BACK
        </PBtn>
        <PBox bg="var(--pixel-surface)">
          <div style={{ fontSize: "1.5625rem", color: "#FFB347", fontFamily: "'Press Start 2P'", marginBottom: "1.875rem" }}>
            {form.id.startsWith("cli-") && !clients.find(c => c.id === form.id) ? "NEW CLIENT" : "EDIT CLIENT"}
          </div>
          
          <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <PLbl>NAME</PLbl>
              <PInput value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <PLbl>EMAIL</PLbl>
              <PInput type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="contact@acme.com" />
            </div>
          </div>
          
          <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "1.25rem" }}>
            <div>
              <PLbl>PHONE</PLbl>
              <PInput type="text" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+1 555-5555" />
            </div>
            <div>
              <PLbl>RATE MULTIPLIER (e.g. 1.2 = +20%)</PLbl>
              <PInput type="number" value={form.rateMultiplier} onChange={v => setForm({ ...form, rateMultiplier: v })} placeholder="1.0" />
            </div>
          </div>

          <div style={{ marginBottom: "1.875rem" }}>
            <PLbl>NOTES</PLbl>
            <textarea 
              value={form.notes} 
              onChange={e => setForm({ ...form, notes: e.target.value })} 
              placeholder="e.g. VIP client, demands rush orders" 
              style={{
                width: "100%", fontFamily: "'Press Start 2P'", fontSize: "0.75rem", lineHeight: 1.6, padding: "1.25rem",
                background: "#f5ead6", border: "0.5rem solid #2a2a2a", boxShadow: "0.3125rem 0.3125rem 0 #2a2a2a",
                outline: "none", color: "#2a2a2a", minHeight: 120, resize: "vertical"
              }}
            />
          </div>
          
          <div className="btn-row" style={{ display: "flex", gap: "1.25rem" }}>
            <PBtn full color="#FFB347" onClick={handleSave} style={{ color: "#000" }}>SAVE CLIENT</PBtn>
            <PBtn full color="#E91E63" onClick={() => setIsEditing(false)} style={{ color: "#000" }}>CANCEL</PBtn>
          </div>
        </PBox>
      </div>
    );
  }

  if (viewingClient) {
    return (
      <div>
        <PBtn small color="#FFB347" onClick={() => setViewingClient(null)} style={{ marginBottom: "2.1875rem", display: "flex", alignItems: "center", gap: "0.9375rem", color: "#000" }}>
          <IconArrowLeft size={18} color="#000" /> BACK TO CLIENTS
        </PBtn>

        <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.875rem" }}>
          <PBox bg="var(--pixel-surface)">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.875rem" }}>
              <div>
                <div style={{ fontSize: "2.1875rem", color: "#FFB347", marginBottom: "0.9375rem" }}>{viewingClient.name}</div>
                <div style={{ fontSize: "0.875rem", color: "#FFB34788" }}>Email: {viewingClient.email || "N/A"}</div>
                <div style={{ fontSize: "0.875rem", color: "#FFB34788", marginTop: "0.3125rem" }}>Phone: {viewingClient.phone || "N/A"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.25rem", color: "#E91E63", marginBottom: "0.625rem" }}>{viewingClient.rateMultiplier}X RATE</div>
                <div style={{ display: "flex", gap: "0.625rem", justifyContent: "flex-end" }}>
                  <PBtn small color="#E91E63" onClick={() => handleEditExisting(viewingClient)} style={{ color: "#000", padding: "0.5rem 1rem" }}>EDIT</PBtn>
                  <PBtn small color="#FFB347" onClick={() => onUseClient(viewingClient)} style={{ color: "#000", padding: "0.5rem 1rem" }}>QUOTE</PBtn>
                </div>
              </div>
            </div>

            {viewingClient.notes && (
              <div style={{ padding: "1.25rem", background: "#f5ead6", border: "0.25rem solid #2a2a2a", marginBottom: "1.875rem" }}>
                <div style={{ fontSize: "0.875rem", color: "#2a2a2a", lineHeight: 1.5 }}>{viewingClient.notes}</div>
              </div>
            )}
            
            <PLbl>QUOTE HISTORY ({clientJobs.length})</PLbl>
            {clientJobs.length === 0 ? (
              <div style={{ fontSize: "0.875rem", color: "#999" }}>No quote history yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.9375rem" }}>
                {clientJobs.map(j => (
                  <div key={j.id} style={{ display: "flex", justifyContent: "space-between", background: "#f9f9f9", padding: "0.9375rem", border: "0.25rem solid #ddd" }}>
                    <div>
                      <div style={{ fontSize: "1rem", color: "#2a2a2a" }}>${Math.round(j.price)}</div>
                      <div style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.3125rem" }}>{j.role} • {j.model}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: "0.75rem", color: "#999" }}>
                      {fmtDate(j.date)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </PBox>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <PBox bg="var(--pixel-surface)">
              <div style={{ fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)", color: "#FFB34788", marginBottom: "0.625rem" }}>TOTAL VALUE</div>
              <div style={{ fontSize: "clamp(1.25rem, 4vw, 1.875rem)", color: "#FFB347" }}>${Math.round(totalBilled)}</div>
            </PBox>
            <PBtn full color="#E91E63" onClick={() => { onDeleteClient(viewingClient.id); setViewingClient(null); }} style={{ color: "#000" }}>DELETE CLIENT</PBtn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2.1875rem", flexWrap: "wrap", gap: "1.25rem" }}>
        <PBtn small color="#FFB347" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0, color: "#000" }}>
          <IconArrowLeft size={18} color="#000" /> CALC
        </PBtn>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <PBtn small color="#E91E63" onClick={() => exportClientsToCSV(clients)} style={{ color: "#000" }}>EXP</PBtn>
          <PBtn small color="#FFB347" onClick={() => document.getElementById('client-import-input').click()} style={{ color: "#000" }}>IMP</PBtn>
          <input id="client-import-input" type="file" accept=".csv" style={{ display: "none" }} onChange={handleImport} />
          <PBtn small color="#FFB347" onClick={handleEditNew} style={{ color: "#000" }}>+ NEW</PBtn>
        </div>
      </div>

      <div style={{ marginBottom: "2.1875rem" }}>
        <PLbl>SEARCH CLIENTS</PLbl>
        <PInput value={search} onChange={setSearch} placeholder="Name or email..." />
      </div>

      {filtered.length === 0 ? (
        <PBox bg="var(--pixel-surface)" style={{ textAlign: "center", padding: "2.5rem 1.25rem" }}>
          <div style={{ fontSize: "1.125rem", color: "#999" }}>NO CLIENTS FOUND</div>
        </PBox>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(18.75rem, 1fr))", gap: "1.25rem" }}>
          {filtered.map(c => {
             const cJobs = jobs.filter(j => j.clientId === c.id);
             return (
              <div 
                key={c.id} 
                onClick={() => setViewingClient(c)}
                style={{ 
                  background: "var(--pixel-surface)", border: "0.5rem solid #2a2a2a", boxShadow: "0.5rem 0.5rem 0 #2a2a2a", 
                  padding: "1.5625rem", cursor: "pointer", transition: "transform 0.1s", position: "relative" 
                }}
              >
                <div 
                  onClick={(e) => { e.stopPropagation(); onDeleteClient(c.id); }}
                  style={{ 
                    position: "absolute", top: "0.5rem", right: "0.5rem", 
                    cursor: "pointer", padding: "0.75rem", background: "rgba(233, 30, 99, 0.1)",
                    border: "2px solid #E91E63",
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }} 
                  title="Delete Client"
                >
                  <IconCross color="#E91E63" size={24} />
                </div>
                <div style={{ fontSize: "1.25rem", color: "#FFB347", marginBottom: "0.625rem" }}>{c.name}</div>
                <div style={{ fontSize: "0.75rem", color: "#FFB34788", marginBottom: "0.9375rem" }}>{c.email || "No Email"}</div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#999", borderTop: "0.25rem solid #ddd", paddingTop: 15 }}>
                  <span>{cJobs.length} Quotes</span>
                  <span>{c.rateMultiplier}x Rate</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
