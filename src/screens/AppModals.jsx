import React from "react";
import { PBtn, PInput, PModal } from "../components/ui";
import { Field, Pill } from "../components/kit";
import UpgradeModal from "../components/UpgradeModal";
import { IconDelete } from "../icons";
import "./modals.css";

// Modals shared across screens (custom material, save template, delete confirm, upgrade).
// Everything they need from the app (state, handlers, helpers) arrives in `ctx`.
export default function AppModals({ ctx }) {
  const {
    category,
    confirmAddMaterial,
    confirmDelete,
    deleteTarget,
    handleSaveTemplate,
    handleUpgrade,
    model,
    newMatForm,
    newTemplateForm,
    role,
    setNewMatForm,
    setNewTemplateForm,
    setShowDeleteModal,
    setShowMatModal,
    setShowSaveTemplateModal,
    setShowUpgradeModal,
    setTab,
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
      <PModal isOpen={showMatModal} onClose={() => setShowMatModal(false)} title="Add custom item">
        <form
          className="mdl-form"
          noValidate
          onSubmit={(e) => { e.preventDefault(); if (newMatForm.name) confirmAddMaterial(); }}
        >
          <p className="mdl-lede">Add a one-off cost that is not in the usual list. It joins the materials for this quote with a quantity of 1.</p>
          <Field label="Item name" htmlFor="mdl-mat-name">
            <PInput
              id="mdl-mat-name"
              autoFocus
              value={newMatForm.name}
              onChange={(v) => setNewMatForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Travel offset"
            />
          </Field>
          <Field label="Cost per unit ($)" htmlFor="mdl-mat-cost">
            <PInput
              id="mdl-mat-cost"
              type="number"
              step="any"
              value={newMatForm.cost}
              onChange={(v) => setNewMatForm((f) => ({ ...f, cost: v }))}
              placeholder="0.00"
            />
          </Field>
          <div className="mdl-actions">
            <PBtn type="button" color="var(--paper)" className="lq-btn--neutral" onClick={() => setShowMatModal(false)}>Cancel</PBtn>
            <PBtn type="submit" color="var(--mint)" disabled={!newMatForm.name}>Add to list</PBtn>
          </div>
        </form>
      </PModal>

      {/* SAVE TEMPLATE MODAL */}
      <PModal isOpen={showSaveTemplateModal} onClose={() => setShowSaveTemplateModal(false)} title="Save template">
        <form
          className="mdl-form"
          noValidate
          onSubmit={(e) => { e.preventDefault(); if (newTemplateForm.name) handleSaveTemplate(); }}
        >
          <p className="mdl-lede">Keep this setup (rate, multipliers and materials) so you can start a similar quote in one tap.</p>
          {(category || role?.name || model?.type) && (
            <div className="mdl-summary" aria-label="What will be saved">
              {category && <Pill tone="blue">{category}</Pill>}
              {role?.name && <Pill tone="butter">{role.name}</Pill>}
              {model?.type && <Pill tone="ink">{model.type}</Pill>}
            </div>
          )}
          <Field label="Template name" htmlFor="mdl-tpl-name">
            <PInput
              id="mdl-tpl-name"
              autoFocus
              value={newTemplateForm.name}
              onChange={(v) => setNewTemplateForm((f) => ({ ...f, name: v }))}
              placeholder="e.g. Photography headshot session"
            />
          </Field>
          <Field label="Notes (optional)" htmlFor="mdl-tpl-notes">
            <textarea
              id="mdl-tpl-notes"
              className="mdl-textarea"
              value={newTemplateForm.notes}
              onChange={(e) => setNewTemplateForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="e.g. Standard headshot session with 2 edits"
            />
          </Field>
          <div className="mdl-actions">
            <PBtn type="button" color="var(--paper)" className="lq-btn--neutral" onClick={() => setShowSaveTemplateModal(false)}>Cancel</PBtn>
            <PBtn type="submit" color="var(--mint)" disabled={!newTemplateForm.name}>Save template</PBtn>
          </div>
        </form>
      </PModal>

      {/* DELETE CONFIRMATION MODAL */}
      <PModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete this item?">
        <div className="mdl-confirm">
          <span className="mdl-confirm-icon" aria-hidden="true"><IconDelete size={28} /></span>
          <p className="mdl-confirm-text">
            You are about to delete
            <em className="mdl-name">{deleteTarget?.label || "this item"}</em>
          </p>
          <p className="mdl-warn">This cannot be undone.</p>
          <div className="mdl-actions">
            <PBtn color="var(--paper)" className="lq-btn--neutral" autoFocus onClick={() => setShowDeleteModal(false)}>Cancel</PBtn>
            <PBtn color="var(--danger)" className="mdl-danger" onClick={confirmDelete}>Yes, delete</PBtn>
          </div>
        </div>
      </PModal>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
        currentTier={userTier}
        onUpgrade={handleUpgrade}
        onSeePlans={() => { setShowUpgradeModal(false); setTab("pricing"); }}
      />
    </>
  );
}
