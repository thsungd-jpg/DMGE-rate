import React from "react";
import ClientManager from "../components/ClientManager";

// Screen for tab "clients".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function ClientsScreen({ ctx }) {
  const {
    clients,
    currentUser,
    jobs,
    saveClientToStorage,
    setClients,
    setDeleteTarget,
    setForm,
    setSelectedClientId,
    setShowDeleteModal,
    setShowUpgradeModal,
    setTab,
    setUpgradeFeature,
    userTier,
  } = ctx;

  return (
    <ClientManager
                  clients={clients}
                  jobs={jobs}
                  tier={userTier}
                  onClientLimitReached={() => {
                    setUpgradeFeature('clients');
                    setShowUpgradeModal(true);
                  }}
                  onUseClient={(c) => {
                    setSelectedClientId(c.id);
                    setForm(f => ({ ...f, complexity: c.preferredComplexity, usage: c.preferredUsageRights, clientType: c.preferredClientType }));
                    setTab("calc");
                  }}
                  onSaveClient={async (c) => {
                    const updatedClients = await saveClientToStorage(c, userTier, currentUser);
                    setClients(updatedClients);
                  }}
                  onDeleteClient={async (id) => {
                    const cli = clients.find(c => String(c.id) === String(id));
                    setDeleteTarget({ type: "client", id, label: cli ? `Client: ${cli.name}` : "this client" });
                    setShowDeleteModal(true);
                  }}
                  onImportClients={async (parsed) => {
                    const base = Date.now();
                    let lastList = clients;
                    for (let i = 0; i < parsed.length; i++) {
                      const row = parsed[i];
                      const c = {
                        ...row,
                        id: row.id || `cli-${base}-${i}-${Math.random().toString(36).substr(2, 5)}`,
                      };
                      lastList = await saveClientToStorage(c, userTier, currentUser);
                    }
                    setClients(lastList);
                  }}
                  onBack={() => setTab("calc")}
                />
  );
}
