import React, { useState } from "react";
import { PBtn, PInput } from "../../components/ui";
import { Field } from "../../components/kit";
import { IconDownload, IconLock, IconUpload, IconVisual } from "../../icons";
import { PALETTE } from "../../styles/palette";
import { canWhiteLabel } from "../../utils/subscription";
import { brandTokens } from "../../utils/brandTheme";
import { useTheme } from "../../styles/theme";
import SettingsCard, { Group } from "./SettingsCard";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

// Profiles saved before the redesign carry the old retro defaults in every branding color. App.jsx treats them as
// "not customised"; the pickers do the same and show the Sorbet Ink color instead. (Stored without "#" on purpose:
// these are legacy data to recognise, not colors this screen paints with.)
const LEGACY_UNSET = ["1a1a1a", "0a0a0a", "ffb347", "e91e63"];
const isUnset = (v) => !v || LEGACY_UNSET.includes(String(v).toLowerCase().replace(/^#/, ""));
const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v || "");

const SWATCHES = Object.entries(PALETTE).map(([key, hex]) => ({
  hex,
  name: key.replace(/([A-Z0-9])/g, " $1").toLowerCase(),
}));

/** Native color input + the identity palette as one-tap presets. Same value flow as the old ColorSwatches. */
function ColorField({ id, label, value, fallback, onChange }) {
  const shown = !isUnset(value) && isHex(value) ? value : fallback;
  return (
    <div className="prof-color">
      <div className="prof-color-top">
        <label className="kit-field-label" htmlFor={id}>{label}</label>
        <code className="prof-hex">{shown.toUpperCase()}</code>
      </div>
      <input id={id} className="prof-colorinput" type="color" value={shown} onChange={(e) => onChange(e.target.value)} />
      <div className="prof-swatches" role="group" aria-label={`${label} presets`}>
        {SWATCHES.map((s) => (
          <button
            key={s.hex} type="button" className="prof-swatch" title={s.name} aria-label={s.name}
            aria-pressed={shown.toLowerCase() === s.hex.toLowerCase()}
            style={{ background: s.hex }} onClick={() => onChange(s.hex)}
          />
        ))}
      </div>
    </div>
  );
}

export default function BrandingCard({ profile, userTier, currentUser, setProfile, saveProfile, handleLogoUpload, setTab }) {
  const [logoError, setLogoError] = useState("");
  const branding = profile.branding || {};
  const unlocked = canWhiteLabel(userTier);
  const [theme] = useTheme();
  const tokens = brandTokens(branding, { dark: theme !== "light" }); // what the app will really use (colours that would not read are replaced)

  const updateBranding = (patch) => {
    const p = { ...profile, branding: { ...profile.branding, ...patch } };
    setProfile(p);
    saveProfile(p, userTier, currentUser);
  };

  const colors = {
    bg: isUnset(branding.bgColor) ? PALETTE.cream : branding.bgColor,
    surface: isUnset(branding.surfaceColor) ? PALETTE.paper : branding.surfaceColor,
    text: isUnset(branding.textColor) ? PALETTE.ink : branding.textColor,
    accent: isUnset(branding.accentColor) ? PALETTE.pink : branding.accentColor,
  };

  const v = tokens?.vars || {};
  const on = branding.overrideThemes !== false;
  const pv = {
    bg: (on && v["--brand-bg"]) || colors.bg, title: (on && v["--brand-title"]) || colors.text, glow: (on && v["--brand-glow"]) || colors.accent,
    fill: (on && v["--brand-fill"]) || colors.accent, surface: (on && v["--brand-surface"]) || colors.surface, ink: (on && v["--brand-ink"]) || colors.text,
  };

  const onLogoPicked = (e) => {
    const file = e.target.files?.[0];
    if (file && file.size > MAX_LOGO_BYTES) {
      setLogoError("That image is over 2 MB. Choose a smaller PNG, SVG or JPG.");
      e.target.value = "";
      return;
    }
    setLogoError("");
    handleLogoUpload(e); // existing handler: reads the file and saves it to the profile
    e.target.value = ""; // lets the same file be picked again after removing it
  };

  const resetTheme = () => {
    const confirmReset = window.confirm("Reset your colors to the DMGE look? Your name and logo stay.");
    if (confirmReset) {
      const p = { ...profile, branding: { ...profile.branding, bgColor: "", surfaceColor: "", textColor: "", accentColor: "", overrideThemes: true } };
      setProfile(p); saveProfile(p, userTier, currentUser);
    }
  };

  const downloadConfig = () => {
    const config = JSON.stringify(profile.branding, null, 2);
    const blob = new Blob([config], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brand-config-${profile.companyName || "agency"}.json`;
    a.click();
  };

  const badge = <span className="prof-badge">{unlocked ? "Agency" : <><IconLock size={14} /> Agency</>}</span>;

  if (!unlocked) {
    return (
      <SettingsCard
        id="branding" iconTone="lilac" icon={<IconVisual size={22} />}
        title="White-label branding"
        description="Put your own name, logo and colors on invoices, PDFs, emails and the app. Clients never see DMGE."
        aside={badge}
      >
        <div className="prof-locked">
          <span className="prof-locked-icon" aria-hidden="true"><IconLock size={22} /></span>
          <p><strong>Available on the Agency plan</strong>Upgrade to brand everything your clients see.</p>
          <PBtn color="var(--pink)" onClick={() => setTab("pricing")}>Upgrade to unlock</PBtn>
        </div>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard
      id="branding" iconTone="lilac" icon={<IconVisual size={22} />}
      title="White-label branding"
      description="Put your own name, logo and colors on invoices, PDFs, emails and the app. Clients never see DMGE."
      aside={badge}
    >
      <div className="prof-fields">
        <Field label="Brand name" htmlFor="prof-brand-name" hint="Replaces the DMGE name on your invoices and PDFs.">
          <PInput
            id="prof-brand-name" value={branding.companyName || ""} placeholder="Acme Studio"
            onChange={(v) => updateBranding({ companyName: v })}
          />
        </Field>

        <Group id="prof-logo-label" label="Logo" hint="PNG, SVG or JPG, up to 2 MB.">
          <div className="prof-logo">
            <div className="prof-logo-frame">
              {branding.logoBase64
                ? <img src={branding.logoBase64} alt="Your logo" />
                : <span aria-hidden="true"><IconUpload size={22} /></span>}
            </div>
            <div className="prof-logo-actions">
              <label className="lq-btn lq-btn--sm lq-btn--neutral prof-file" style={{ "--lq-fill": "var(--paper)" }}>
                <IconUpload size={16} /> {branding.logoBase64 ? "Replace logo" : "Upload logo"}
                <input type="file" accept="image/*" onChange={onLogoPicked} />
              </label>
              {branding.logoBase64 && (
                <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={() => updateBranding({ logoBase64: "" })}>Remove</PBtn>
              )}
            </div>
          </div>
          {logoError && <span className="kit-field-error" role="alert">{logoError}</span>}
        </Group>
      </div>

      <div className="prof-group">
        <div className="prof-group-head">
          <h3>Colors</h3>
          <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={resetTheme}>Reset theme</PBtn>
        </div>
        <label className="prof-switch">
          <input
            type="checkbox" role="switch"
            checked={branding.overrideThemes !== false}
            onChange={(e) => updateBranding({ overrideThemes: e.target.checked })}
          />
          <span className="prof-switch-track" aria-hidden="true" />
          <span className="prof-switch-text">
            <strong>Use my colors in the app</strong>
            Recolors the scene, the paper pieces and the buttons you see. Invoices and PDFs always use them.
          </span>
        </label>

        <div className="prof-colors">
          <ColorField id="prof-c-bg" label="Scene background" value={branding.bgColor} fallback={PALETTE.cream} onChange={(v) => updateBranding({ bgColor: v })} />
          <ColorField id="prof-c-surface" label="Paper and card color" value={branding.surfaceColor} fallback={PALETTE.paper} onChange={(v) => updateBranding({ surfaceColor: v })} />
          <ColorField id="prof-c-text" label="Text color" value={branding.textColor} fallback={PALETTE.ink} onChange={(v) => updateBranding({ textColor: v })} />
          <ColorField id="prof-c-accent" label="Accent color" value={branding.accentColor} fallback={PALETTE.pink} onChange={(v) => updateBranding({ accentColor: v })} />
        </div>

        {tokens && tokens.notes.length > 0 && branding.overrideThemes !== false && (
          <p className="prof-note" role="status">
            {tokens.notes.includes("text") && <>Your text color is hard to read on your background, so the app uses a readable one instead. </>}
            {tokens.notes.includes("accent") && <>Your accent is too dark for button labels, so buttons use a lighter tint of it. </>}
          </p>
        )}

        <div className="prof-preview" style={{ background: pv.bg }} aria-label="Brand preview, how your colors look in the app" role="img">
          <div className="prof-preview-head" style={{ color: pv.title }}>
            {branding.logoBase64 ? <img src={branding.logoBase64} alt="" /> : null}
            <b>{branding.companyName || profile.companyName || "Your brand"}</b>
            <span style={{ color: pv.glow }}> price</span>
          </div>
          <div className="prof-preview-card" style={{ background: pv.surface }}>
            <i style={{ background: pv.ink, width: "62%" }} />
            <i style={{ background: pv.ink, width: "40%" }} />
            <span className="prof-preview-btn" style={{ background: pv.fill, color: "#2B2140" }}>Next</span>
          </div>
        </div>
      </div>

      <div className="prof-row">
        <p className="prof-row-text"><strong>Brand config</strong>Download your branding as a JSON file to reuse elsewhere.</p>
        <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={downloadConfig}><IconDownload size={18} /> Download brand config</PBtn>
      </div>
    </SettingsCard>
  );
}
