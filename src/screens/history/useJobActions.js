import { useCallback, useState } from "react";
import { canAddClient } from "../../utils/subscription";

// Per-job mutations for the Jobs tab. The logic is the same as the old inline handlers in HistoryScreen
// (status updates, "save as template", "add as client"); it only moved here so the card stays readable.
// `busyId` is the id of the job currently being written, so its buttons can show a loading state.
export default function useJobActions(ctx) {
  const {
    category,
    clients,
    currentUser,
    fmtDate,
    loadClientsFromStorage,
    loadJobs,
    loadTemplatesFromStorage,
    saveClientToStorage,
    saveJob,
    saveTemplateToStorage,
    setClients,
    setJobs,
    setSelectedClientId,
    setShowUpgradeModal,
    setTab,
    setTemplates,
    setUpgradeFeature,
    userTier,
  } = ctx;

  const [busyId, setBusyId] = useState(null);

  const run = useCallback(async (id, fn) => {
    setBusyId(id);
    try {
      await fn();
    } catch (e) {
      console.error("[Jobs] action failed:", e);
    } finally {
      setBusyId(null);
    }
  }, []);

  // next: "pending" | "in_progress" | "completed"
  const setStatus = useCallback((j, next) => run(j.id, async () => {
    const allJobs = await loadJobs(userTier, currentUser);
    const jobIdx = allJobs.findIndex(x => x.id === j.id);
    if (jobIdx < 0) return;
    const rec = allJobs[jobIdx];
    if (next === "pending") {
      rec.status = "pending"; rec.invoiceStatus = "pending"; rec.sentAt = null; rec.paidAt = null;
    } else if (next === "in_progress") {
      rec.status = "in_progress";
      rec.invoiceStatus = "sent";
      rec.sentAt = new Date().toISOString();
    } else {
      rec.status = "completed";
      rec.invoiceStatus = "paid";
      rec.paidAt = new Date().toISOString();
      if (!rec.sentAt) rec.sentAt = new Date().toISOString();
    }
    await saveJob(rec, userTier, currentUser);
    setJobs(await loadJobs(userTier, currentUser));
  }), [run, loadJobs, saveJob, setJobs, userTier, currentUser]);

  const saveAsTemplate = useCallback((j) => run(j.id, async () => {
    const template = {
      id: "tpl-" + Date.now(),
      name: `${j.role} - ${j.model}`,
      category: j.category || category,
      role: j.role,
      model: j.model,
      baseRate: j.baseRate || 25,
      form: { units: j.units, complexity: j.complexity, usage: j.usage, rush: j.rush, revisions: j.revisions, platformFee: j.platformFee, clientType: j.clientType, travelExpense: j.travelExpense },
      materials: [],
      notes: "Imported from job history",
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    await saveTemplateToStorage(template, userTier, currentUser);
    const t = await loadTemplatesFromStorage(userTier, currentUser);
    setTemplates(t);
    setTab("templates");
  }), [run, category, saveTemplateToStorage, loadTemplatesFromStorage, setTemplates, setTab, userTier, currentUser]);

  const addAsClient = useCallback((j) => run(j.id, async () => {
    if (!canAddClient(userTier, clients.length)) {
      setUpgradeFeature("clients");
      setShowUpgradeModal(true);
      return;
    }
    const newClientId = "cli-" + Date.now() + Math.random().toString(36).substr(2, 5);
    const newClient = {
      id: newClientId,
      name: `Client - ${j.role}`,
      email: "",
      phone: "",
      preferredComplexity: j.complexity || "Standard",
      preferredUsageRights: j.usage || "Personal",
      preferredClientType: j.clientType || "Individual",
      rateMultiplier: 1.0,
      notes: "Created from quote on " + fmtDate(j.date)
    };

    // Save client
    await saveClientToStorage(newClient, userTier, currentUser);
    setClients(await loadClientsFromStorage(userTier, currentUser));

    // Link job
    const allJobs = await loadJobs(userTier, currentUser);
    const jobIdx = allJobs.findIndex(x => x.id === j.id);
    if (jobIdx >= 0) {
      allJobs[jobIdx].clientId = newClientId;
      await saveJob(allJobs[jobIdx], userTier, currentUser);
      setJobs(await loadJobs(userTier, currentUser));
    }

    setSelectedClientId(newClientId);
    setTab("clients");
  }), [run, clients, userTier, currentUser, fmtDate, setUpgradeFeature, setShowUpgradeModal, saveClientToStorage, setClients,
       loadClientsFromStorage, loadJobs, saveJob, setJobs, setSelectedClientId, setTab]);

  return { busyId, setStatus, saveAsTemplate, addAsClient };
}
