import React, { useEffect, useRef, useState } from "react";
import FloatingDock from "../components/FloatingDock";
import ThemeToggle from "../components/ThemeToggle";
import { Wordmark } from "../components/Brand";
import { TIERS } from "../utils/subscription";
import {
  IconCalc, IconJobs, IconTemplates, IconClients, IconInsights, IconProfile, IconMore, IconBook, IconTag, IconLogout,
  IconTierFree, IconTierPro, IconTierAgency, IconLock,
} from "../icons";
import "../styles/appchrome.css";

const TIER_ICON = { free: IconTierFree, pro: IconTierPro, agency: IconTierAgency };

/** Fixed top bar: brand, editable base rate (calculator only), plan chip, day/night toggle. */
export function AppTopBar({ tab, userTier, setTab, baseRate, baseRateHasCents, onBaseRateChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const commit = () => {
    const n = parseFloat(draft);
    if (!isNaN(n) && n > 0) onBaseRateChange(n);
    setEditing(false);
  };
  const TierIcon = TIER_ICON[userTier] || IconTierFree;
  const tier = TIERS[userTier] || TIERS.free;

  return (
    <header className="app-topbar">
      <button type="button" className="app-brand" onClick={() => setTab("calc")} aria-label="DMGE, go to calculator">
        <Wordmark size={19} />
      </button>
      <div className="app-topbar-right">
        {tab === "calc" && (
          editing ? (
            <label className="app-rate app-rate--edit">
              <span>Base rate $</span>
              <input
                ref={inputRef} type="number" inputMode="decimal" value={draft} aria-label="Base rate"
                onChange={(e) => setDraft(e.target.value)} onBlur={commit}
                onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
              />
            </label>
          ) : (
            <button type="button" className="app-rate" onClick={() => { setDraft(String(baseRate)); setEditing(true); }} title="Edit base rate">
              <span>Base rate</span>
              <b>${baseRateHasCents ? Number(baseRate).toFixed(2) : Math.round(baseRate)}</b>
            </button>
          )
        )}
        <button type="button" className={`app-tier app-tier--${userTier}`} onClick={() => setTab("pricing")} title="Plans">
          <TierIcon size={15} /> {tier.name}
        </button>
        <div className="app-theme"><ThemeToggle /></div>
      </div>
    </header>
  );
}

/** Floating dock + "More" sheet. */
export function AppDock({ tab, setTab, canViewInsights, onLockedInsights, jobCount, onSignOut }) {
  const [sheet, setSheet] = useState(false);
  const sheetRef = useRef(null);

  // close the sheet on outside click / Esc / navigation
  useEffect(() => { setSheet(false); }, [tab]);
  useEffect(() => {
    if (!sheet) return undefined;
    const onDown = (e) => { if (sheetRef.current && !sheetRef.current.contains(e.target) && !e.target.closest(".lq-dock")) setSheet(false); };
    const onKey = (e) => { if (e.key === "Escape") setSheet(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [sheet]);

  const items = [
    { id: "calc", label: "Calc", icon: <IconCalc size={20} /> },
    { id: "history", label: "Jobs", icon: <IconJobs size={20} />, badge: jobCount || "" },
    { id: "templates", label: "Templates", icon: <IconTemplates size={20} /> },
    { id: "clients", label: "Clients", icon: <IconClients size={20} /> },
    { id: "analytics", label: "Insights", icon: canViewInsights ? <IconInsights size={20} /> : <IconLock size={20} /> },
    { id: "profile", label: "Profile", icon: <IconProfile size={20} /> },
    { id: "more", label: "More", icon: <IconMore size={20} /> },
  ];
  const active = ["tutorial", "pricing"].includes(tab) ? "more" : tab === "invoice_editor" ? "history" : tab;

  const select = (id) => {
    if (id === "more") { setSheet((s) => !s); return; }
    if (id === "analytics" && !canViewInsights) { onLockedInsights(); return; }
    setTab(id);
  };

  return (
    <>
      {sheet && (
        <div className="lq-dock-sheet" ref={sheetRef} role="menu">
          <button type="button" role="menuitem" onClick={() => setTab("tutorial")}><IconBook size={19} /> Tutorial</button>
          <button type="button" role="menuitem" onClick={() => setTab("pricing")}><IconTag size={19} /> Plans &amp; billing</button>
          <button type="button" role="menuitem" onClick={onSignOut}><IconLogout size={19} /> Sign out</button>
        </div>
      )}
      <FloatingDock position="bottom" items={items} activeId={active} onSelect={select} ariaLabel="App navigation" />
    </>
  );
}
