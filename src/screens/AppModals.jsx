import React from "react";
import { PBtn, PInput, PLbl, PModal } from "../components/ui";
import UpgradeModal from "../components/UpgradeModal";

// Modals shared across screens (custom material, save template, delete confirm, upgrade).
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function AppModals({ ctx }) {
  const {
    confirmAddMaterial,
    confirmDelete,
    deleteTarget,
    handleSaveTemplate,
    handleUpgrade,
    newMatForm,
    newTemplateForm,
    setNewMatForm,
    setNewTemplateForm,
    setShowDeleteModal,
    setShowMatModal,
    setShowSaveTemplateModal,
    setShowUpgradeModal,
    showDeleteModal,
    showMatModal,
    showSaveTemplateModal,
    showUpgradeModal,
    upgradeFeature,
    userTier,
  } = ctx;

  return (
    <>
    {/* CUSTOM MATERIAL MODAL */}
          <PModal isOpen={showMatModal} onClose={() => setShowMatModal(false)} title="ADD CUSTOM ITEM">
            <div style={{ padding: "1.25rem" }}>
              <PLbl>ITEM NAME</PLbl>
              <PInput value={newMatForm.name} onChange={v => setNewMatForm(f => ({ ...f, name: v }))} placeholder="e.g. Travel Offset" style={{ marginBottom: "2.1875rem" }} />
    
              <PLbl>COST PER UNIT ($)</PLbl>
              <PInput type="number" value={newMatForm.cost} onChange={v => setNewMatForm(f => ({ ...f, cost: v }))} placeholder="0.00" style={{ marginBottom: "2.1875rem" }} />
    
              <div className="btn-row" style={{ display: "flex", gap: "1.25rem", marginTop: "1.25rem" }}>
                <PBtn full color="#d6f5e3" onClick={confirmAddMaterial} disabled={!newMatForm.name}>ADD TO LIST</PBtn>
                <PBtn full color="#ffd6e8" onClick={() => setShowMatModal(false)}>CANCEL</PBtn>
              </div>
            </div>
          </PModal>
    
          {/* SAVE TEMPLATE MODAL */}
          <PModal isOpen={showSaveTemplateModal} onClose={() => setShowSaveTemplateModal(false)} title="SAVE TEMPLATE">
            <div style={{ padding: "1.25rem" }}>
              <PLbl>TEMPLATE NAME</PLbl>
              <PInput
                value={newTemplateForm.name}
                onChange={v => setNewTemplateForm(f => ({ ...f, name: v }))}
                placeholder="e.g. Photography Headshot Session"
                style={{ marginBottom: "2.1875rem" }}
              />
    
              <PLbl>NOTES (OPTIONAL)</PLbl>
              <textarea
                value={newTemplateForm.notes}
                onChange={e => setNewTemplateForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Standard headshot session with 2 edits"
                style={{
                  width: "100%",
                  fontFamily: "'Press Start 2P'",
                  fontSize: "0.75rem",
                  lineHeight: 1.6,
                  padding: "1.5625rem 2.1875rem",
                  background: "var(--pixel-surface, #e8f4f8)",
                  border: "0.5rem solid #2a2a2a",
                  boxShadow: "0.625rem 0.625rem 0 #2a2a2a",
                  outline: "none",
                  color: "var(--pixel-text, #2a2a2a)",
                  minHeight: 120,
                  resize: "vertical",
                  marginBottom: "2.1875rem"
                }}
              />
    
              <div className="btn-row" style={{ display: "flex", gap: "1.25rem", marginTop: "1.25rem" }}>
                <PBtn full color="#d6f5e3" onClick={handleSaveTemplate} disabled={!newTemplateForm.name}>SAVE TEMPLATE</PBtn>
                <PBtn full color="#ffd6e8" onClick={() => setShowSaveTemplateModal(false)}>CANCEL</PBtn>
              </div>
            </div>
          </PModal>
    
          {/* DELETE CONFIRMATION MODAL */}
          <PModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="CONFIRM DELETE">
            <div style={{ padding: "1.25rem", textAlign: "center", fontFamily: "'Press Start 2P'" }}>
              <div style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.9375rem)", color: "#FFB347", marginBottom: "2.1875rem", lineHeight: 2.2 }}>
                ARE YOU SURE YOU WANT TO DELETE:<br />
                <span style={{ color: "#E91E63", fontSize: "clamp(1rem, 2vw, 1.25rem)" }}>{deleteTarget.label}</span>?
                <br /><br />
                THIS ACTION CANNOT BE UNDONE.
              </div>
              <div className="btn-row" style={{ display: "flex", gap: "1.25rem", marginTop: "1.25rem" }}>
                <PBtn full color="#E91E63" onClick={confirmDelete} style={{ color: "#fff", fontSize: "clamp(0.75rem, 1.2vw, 0.8125rem)" }}>YES, DELETE</PBtn>
                <PBtn full color="#1A1A1A" onClick={() => setShowDeleteModal(false)} style={{ color: "#FFB347", fontSize: "clamp(0.75rem, 1.2vw, 0.8125rem)" }}>CANCEL</PBtn>
              </div>
            </div>
          </PModal>
    
          <UpgradeModal
            isOpen={showUpgradeModal}
            onClose={() => setShowUpgradeModal(false)}
            feature={upgradeFeature}
            currentTier={userTier}
            onUpgrade={handleUpgrade}
          />
    </>
  );
}
