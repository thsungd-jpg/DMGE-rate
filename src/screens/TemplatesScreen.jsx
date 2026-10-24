import React from "react";
import TemplateManager from "../components/TemplateManager";

// Screen for tab "templates".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function TemplatesScreen({ ctx }) {
  const {
    currentUser,
    handleUseTemplate,
    saveTemplateToStorage,
    setDeleteTarget,
    setShowDeleteModal,
    setTab,
    setTemplates,
    templates,
    userTier,
  } = ctx;

  return (
    <div className="legacy-page">
    <TemplateManager
                  templates={templates}
                  onUseTemplate={handleUseTemplate}
                  onDeleteTemplate={async (id) => {
                    const tpl = templates.find(t => String(t.id) === String(id));
                    setDeleteTarget({ type: "template", id, label: tpl ? `Template: ${tpl.name}` : "this template" });
                    setShowDeleteModal(true);
                  }}
                  onSaveTemplate={async (tpl) => {
                    const updated = await saveTemplateToStorage(tpl, userTier, currentUser);
                    setTemplates(updated);
                  }}
                  onBack={() => setTab("calc")}
                />
    </div>
  );
}
