import React from "react";
import { PBox, PBtn, PLbl, PSelect } from "../components/ui";
import { IconArrowLeft, IconCheck, IconCross, IconEdit, IconInProgress, IconLock, IconPending } from "../icons";
import { canAddClient, canExportCSV } from "../utils/subscription";

// Screen for tab "history".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function HistoryScreen({ ctx }) {
  const {
    category,
    clients,
    currentUser,
    filteredJobs,
    fmtDate,
    handleDeleteJob,
    handleEditJob,
    handleGatedCSV,
    handleGatedPDF,
    handleSendQuote,
    historyJobs,
    jobStatusFilter,
    loadClientsFromStorage,
    loadJobs,
    loadTemplatesFromStorage,
    saveClientToStorage,
    saveJob,
    saveTemplateToStorage,
    setClients,
    setJobStatusFilter,
    setJobs,
    setSelectedClientId,
    setShowUpgradeModal,
    setTab,
    setTemplates,
    setUpgradeFeature,
    totalBilled,
    userTier,
  } = ctx;

  return (
    <>
                <div className="btn-row" style={{ display: "flex", gap: "1.25rem", marginBottom: "1.5rem", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", flexWrap: "wrap", paddingBottom: "0.5rem" }}>
                    <PBtn small color="#FFB347" onClick={() => setTab("calc")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0A0A0A" }}>
                      <IconArrowLeft size={18} color="#0A0A0A" /> CALC
                    </PBtn>
                    <PBtn small color="#FFB347" onClick={handleGatedCSV} style={{ color: "#0A0A0A" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>CSV {!canExportCSV(userTier) && <IconLock size={14} color="#0A0A0A" />}</span>
                    </PBtn>
                    <div style={{ marginBottom: 0, minWidth: "14.5rem" }}>
                      <PSelect
                        value={jobStatusFilter}
                        onChange={setJobStatusFilter}
                        options={[
                          { label: "All Jobs", value: "all" },
                          { label: "Pending", value: "pending" },
                          { label: "Current", value: "in_progress" },
                          { label: "Completed", value: "completed" },
                        ]}
                        iconType="none"
                        smallBtnStyle={true}
                        style={{ marginBottom: 0 }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "nowrap", whiteSpace: "nowrap", marginTop: "0.5rem" }}>
                    <PLbl style={{ marginBottom: 0, flexShrink: 0 }}>STATUS:</PLbl>
                    <span style={{ fontSize: "0.85rem", color: "#9E9E9E", fontFamily: "'Press Start 2P'", display: "inline-flex", gap: "3px", alignItems: "center", flexShrink: 0 }}>
                      <IconPending size={18} color="#9E9E9E" /> {historyJobs.filter(j => j.status === "pending").length} Pend
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#FF9800", fontFamily: "'Press Start 2P'", display: "inline-flex", gap: "3px", alignItems: "center", flexShrink: 0 }}>
                      <IconInProgress size={18} color="#FF9800" /> {historyJobs.filter(j => j.status === "in_progress").length} IP
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#4CAF50", fontFamily: "'Press Start 2P'", display: "inline-flex", gap: "3px", alignItems: "center", flexShrink: 0 }}>
                      <IconCheck size={18} color="#4CAF50" /> {historyJobs.filter(j => j.status === "completed").length} Done
                    </span>
                  </div>
                </div>
                <PBox bg="#1A1A1A" shadowColor="#E91E63" style={{ marginBottom: "2.1875rem" }}>
                  <div style={{ fontSize: "clamp(0.7rem, 2.5vw, 0.9375rem)", color: "#FFB34788", marginBottom: "0.9375rem" }}>TOTAL REVENUE</div>
                  <div style={{ fontSize: "clamp(2rem, 8vw, 3.125rem)", color: "#FFB347" }}>${Math.round(totalBilled)}</div>
                </PBox>
                {filteredJobs.map((j, i) => (
                  <PBox key={i} bg="#1A1A1A" shadowColor="#E91E63" style={{ marginBottom: "1.5625rem" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "1.25rem", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: "1 1 250px" }}>
                        <div style={{ fontSize: "clamp(1.5rem, 5vw, 2.0625rem)", color: "#FFB347" }}>${Math.round(j.price)}</div>
                        <div style={{ fontSize: "0.9375rem", color: "#FFB34788", marginTop: "0.9375rem" }}>
                          {j.role} · {j.model}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#FFB34788", marginTop: "0.3125rem" }}>
                          Travel: ${(j.travelExpense || 0).toFixed(2)}
                        </div>
                        <div style={{ fontSize: "0.875rem", color: "#FFB34788", marginTop: "0.3125rem" }}>
                          Status: <span style={{
                            color: j.status === "completed" ? "#4CAF50" : j.status === "in_progress" ? "#FF9800" : "#9E9E9E",
                            display: "inline-flex", gap: "4px", alignItems: "center"
                          }}>{j.status === "completed" ? <><IconCheck size={18} color="#4CAF50" /> COMPLETED</> : j.status === "in_progress" ? <><IconInProgress size={18} color="#FF9800" /> IN PROGRESS</> : <><IconPending size={18} color="#9E9E9E" /> PENDING</>}</span>
                        </div>
                      </div>
                      <div style={{ flex: "1 1 300px" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start", gap: "0.625rem", marginBottom: "0.625rem", alignItems: "center" }}>
                          <PBtn small color="#1A1A1A" onClick={(e) => { e.stopPropagation(); handleEditJob(j); }} style={{ color: "#FFB347", padding: "0.5rem 0.75rem" }} title="Edit Job">
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><IconEdit color="#FFB347" size={18} /> EDIT</span>
                          </PBtn>
                          <PBtn small color="#1A1A1A" onClick={(e) => { e.stopPropagation(); handleDeleteJob(j.id); }} style={{ color: "#E91E63", padding: "0.5rem 0.75rem" }} title="Delete Job">
                            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}><IconCross color="#E91E63" size={18} /> DEL</span>
                          </PBtn>
                          <div style={{ marginLeft: "auto", fontSize: "0.9375rem", color: "#FFB34788" }}>{fmtDate(j.date)}</div>
                        </div>
    
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "0.625rem" }}>
                          <PBtn small color="#1A1A1A" onClick={() => handleGatedPDF(j)} style={{ flexGrow: 1, color: "#FFB347" }}>PDF</PBtn>
                          <PBtn small color="#1A1A1A" onClick={() => handleSendQuote(j)} style={{ flexGrow: 1, color: "#FFB347" }}>EMAIL</PBtn>
                          <PBtn small color="#FFB347" onClick={() => {
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
                            saveTemplateToStorage(template, userTier, currentUser).then(() => loadTemplatesFromStorage(userTier, currentUser).then(t => { setTemplates(t); setTab("templates"); }));
                          }} style={{ flexGrow: 1, color: "#0A0A0A" }}>+ TPL</PBtn>
                          {!j.clientId && (
                            <PBtn small color="#E91E63" onClick={async () => {
                              if (!canAddClient(userTier, clients.length)) {
                                setUpgradeFeature('clients');
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
                            }} style={{ flexGrow: 1, color: "#fff" }}>+ CLI</PBtn>
                          )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3125rem", marginTop: "0.625rem" }}>
                          <PBtn small color="#1A1A1A" onClick={async () => {
                            const allJobs = await loadJobs(userTier, currentUser);
                            const jobIdx = allJobs.findIndex(x => x.id === j.id);
                            if (jobIdx >= 0) { allJobs[jobIdx].status = "pending"; allJobs[jobIdx].invoiceStatus = "pending"; allJobs[jobIdx].sentAt = null; allJobs[jobIdx].paidAt = null; await saveJob(allJobs[jobIdx], userTier, currentUser); setJobs(await loadJobs(userTier, currentUser)); }
                          }} style={{ flexGrow: 1, color: "#FFB347" }}>PENDING</PBtn>
                          <PBtn small color="#FFB347" onClick={async () => {
                            const allJobs = await loadJobs(userTier, currentUser);
                            const jobIdx = allJobs.findIndex(x => x.id === j.id);
                            if (jobIdx >= 0) {
                              allJobs[jobIdx].status = "in_progress";
                              allJobs[jobIdx].invoiceStatus = "sent";
                              allJobs[jobIdx].sentAt = new Date().toISOString();
                              await saveJob(allJobs[jobIdx], userTier, currentUser);
                              setJobs(await loadJobs(userTier, currentUser));
                            }
                          }} style={{ flexGrow: 1, color: "#0A0A0A" }}>SENT/IP</PBtn>
                          <PBtn small color="#E91E63" onClick={async () => {
                            const allJobs = await loadJobs(userTier, currentUser);
                            const jobIdx = allJobs.findIndex(x => x.id === j.id);
                            if (jobIdx >= 0) {
                              allJobs[jobIdx].status = "completed";
                              allJobs[jobIdx].invoiceStatus = "paid";
                              allJobs[jobIdx].paidAt = new Date().toISOString();
                              if (!allJobs[jobIdx].sentAt) allJobs[jobIdx].sentAt = new Date().toISOString();
                              await saveJob(allJobs[jobIdx], userTier, currentUser);
                              setJobs(await loadJobs(userTier, currentUser));
                            }
                          }} style={{ flexGrow: 1, color: "#fff" }}>PAID</PBtn>
                        </div>
                      </div>
                    </div>
                    {j.invoiceNumber && (
                      <div style={{ marginTop: "0.9375rem", padding: "0.9375rem", background: "#0A0A0A", border: "0.25rem solid #FFB347", display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "0.8125rem", color: "#FFB34788" }}>
                          INVOICE: <span style={{ color: "#FFB347", fontWeight: "bold" }}>{j.invoiceNumber}</span>
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#FFB34788", textAlign: "right" }}>
                          {j.paidAt ? `PAID: ${fmtDate(j.paidAt)}` : j.sentAt ? `SENT: ${fmtDate(j.sentAt)}` : `DUE: ${fmtDate(j.dueDate)}`}
                        </div>
                        <div style={{ fontSize: "0.8125rem", color: "#FFB34788", width: "100%", textAlign: "right", marginTop: "4px" }}>
                          <span style={{ color: j.invoiceStatus === 'paid' ? '#4CAF50' : new Date(j.dueDate) < new Date() ? '#E91E63' : '#FFB347' }}>
                            {j.invoiceStatus === 'paid' ? 'PAID' : new Date(j.dueDate) < new Date() ? `OVERDUE (WAS DUE ${fmtDate(j.dueDate)})` : `DUE ${fmtDate(j.dueDate)}`}
                          </span>
                        </div>
                      </div>
                    )}
                  </PBox>
                ))}
              </>
  );
}
