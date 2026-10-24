import React from "react";
import { MatChip, OptionGrid, PBox, PBtn, PCollapsible, PInput, PLbl, PSelect } from "../components/ui";
import PixelArrow from "../components/PixelArrow";
import { clientMods, complexityMods, usageRightsMods } from "../utils/pricing";
import { IconCheck, IconStar } from "../icons";

// Screen for tab "calc".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function CalcScreen({ ctx }) {
  const {
    ALL_DATA,
    advanceGlow,
    catData,
    category,
    clients,
    customMaterials,
    form,
    glowStep,
    handleAddCustomMaterial,
    handleCalc,
    handleReset,
    handleResetModel,
    handleSave,
    handleToggleMute,
    matPriceOverrides,
    matQtys,
    materialSummary,
    materialsCost,
    mats,
    model,
    modelIdx,
    muted,
    price,
    resetKey,
    role,
    roleIdx,
    saved,
    selectedClientId,
    selectedTier,
    set,
    setCategory,
    setForm,
    setMatPriceOverrides,
    setMatQtys,
    setModelIdx,
    setNewTemplateForm,
    setPrice,
    setRoleIdx,
    setSelectedClientId,
    setSelectedTier,
    setShowSaveTemplateModal,
    setTab,
  } = ctx;

  return (
    <div className="legacy-page">
    <>
                <div style={{ marginBottom: "2.1875rem" }}>
                  {form.id && (
                    <div style={{
                      background: "rgba(233,30,99,0.1)", border: "0.25rem solid #E91E63",
                      padding: "0.625rem", marginBottom: "1rem", textAlign: "center",
                      fontFamily: "'Press Start 2P'", fontSize: "0.6875rem", color: "#E91E63"
                    }}>
                      EDITING MODE: {form.invoiceNumber}
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: "0.5rem" }}>
                    <PLbl style={{ marginBottom: 0 }}>QUICK CLIENT SELECT</PLbl>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <PBtn small color="#FFB347" onClick={handleToggleMute} style={{ padding: "0.625rem 0.9375rem", fontSize: "0.875rem", color: "#0A0A0A" }} title={muted ? "SFX OFF" : "SFX ON"}>
                        {muted ? "SFX:OFF" : "SFX:ON"}
                      </PBtn>
                      <PBtn small color="#E91E63" onClick={() => setTab("tutorial")} style={{ padding: "0.625rem 0.9375rem", fontSize: "0.875rem" }}>TUTORIAL</PBtn>
                    </div>
                  </div>
                  <PSelect
                    value={selectedClientId}
                    onChange={id => {
                      setSelectedClientId(id);
                      const c = clients.find(cl => cl.id === id);
                      if (c) {
                        setForm(f => ({ ...f, complexity: c.preferredComplexity, usage: c.preferredUsageRights, clientType: c.preferredClientType }));
                      }
                      setPrice(null);
                    }}
                    options={[{ label: "None (Default Rates)", value: "" }, ...clients.map(c => ({ label: `${c.name} (${c.rateMultiplier}x)`, value: c.id }))]}
                    iconType="none"
                  />
                </div>
    
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <div style={{ gridColumn: "1 / -1", position: "relative" }} className={glowStep === 'role' ? 'dmge-glow' : ''} onClick={() => advanceGlow('role')}>
                    {glowStep === 'role' && (
                      <span style={{ position: "absolute", left: "-3.5rem", top: "50%", transform: "translateY(-50%)", zIndex: 5, pointerEvents: "none" }}>
                        <PixelArrow direction="right" size={48} bounce />
                      </span>
                    )}
                    <PCollapsible key={`discipline-${resetKey}`} title="ROLE" defaultOpen={false} collapsedInfo={`${category} / ${role.name} / ${model.type}`}>
                      <PLbl>CATEGORY</PLbl>
                      <PSelect
                        value={category}
                        onChange={v => { setCategory(v); setRoleIdx(0); setModelIdx(0); handleResetModel(ALL_DATA[v].roles[0].models[0]); }}
                        options={Object.keys(ALL_DATA).map(c => ({ label: c, value: c }))}
                        iconType="cat"
                      />
    
                      <PLbl>ROLE</PLbl>
                      <PSelect
                        value={roleIdx}
                        onChange={v => { setRoleIdx(v); setModelIdx(0); handleResetModel(catData.roles[v].models[0]); }}
                        options={catData.roles.map((r, i) => ({ label: r.name, value: i }))}
                        iconType="none"
                      />
    
                      <PLbl>PRICING MODEL</PLbl>
                      <PSelect
                        value={modelIdx}
                        onChange={v => { setModelIdx(v); handleResetModel(role.models[v]); }}
                        options={role.models.map((m, i) => ({ label: `${m.type} (${m.unit})`, value: i }))}
                        iconType="none"
                      />
                    </PCollapsible>
                  </div>
    
                  <PCollapsible key={`quantity-${resetKey}`} title="QTY" defaultOpen={false} collapsedInfo={`${form.units} ${model.unit.replace("per hour", "per hr")}`}>
                    <div style={{ padding: "0.25rem 0" }}>
                      <PLbl style={{ marginBottom: "0.75rem" }}>QUANTITY</PLbl>
                      <PInput type="number" value={form.units} onChange={set("units")} placeholder="1" min={0.1} step={1} />
                    </div>
                  </PCollapsible>
    
                  <PCollapsible key={`complexity-${resetKey}`} title="COMPLEX" defaultOpen={false} collapsedInfo={form.complexity} tooltip="Simple projects get lower rates; Masterpieces command premium pricing">
                    <OptionGrid options={complexityMods} value={form.complexity} onChange={set("complexity")} cols={4} />
                  </PCollapsible>
    
                  <div style={{ position: "relative" }} className={glowStep === 'clientType' ? 'dmge-glow' : ''} onClick={() => advanceGlow('clientType')}>
                    {glowStep === 'clientType' && (
                      <span style={{ position: "absolute", left: "-3.5rem", top: "50%", transform: "translateY(-50%)", zIndex: 5, pointerEvents: "none" }}>
                        <PixelArrow direction="right" size={48} bounce />
                      </span>
                    )}
                    <PCollapsible key={`clientType-${resetKey}`} title="CLIENT" defaultOpen={false} collapsedInfo={form.clientType} tooltip="Corporate clients typically pay 2-2.5x more">
                      <OptionGrid options={clientMods} value={form.clientType} onChange={(v) => { set("clientType")(v); advanceGlow('clientType'); }} cols={4} />
                    </PCollapsible>
                  </div>
    
                  <div style={{ position: "relative" }} className={glowStep === 'usage' ? 'dmge-glow' : ''} onClick={() => advanceGlow('usage')}>
                    {glowStep === 'usage' && (
                      <span style={{ position: "absolute", left: "-3.5rem", top: "50%", transform: "translateY(-50%)", zIndex: 5, pointerEvents: "none" }}>
                        <PixelArrow direction="right" size={48} bounce />
                      </span>
                    )}
                    <PCollapsible key={`usage-${resetKey}`} title="USAGE" defaultOpen={false} collapsedInfo={form.usage} tooltip="Personal = one-time use; Commercial = broader rights">
                      <OptionGrid options={usageRightsMods} value={form.usage} onChange={(v) => { set("usage")(v); advanceGlow('usage'); }} cols={2} />
                    </PCollapsible>
                  </div>
    
                  <PCollapsible key={`revisions-${resetKey}`} title="REVS" defaultOpen={false} collapsedInfo={`${form.revisions} revisions`} tooltip="0 revisions = discount; 3+ revisions = premium">
                    <div style={{ padding: "0.25rem 0" }}>
                      <PLbl style={{ marginBottom: "0.75rem" }}>REVISIONS</PLbl>
                      <PInput type="number" value={form.revisions} onChange={set("revisions")} placeholder="0" min={0} step={1} />
                    </div>
                  </PCollapsible>
    
                  <PCollapsible key={`travel-${resetKey}`} title="COMMUTE" defaultOpen={false} collapsedInfo={`$${(form.travelExpense || 0).toFixed(2)}`} tooltip="Add direct travel expenses to quote">
                    <div style={{ padding: "0.25rem 0" }}>
                      <PLbl style={{ marginBottom: "0.75rem" }}>COMMUTE COST</PLbl>
                      <PInput type="number" value={form.travelExpense || 0} onChange={v => { setForm(f => ({ ...f, travelExpense: v })); setPrice(null); }} placeholder="0.00" />
                    </div>
                  </PCollapsible>
    
                  <PCollapsible key={`rush-${resetKey}`} title="RUSH" defaultOpen={false} collapsedInfo={form.rush ? "Yes (+30%)" : "No"} tooltip="30% markup for expedited delivery">
                    <div style={{ padding: "0.25rem 0" }}>
                      <PLbl style={{ marginBottom: "0.75rem" }}>RUSH ORDER</PLbl>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                        <PBtn full small color={form.rush ? "#FFB347" : "#1A1A1A"} onClick={() => { setForm(f => ({ ...f, rush: true })); setPrice(null); }}>YES</PBtn>
                        <PBtn full small color={!form.rush ? "#FFB347" : "#1A1A1A"} onClick={() => { setForm(f => ({ ...f, rush: false })); setPrice(null); }}>NO</PBtn>
                      </div>
                    </div>
                  </PCollapsible>
    
                  <PCollapsible key={`platform-${resetKey}`} title="FEE" defaultOpen={false} collapsedInfo={form.platformFee ? `${form.platformFee}%` : "None"} tooltip="Add % to embed payment processing costs">
                    <div style={{ padding: "0.25rem 0" }}>
                      <PLbl style={{ marginBottom: "0.75rem" }}>PLATFORM (%)</PLbl>
                      <PInput type="number" value={form.platformFee || 0} onChange={v => { setForm(f => ({ ...f, platformFee: v })); setPrice(null); }} placeholder="0" />
                    </div>
                  </PCollapsible>
    
                  <div style={{ gridColumn: "1 / -1" }}>
                    <PCollapsible key={`materials-${resetKey}`} title="SUPPLIES" defaultOpen={false} collapsedInfo={materialSummary}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 14rem), 1fr))", gap: "0.5rem" }}>
                        {(() => {
                          const allMats = [...mats, ...customMaterials]; return allMats.map((mat, idx) => {
                            const displayMat = { ...mat, cost: matPriceOverrides[mat.name] ?? mat.cost };
                            const isLastOdd = allMats.length % 2 === 1 && idx === allMats.length - 1;
                            return (
                              <div key={mat.name} style={isLastOdd ? { gridColumn: "1 / -1" } : undefined}>
                                <MatChip
                                  mat={displayMat} qty={matQtys[mat.name] || 0}
                                  accent="#E91E63" bg="#FFB347"
                                  onAdd={() => setMatQtys(q => ({ ...q, [mat.name]: (q[mat.name] || 0) + 1 }))}
                                  onRemove={() => setMatQtys(q => ({ ...q, [mat.name]: Math.max(0, (q[mat.name] || 0) - 1) }))}
                                  onCostChange={(name, cost) => setMatPriceOverrides(o => ({ ...o, [name]: cost }))}
                                />
                              </div>
                            );
                          });
                        })()}
                        <div style={{ gridColumn: "1 / -1" }}>
                          <PBtn full color="#FFB347" small onClick={handleAddCustomMaterial} style={{ marginTop: "0.5rem" }}>+ ADD CUSTOM ITEM</PBtn>
                        </div>
                      </div>
                      {materialsCost > 0 && (
                        <div style={{ fontFamily: "'Press Start 2P'", fontSize: "1.4375rem", color: "#FFB347", textAlign: "right", marginTop: "1.5625rem" }}>
                          MT SUB: ${materialsCost.toFixed(2)}
                        </div>
                      )}
                    </PCollapsible>
                  </div>
    
                  <div style={{ gridColumn: "1 / -1" }}>
                    <PCollapsible key={`notes-${resetKey}`} title="INVOICE NOTES" defaultOpen={false} collapsedInfo={form.notes ? "Has Notes" : "None"} tooltip="Specific details for this job/invoice">
                      <PLbl>JOB NOTES</PLbl>
                      <textarea
                        value={form.notes}
                        onChange={e => { setForm(f => ({ ...f, notes: e.target.value })); setPrice(null); }}
                        placeholder="Specific job details..."
                        style={{ width: "100%", fontFamily: "'Press Start 2P'", fontSize: "0.75rem", padding: "1.25rem", border: "0.5rem solid #FFB347", minHeight: 100, background: "#0A0A0A", color: "#FFB347" }}
                      />
                    </PCollapsible>
                  </div>
                </div>
    
                <div className="action-buttons" style={{ display: "flex", gap: "1.25rem", marginBottom: "2.5rem", position: "relative" }}>
                  {glowStep === 'calculate' && (
                    <span style={{ position: "absolute", left: "-3.5rem", top: "50%", transform: "translateY(-50%)", zIndex: 5, pointerEvents: "none" }}>
                      <PixelArrow direction="right" size={56} bounce />
                    </span>
                  )}
                  <PBtn color="#E91E63" onClick={handleCalc} glow={glowStep === 'calculate'} style={{ flex: 1, display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}><IconStar size={24} color="#0A0A0A" /> CALCULATE <IconStar size={24} color="#0A0A0A" /></PBtn>
                  <PBtn color="#FFB347" onClick={handleReset} style={{ flex: 1 }}>↺ RESET</PBtn>
                </div>
    
                {price && (
                  <div className="res-in" style={{ marginTop: "2.5rem" }}>
                    <PBox bg="#1A1A1A" shadowColor="#E91E63" style={{ boxShadow: `0.9375rem 0.9375rem 0 #E91E63` }}>
                      <div style={{ textAlign: "center", marginBottom: "2.1875rem" }}>
                        <div style={{ fontSize: "1.125rem", color: "#FFB347", marginBottom: "1.5625rem", display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}><IconStar size={24} color="#FFB347" /> ESTIMATED TOTAL <IconStar size={24} color="#FFB347" /></div>
                        <div style={{ fontSize: "5rem", color: "#FFB347" }}>${Math.round(price[selectedTier])}</div>
                        <div style={{ fontSize: "0.75rem", color: "#FFB34788", marginTop: "0.5rem" }}>TAP A TIER BELOW TO CHANGE</div>
                      </div>
                      <div className="price-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.25rem", marginBottom: "2.1875rem" }}>
                        {[["BUDGET", "low", price.low, "#121212"], [<span key="fairlbl" style={{ display: "flex", gap: "4px", justifyContent: "center", alignItems: "center" }}>FAIR <IconStar size={20} color="#0A0A0A" /></span>, "fair", price.fair, "#FFB347"], ["PREMIUM", "premium", price.premium, "#1A1A1A"]].map(([lbl, tierKey, val, bg]) => {
                          const isSelected = selectedTier === tierKey;
                          return (
                            <PBox key={tierKey} bg={bg} shadowColor="#E91E63" onClick={() => setSelectedTier(tierKey)} style={{ textAlign: "center", padding: "1.5625rem 0.625rem", cursor: "pointer", border: isSelected ? "0.375rem solid #E91E63" : undefined, transform: isSelected ? "translate(-0.125rem, -0.125rem)" : "none", boxShadow: isSelected ? "0.625rem 0.625rem 0 #E91E63" : undefined, transition: "transform 0.05s, box-shadow 0.05s" }}>
                              <div style={{ fontSize: "2.0625rem", color: bg === "#FFB347" ? "#0A0A0A" : "#FFB347", marginBottom: "0.625rem" }}>${Math.round(val)}</div>
                              <div style={{ fontSize: "0.9375rem", color: bg === "#FFB347" ? "#0A0A0A88" : "#888" }}>{lbl}</div>
                            </PBox>
                          );
                        })}
                      </div>
                      <div className="btn-row" style={{ display: "flex", gap: "0.9375rem" }}>
                        <PBtn full color={saved ? "#FFB347" : "#E91E63"} onClick={handleSave} style={{ flex: 1.5 }}>
                          {saved ? <span style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "center" }}><IconCheck size={24} /> SAVED</span> : "SAVE TO LOG"}
                        </PBtn>
                        <PBtn full color="#FFB347" onClick={() => { setNewTemplateForm({ name: "", notes: "" }); setShowSaveTemplateModal(true); }} style={{ flex: 1, display: "flex", gap: "0.5rem", justifyContent: "center", alignItems: "center" }}>
                          <IconStar size={24} /> SAVE AS TEMPLATE
                        </PBtn>
                      </div>
                    </PBox>
                  </div>
                )}
              </>
    </div>
  );
}
