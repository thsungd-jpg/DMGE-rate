import React from "react";
import { PBtn, PInput, PStepper } from "../components/ui";
import { Screen, Field } from "../components/kit";
import { IconDelete, IconJobs, IconLogout, IconProfile } from "../icons";
import { supabase } from "../utils/supabaseClient";
import SettingsCard, { Group } from "./profile/SettingsCard";
import BrandingCard from "./profile/BrandingCard";
import BaseRateFinder from "./profile/BaseRateFinder";
import PlanCard from "./profile/PlanCard";
import "./profile.css";

const SECTIONS = [
  { id: "account", label: "Account" },
  { id: "ratefinder", label: "Base rate" },
  { id: "invoice", label: "Invoices" },
  { id: "branding", label: "Branding" },
  { id: "plan", label: "Plan" },
  { id: "danger", label: "Danger zone" },
];

function jumpTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const calm = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
}

// Screen for tab "profile".
// Everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function ProfileScreen({ ctx }) {
  const {
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

  // Every field saves as you type, exactly as before: set the profile, then persist it.
  const update = (patch) => {
    const p = { ...profile, ...patch };
    setProfile(p);
    saveProfile(p, userTier, currentUser);
  };

  return (
    <Screen
      eyebrow="Settings"
      title={<>Your <em>profile</em></>}
      subtitle="Your details, invoice defaults and plan. Changes save as you type."
    >
      <div className="prof">
        <nav className="prof-nav" aria-label="Profile sections">
          {SECTIONS.map((s) => (
            <button key={s.id} type="button" onClick={() => jumpTo(s.id)}>{s.label}</button>
          ))}
        </nav>

        <div className="prof-stack">
          {/* ACCOUNT + DEFAULTS */}
          <SettingsCard id="account" iconTone="blue" icon={<IconProfile size={22} />} title="Account" description="How you appear in the app, and where the calculator starts.">
            <div className="prof-grid2">
              <Field label="Your name" htmlFor="prof-name">
                <PInput id="prof-name" autoComplete="name" value={profile.name ?? ""} placeholder="Alex Rivera" onChange={(v) => update({ name: v })} />
              </Field>
              <Group id="prof-rate-label" label="Default hourly rate" hint="The base rate the calculator starts from when you open the app.">
                <PStepper value={profile.defaultBaseRate} onChange={(v) => update({ defaultBaseRate: v })} />
              </Group>
            </div>
          </SettingsCard>

          {/* BASE-RATE FINDER (every plan) */}
          <BaseRateFinder profile={profile} update={update} />

          {/* INVOICE SETTINGS */}
          <SettingsCard id="invoice" iconTone="butter" icon={<IconJobs size={22} />} title="Invoice settings" description="Numbering, your business details and payment terms. They fill in every invoice for you.">
            <div className="prof-group prof-group--first">
              <h3>Numbering</h3>
              <div className="prof-grid2">
                <Field label="Prefix" htmlFor="prof-prefix">
                  <PInput id="prof-prefix" value={profile.invoicePrefix ?? ""} placeholder="INV-" onChange={(v) => update({ invoicePrefix: v })} />
                </Field>
                <Field label="Starting number" htmlFor="prof-start">
                  <PInput id="prof-start" type="number" value={profile.invoiceStartNumber ?? ""} onChange={(v) => update({ invoiceStartNumber: v })} />
                </Field>
              </div>
              <p className="prof-next" role="status">
                <span>Next invoice</span>
                <b>{profile.invoicePrefix}{(profile.lastInvoiceNumber || (profile.invoiceStartNumber - 1)) + 1}</b>
              </p>
            </div>

            <div className="prof-group">
              <h3>Your business</h3>
              <div className="prof-fields">
                <Field label="Company name" htmlFor="prof-company">
                  <PInput id="prof-company" autoComplete="organization" value={profile.companyName ?? ""} placeholder="Acme Corp" onChange={(v) => update({ companyName: v })} />
                </Field>
                <div className="prof-grid2">
                  <Field label="Email" htmlFor="prof-email">
                    <PInput id="prof-email" inputMode="email" autoComplete="email" value={profile.companyEmail ?? ""} placeholder="hi@acme.com" onChange={(v) => update({ companyEmail: v })} />
                  </Field>
                  <Field label="Phone" htmlFor="prof-phone">
                    <PInput id="prof-phone" inputMode="tel" autoComplete="tel" value={profile.companyPhone ?? ""} placeholder="555-0123" onChange={(v) => update({ companyPhone: v })} />
                  </Field>
                </div>
                <Field label="Address" htmlFor="prof-address">
                  <textarea id="prof-address" autoComplete="street-address" value={profile.companyAddress ?? ""} placeholder={"123 Garden Lane\nPortland, OR"} onChange={(e) => update({ companyAddress: e.target.value })} />
                </Field>
                <div className="prof-grid2">
                  <Field label="Tax ID" htmlFor="prof-tax" hint="Optional">
                    <PInput id="prof-tax" value={profile.taxId ?? ""} placeholder="" onChange={(v) => update({ taxId: v })} />
                  </Field>
                  <Field label="Logo URL (PNG/SVG)" htmlFor="prof-logourl">
                    <PInput id="prof-logourl" inputMode="url" value={profile.logoUrl ?? ""} placeholder="https://..." onChange={(v) => update({ logoUrl: v })} />
                  </Field>
                </div>
              </div>
            </div>

            <div className="prof-group">
              <h3>Payment</h3>
              <div className="prof-fields">
                <Field label="Terms" htmlFor="prof-terms">
                  <PInput id="prof-terms" value={profile.invoiceTerms ?? ""} placeholder="Net 14" onChange={(v) => update({ invoiceTerms: v })} />
                </Field>
                <Field label="Payment instructions" htmlFor="prof-pay">
                  <textarea id="prof-pay" value={profile.paymentInstructions ?? ""} placeholder="Zelle: hi@acme.com / PayPal: @acme" onChange={(e) => update({ paymentInstructions: e.target.value })} />
                </Field>
              </div>
            </div>
          </SettingsCard>

          {/* BRANDING (AGENCY) */}
          <BrandingCard
            profile={profile} userTier={userTier} currentUser={currentUser}
            setProfile={setProfile} saveProfile={saveProfile}
            handleLogoUpload={handleLogoUpload} setTab={setTab}
          />

          {/* PLAN */}
          <PlanCard
            userTier={userTier} clients={clients} templates={templates} todayPdfCount={todayPdfCount}
            handlePlanSelect={handlePlanSelect} setTab={setTab}
          />

          {/* DANGER ZONE */}
          <SettingsCard id="danger" danger iconTone="danger" icon={<IconDelete size={22} />} title="Danger zone" description="These actions cannot be undone.">
            <div className="prof-row">
              <p className="prof-row-text"><strong>Reset all app data</strong>Clears your jobs, clients, templates and profile settings from this device, then signs you out.</p>
              <button type="button" className="prof-btn-danger" onClick={resetAppData}>Reset all app data</button>
            </div>
          </SettingsCard>

          <div className="prof-signout">
            <p>{currentUser?.email ? <>Signed in as <strong>{currentUser.email}</strong></> : "You are signed in."}</p>
            <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => supabase.auth.signOut()}><IconLogout size={18} /> Sign out</PBtn>
          </div>
        </div>
      </div>
    </Screen>
  );
}
