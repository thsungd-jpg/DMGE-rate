import React from "react";
import { PBox, PBtn, PInput, PLbl } from "../components/ui";
import { IconArrowLeft, IconArrowRight } from "../icons";
import DMGEInvoiceEditor from "../components/DMGEInvoiceEditor";

// Screen for tab "invoice_editor".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function InvoiceEditorScreen({ ctx }) {
  const {
    clients,
    emailForm,
    emailStatus,
    isSendingEmail,
    profile,
    selectedJobForEmail,
    sendEmail,
    setEmailForm,
    setEmailStatus,
    setInvoiceEditorData,
    setTab,
  } = ctx;

  return (
    <div className="legacy-page">
    <div style={{ maxWidth: "1000px", margin: "0 auto", paddingBottom: "2rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "0.75rem" }}>
                    <PBtn small color="#FFB347" onClick={() => { setTab("history"); setEmailStatus({ type: null, message: "" }); }} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0A0A0A" }}>
                      <IconArrowLeft size={18} color="#0A0A0A" /> BACK
                    </PBtn>
                    <div style={{ color: "#FFB347", fontFamily: "'Press Start 2P'", fontSize: "clamp(0.75rem, 2.5vw, 1.25rem)" }}>INVOICE EDITOR</div>
                  </div>
    
                  <PBox bg="#0A0A0A" style={{ padding: "clamp(0.75rem, 3vw, 1.5rem)", marginBottom: "1.5rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 250px), 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                      <div>
                        <PLbl style={{ marginBottom: "0.25rem" }}>RECIPIENT EMAIL</PLbl>
                        <PInput
                          type="email"
                          value={emailForm.to}
                          onChange={v => setEmailForm(f => ({ ...f, to: v }))}
                          placeholder="client@example.com"
                        />
                      </div>
                      <div>
                        <PLbl style={{ marginBottom: "0.25rem" }}>SUBJECT</PLbl>
                        <PInput
                          value={emailForm.subject}
                          onChange={v => setEmailForm(f => ({ ...f, subject: v }))}
                          placeholder="Quote for your project"
                        />
                      </div>
                    </div>
    
                    {emailStatus.type && (
                      <div style={{
                        padding: "0.75rem 1rem",
                        marginBottom: "1rem",
                        fontFamily: "'Press Start 2P'",
                        fontSize: "clamp(0.55rem, 1.5vw, 0.75rem)",
                        lineHeight: 1.8,
                        border: `0.25rem solid ${emailStatus.type === "error" ? "#E91E63" : emailStatus.type === "success" ? "#4CAF50" : "#FFB347"}`,
                        background: emailStatus.type === "error" ? "rgba(233,30,99,0.15)" : emailStatus.type === "success" ? "rgba(76,175,80,0.15)" : "rgba(255,179,71,0.15)",
                        color: emailStatus.type === "error" ? "#E91E63" : emailStatus.type === "success" ? "#4CAF50" : "#FFB347",
                        wordBreak: "break-word"
                      }}>
                        {emailStatus.type === "error" && "⚠ "}{emailStatus.type === "success" && "✓ "}{emailStatus.type === "info" && "⟳ "}{emailStatus.message}
                      </div>
                    )}
    
                    <div className="btn-row" style={{ display: "flex", justifyContent: "flex-end" }}>
                      <PBtn color="#d6f5e3" onClick={sendEmail} disabled={!emailForm.to || !emailForm.subject || isSendingEmail}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>{isSendingEmail ? "SENDING..." : "SEND EMAIL"} <IconArrowRight size={18} color="#000" /></span>
                      </PBtn>
                    </div>
                  </PBox>
    
                  <div style={{
                    border: "clamp(0.1875rem, 1vw, 0.375rem) solid #FFB347",
                    boxShadow: "clamp(0.1875rem, 1vw, 0.375rem) clamp(0.1875rem, 1vw, 0.375rem) 0 #E91E63",
                    background: "#050505",
                    overflow: "hidden",
                  }}>
                    {selectedJobForEmail && (
                      <DMGEInvoiceEditor
                        job={selectedJobForEmail}
                        profile={profile}
                        clients={clients}
                        onUpdate={setInvoiceEditorData}
                      />
                    )}
                  </div>
                </div>
    </div>
  );
}
