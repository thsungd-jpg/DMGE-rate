import React from "react";
import { PBox, PBtn, PCollapsible, PInput, PLbl, PStepper } from "../components/ui";
import { IconArrowLeft, IconLock, IconStar, IconTierAgency, IconTierFree, IconTierPro, IconUpload } from "../icons";
import { TIERS, canWhiteLabel, getUsageStats } from "../utils/subscription";
import { supabase } from "../utils/supabaseClient";

// Screen for tab "profile".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function ProfileScreen({ ctx }) {
  const {
    ColorSwatches,
    clients,
    currentUser,
    handleLogoUpload,
    handlePlanSelect,
    profile,
    resetAppData,
    saveProfile,
    setProfile,
    setTab,
    templates,
    todayPdfCount,
    userTier,
  } = ctx;

  return (
    <div className="legacy-page">
    <>
                <PBtn small color="#FFB347" onClick={() => setTab("calc")} style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.5rem", color: "#0A0A0A" }}>
                  <IconArrowLeft size={18} color="#0A0A0A" /> CALC
                </PBtn>
    
                <PCollapsible title="PLAYER INFO" accent="#000000" defaultOpen={false}>
                  <PBox style={{ marginBottom: "2.1875rem" }}>
                    <PLbl accent="#000000">PLAYER NAME</PLbl>
                    <input
                      type="text" value={profile.name} onChange={e => { const p = { ...profile, name: e.target.value }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                      style={{ width: "100%", fontFamily: "'Press Start 2P'", fontSize: "1.4375rem", padding: "clamp(0.75rem, 3.3vw, 1.5625rem)", border: "0.5rem solid #2a2a2a", boxSizing: "border-box", color: "#000000" }}
                    />
                  </PBox>
                  <PBox style={{ marginBottom: "2.1875rem" }}>
                    <PLbl accent="#000000">DEFAULT HOURLY</PLbl>
                    <PStepper value={profile.defaultBaseRate} onChange={v => { const p = { ...profile, defaultBaseRate: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} />
                  </PBox>
                </PCollapsible>
    
                <PCollapsible title="SUBSCRIPTION" accent="#000000" defaultOpen={false}>
                  <PBox bg="#1A1A1A" style={{ marginBottom: "1.5625rem" }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: "1.25rem" }}>
                      <PLbl accent="#FFB347">CURRENT PLAN</PLbl>
                      <span style={{
                        padding: '0.5rem 1rem',
                        background: (TIERS[userTier]?.color || '#9E9E9E') + '33',
                        border: `0.25rem solid ${TIERS[userTier]?.color || '#9E9E9E'}`,
                        color: TIERS[userTier]?.color || '#9E9E9E',
                        fontSize: "0.875rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}>
                        {userTier === 'free' && <IconTierFree size={24} color={TIERS[userTier]?.color || '#9E9E9E'} />}
                        {userTier === 'pro' && <IconTierPro size={24} color={TIERS[userTier]?.color || '#FFD700'} />}
                        {userTier === 'agency' && <IconTierAgency size={24} color={TIERS[userTier]?.color || '#E040FB'} />}
                        {TIERS[userTier]?.badge || 'FREE'}
                      </span>
                    </div>
    
                    {(() => {
                      const stats = getUsageStats(userTier, clients.length, templates.length, todayPdfCount);
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: "0.9375rem", marginBottom: "1.25rem" }}>
                          <div style={{ padding: "0.9375rem", border: '0.25rem solid #2a2a2a', background: '#1A1A1A' }}>
                            <div style={{ fontSize: "0.625rem", color: '#FFB34788', marginBottom: "0.5rem" }}>CLIENTS</div>
                            <div style={{ fontSize: "1rem", color: stats.clients.atLimit ? '#E91E63' : '#4CAF50' }}>
                              {stats.clients.used}/{stats.clients.max}
                            </div>
                          </div>
                          <div style={{ padding: "0.9375rem", border: '0.25rem solid #2a2a2a', background: '#1A1A1A' }}>
                            <div style={{ fontSize: "0.625rem", color: '#FFB34788', marginBottom: "0.5rem" }}>TEMPLATES</div>
                            <div style={{ fontSize: "1rem", color: stats.templates.atLimit ? '#E91E63' : '#4CAF50' }}>
                              {stats.templates.used}/{stats.templates.max}
                            </div>
                          </div>
                          <div style={{ padding: "0.9375rem", border: '0.25rem solid #2a2a2a', background: '#1A1A1A' }}>
                            <div style={{ fontSize: "0.625rem", color: '#FFB34788', marginBottom: "0.5rem" }}>PDFS TODAY</div>
                            <div style={{ fontSize: "1rem", color: stats.pdfsToday.atLimit ? '#E91E63' : '#4CAF50' }}>
                              {stats.pdfsToday.used}/{stats.pdfsToday.max}
                            </div>
                          </div>
                          <div style={{ padding: "0.9375rem", border: '0.25rem solid #2a2a2a', background: '#1A1A1A' }}>
                            <div style={{ fontSize: "0.625rem", color: '#FFB34788', marginBottom: "0.5rem" }}>HISTORY</div>
                            <div style={{ fontSize: "1rem", color: '#4CAF50' }}>
                              {stats.historyDays} DAYS
                            </div>
                          </div>
                        </div>
                      );
                    })()}
    
                    {userTier !== 'free' ? (
                      <PBox bg="#1A1A1A" style={{ textAlign: "center", padding: "1.25rem", border: "0.25rem dashed #E91E63" }}>
                        <div style={{ fontSize: "0.5625rem", color: "#FFB34788", marginBottom: "0.625rem" }}>STRIPE ACCOUNT</div>
                        <PBtn full color="#E91E63" onClick={() => handlePlanSelect('portal')} style={{ color: "white" }}>
                          MANAGE / CANCEL
                        </PBtn>
                        <div style={{ fontSize: "0.4375rem", color: "#666", marginTop: "0.625rem" }}>
                          OPEN STRIPE PORTAL TO CHANGE PLAN OR CANCEL
                        </div>
                      </PBox>
                    ) : (
                      <PBtn full color="#FFB347" onClick={() => setTab('pricing')} style={{ fontSize: "0.875rem", color: "#0A0A0A", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}>
                        <IconStar size={24} color="#0A0A0A" /> UPGRADE YOUR PLAN
                      </PBtn>
                    )}
                  </PBox>
                </PCollapsible>
    
                <PCollapsible title="INVOICE SETTINGS" accent="#000000" defaultOpen={false}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15.625rem), 1fr))", gap: "1.25rem" }}>
                    <PBox bg="#1A1A1A">
                      <PLbl accent="#FFB347">PREFIX</PLbl>
                      <PInput value={profile.invoicePrefix} onChange={v => { const p = { ...profile, invoicePrefix: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} placeholder="INV-" />
                    </PBox>
                    <PBox bg="#1A1A1A">
                      <PLbl accent="#FFB347">START #</PLbl>
                      <PInput type="number" value={profile.invoiceStartNumber} onChange={v => { const p = { ...profile, invoiceStartNumber: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} />
                    </PBox>
                  </div>
                  <PBox bg="#1A1A1A" style={{ marginTop: "1.5625rem" }}>
                    <PLbl accent="#FFB347">NEXT INVOICE</PLbl>
                    <div style={{ fontSize: "1.4375rem", color: "#4CAF50" }}>{profile.invoicePrefix}{(profile.lastInvoiceNumber || (profile.invoiceStartNumber - 1)) + 1}</div>
                  </PBox>
                </PCollapsible>
    
                <PCollapsible title="COMPANY BRANDING" accent="#000000" defaultOpen={false}>
                  <PBox bg="#1A1A1A" style={{ marginBottom: "1.5625rem" }}>
                    <PLbl accent="#FFB347">COMPANY NAME</PLbl>
                    <PInput value={profile.companyName} onChange={v => { const p = { ...profile, companyName: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} placeholder="Acme Corp" />
                  </PBox>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15.625rem), 1fr))", gap: "1.25rem", marginBottom: "1.5625rem" }}>
                    <PBox bg="#1A1A1A">
                      <PLbl accent="#FFB347">EMAIL</PLbl>
                      <PInput value={profile.companyEmail} onChange={v => { const p = { ...profile, companyEmail: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} placeholder="hi@acme.com" />
                    </PBox>
                    <PBox bg="#1A1A1A">
                      <PLbl accent="#FFB347">PHONE</PLbl>
                      <PInput value={profile.companyPhone} onChange={v => { const p = { ...profile, companyPhone: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} placeholder="555-0123" />
                    </PBox>
                  </div>
                  <PBox bg="#1A1A1A" style={{ marginBottom: "1.5625rem" }}>
                    <PLbl accent="#FFB347">ADDRESS</PLbl>
                    <textarea
                      value={profile.companyAddress}
                      onChange={e => { const p = { ...profile, companyAddress: e.target.value }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                      placeholder="123 Pixel St"
                      style={{ width: "100%", fontFamily: "'Press Start 2P'", fontSize: "0.75rem", padding: "1.5625rem", border: "0.5rem solid #2a2a2a", minHeight: 100, background: "#0A0A0A", color: "#FFB347" }}
                    />
                  </PBox>
                  <PBox bg="#1A1A1A" style={{ marginBottom: "1.5625rem" }}>
                    <PLbl accent="#FFB347">LOGO URL (PNG/SVG)</PLbl>
                    <PInput value={profile.logoUrl} onChange={v => { const p = { ...profile, logoUrl: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} placeholder="https://..." />
                  </PBox>
                  <PBox bg="#1A1A1A" style={{ marginBottom: "1.5625rem" }}>
                    <PLbl accent="#FFB347">PAYMENT INSTRUCTIONS</PLbl>
                    <textarea
                      value={profile.paymentInstructions}
                      onChange={e => { const p = { ...profile, paymentInstructions: e.target.value }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                      placeholder="Zelle: hi@acme.com / PayPal: @acme"
                      style={{ width: "100%", fontFamily: "'Press Start 2P'", fontSize: "0.75rem", padding: "1.5625rem", border: "0.5rem solid #2a2a2a", minHeight: 120, background: "#0A0A0A", color: "#FFB347" }}
                    />
                  </PBox>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15.625rem), 1fr))", gap: "1.25rem" }}>
                    <PBox bg="#1A1A1A">
                      <PLbl accent="#FFB347">TERMS</PLbl>
                      <PInput value={profile.invoiceTerms} onChange={v => { const p = { ...profile, invoiceTerms: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} placeholder="Net 14" />
                    </PBox>
                    <PBox bg="#1A1A1A">
                      <PLbl accent="#FFB347">TAX ID</PLbl>
                      <PInput value={profile.taxId} onChange={v => { const p = { ...profile, taxId: v }; setProfile(p); saveProfile(p, userTier, currentUser); }} placeholder="Optional" />
                    </PBox>
                  </div>
                </PCollapsible>
    
                <PCollapsible
                  title={<span style={{ display: "flex", alignItems: "center", gap: "8px" }}>AGENCY: WHITE-LABEL BRANDING {!canWhiteLabel(userTier) && <IconLock size={16} />}</span>}
                  accent="#000000"
                  defaultOpen={false}
                >
                  {!canWhiteLabel(userTier) ? (
                    <PBox bg="#2a2a2a" style={{ textAlign: "center", padding: "2rem" }}>
                      <div style={{ color: "#E040FB", fontSize: "0.75rem", marginBottom: "1rem" }}>AGENCY TIER REQUIRED</div>
                      <PBtn color="#E91E63" onClick={() => setTab('pricing')}>UPGRADE TO UNLOCK</PBtn>
                    </PBox>
                  ) : (
                    <>
                      <PBox style={{ marginBottom: "1.5625rem" }}>
                        <PLbl>WHITE-LABEL COMPANY NAME</PLbl>
                        <PInput
                          value={profile.branding?.companyName || ""}
                          onChange={v => { const p = { ...profile, branding: { ...profile.branding, companyName: v } }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                          placeholder="Overrides 'RATE' in Header"
                        />
                      </PBox>
    
                      <PBox style={{ marginBottom: "1.5625rem" }}>
                        <PLbl>CUSTOM LOGO (MAX 2MB)</PLbl>
                        <div style={{ display: "flex", gap: "1.25rem", alignItems: "center" }}>
                          {profile.branding?.logoBase64 && (
                            <div style={{ position: "relative", width: "clamp(48px, 14vw, 60px)", height: "clamp(48px, 14vw, 60px)", border: "4px solid var(--pixel-text, #2a2a2a)", background: "var(--pixel-surface, #fff)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", flexShrink: 0 }}>
                              <img src={profile.branding.logoBase64} style={{ maxWidth: "100%", maxHeight: "100%", imageRendering: "pixelated" }} alt="Logo" />
                              <button
                                onClick={() => { const p = { ...profile, branding: { ...profile.branding, logoBase64: "" } }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                                style={{ position: "absolute", top: "-10px", right: "-10px", background: "#f44336", color: "#fff", width: "clamp(20px, 6vw, 24px)", height: "clamp(20px, 6vw, 24px)", display: "flex", alignItems: "center", justifyContent: "center", border: "4px solid var(--pixel-text, #2a2a2a)", cursor: "pointer", fontFamily: "'Press Start 2P'", fontSize: "10px", padding: 0 }}
                              >X</button>
                            </div>
                          )}
                          <label style={{ display: "inline-flex", cursor: "pointer", background: "#1A1A1A", border: "0.25rem solid #FFB347", boxShadow: "0.25rem 0.25rem 0 #FFB347", padding: "0.9375rem" }}>
                            <IconUpload size={24} color="#FFB347" />
                            <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                          </label>
                        </div>
                      </PBox>
    
                      <PBox style={{ marginBottom: "1.5625rem", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1.25rem" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "0.9375rem", cursor: "pointer", fontFamily: "'Press Start 2P'", fontSize: "0.875rem", color: "var(--pixel-text, #2a2a2a)" }}>
                          <input
                            type="checkbox"
                            checked={profile.branding?.overrideThemes !== false}
                            onChange={e => { const p = { ...profile, branding: { ...profile.branding, overrideThemes: e.target.checked } }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                            style={{ transform: "scale(1.5)" }}
                          />
                          OVERRIDE DISCIPLINE COLORS
                        </label>
                        <PBtn small color="#1A1A1A" onClick={() => {
                          const confirmReset = window.confirm("Reset agency colors to base scheme?");
                          if (confirmReset) {
                            const p = { ...profile, branding: { ...profile.branding, bgColor: "", surfaceColor: "", textColor: "", accentColor: "", overrideThemes: true } };
                            setProfile(p); saveProfile(p, userTier);
                          }
                        }} style={{ color: "#FFB347" }}>RESET THEME</PBtn>
                      </PBox>
    
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15.625rem), 1fr))", gap: "1.25rem", marginBottom: "1.5625rem" }}>
                        <PCollapsible title="BG COLOR" bg="var(--pixel-surface)">
                          <input
                            type="color"
                            value={profile.branding?.bgColor || "#d5d5d5"}
                            onChange={e => { const p = { ...profile, branding: { ...profile.branding, bgColor: e.target.value } }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                            style={{ width: "100%", height: 40, border: "4px solid #2a2a2a", cursor: "pointer" }}
                          />
                          <ColorSwatches value={profile.branding?.bgColor || "#d5d5d5"} onChange={v => { const p = { ...profile, branding: { ...profile.branding, bgColor: v } }; setProfile(p); saveProfile(p, userTier, currentUser); }} />
                        </PCollapsible>
                        <PCollapsible title="SURFACE COLOR" bg="var(--pixel-surface)">
                          <input
                            type="color"
                            value={profile.branding?.surfaceColor || "#e0e0e0"}
                            onChange={e => { const p = { ...profile, branding: { ...profile.branding, surfaceColor: e.target.value } }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                            style={{ width: "100%", height: 40, border: "4px solid #2a2a2a", cursor: "pointer" }}
                          />
                          <ColorSwatches value={profile.branding?.surfaceColor || "#e0e0e0"} onChange={v => { const p = { ...profile, branding: { ...profile.branding, surfaceColor: v } }; setProfile(p); saveProfile(p, userTier, currentUser); }} />
                        </PCollapsible>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15.625rem), 1fr))", gap: "1.25rem", marginBottom: "1.5625rem" }}>
                        <PCollapsible title="LOGO PRIMARY COLOR" bg="var(--pixel-surface)">
                          <input
                            type="color"
                            value={profile.branding?.textColor || "#FFB347"}
                            onChange={e => { const p = { ...profile, branding: { ...profile.branding, textColor: e.target.value } }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                            style={{ width: "100%", height: 40, border: "4px solid #2a2a2a", cursor: "pointer" }}
                          />
                          <ColorSwatches value={profile.branding?.textColor || "#FFB347"} onChange={v => { const p = { ...profile, branding: { ...profile.branding, textColor: v } }; setProfile(p); saveProfile(p, userTier, currentUser); }} />
                        </PCollapsible>
                        <PCollapsible title="LOGO SECONDARY COLOR" bg="var(--pixel-surface)">
                          <input
                            type="color"
                            value={profile.branding?.accentColor || "#E91E63"}
                            onChange={e => { const p = { ...profile, branding: { ...profile.branding, accentColor: e.target.value } }; setProfile(p); saveProfile(p, userTier, currentUser); }}
                            style={{ width: "100%", height: 40, border: "4px solid #2a2a2a", cursor: "pointer" }}
                          />
                          <ColorSwatches value={profile.branding?.accentColor || "#E91E63"} onChange={v => { const p = { ...profile, branding: { ...profile.branding, accentColor: v } }; setProfile(p); saveProfile(p, userTier, currentUser); }} />
                        </PCollapsible>
                      </div>
    
                      <PBtn
                        full
                        color="#1A1A1A"
                        onClick={() => {
                          const config = JSON.stringify(profile.branding, null, 2);
                          const blob = new Blob([config], { type: "application/json" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `brand-config-${profile.companyName || "agency"}.json`;
                          a.click();
                        }}
                        style={{ color: "#fff", fontSize: "0.625rem" }}
                      >
                        DOWNLOAD BRAND CONFIG (JSON)
                      </PBtn>
                    </>
                  )}
                </PCollapsible>
    
                <PCollapsible title="DANGER ZONE" accent="#f44336" defaultOpen={false}>
                  <PBox bg="#2a2a2a" style={{ textAlign: "center", padding: "1.5625rem", border: "4px solid #f44336" }}>
                    <div style={{ color: "#f44336", fontSize: "0.625rem", marginBottom: "1.25rem" }}>PERMANENTLY DELETE ALL LOCAL DATA</div>
                    <PBtn full color="#f44336" onClick={resetAppData} style={{ color: "white" }}>RESET ALL APP DATA</PBtn>
                    <div style={{ color: "#666", fontSize: "0.4375rem", marginTop: "0.9375rem" }}>This will clear jobs, clients, templates, and profile settings.</div>
                  </PBox>
                </PCollapsible>
    
                <PBtn full color="#1A1A1A" style={{ border: "0.5rem solid #E91E63", color: "#E91E63", marginTop: "2.1875rem" }} onClick={() => supabase.auth.signOut()}>LOGOUT</PBtn>
              </>
    </div>
  );
}
