import React, { useState, useEffect, useRef } from "react";
import rolesData from "./processed_roles.json";
import { IconHelp, IconArrowLeft, IconArrowRight, IconArrowDown, IconEdit, IconDelete, IconTierFree, IconTierPro, IconTierAgency, IconMenu, IconMoney, IconStar, IconWrite, IconTalent, IconCheck, IconCross, IconPending, IconInProgress, IconLock, IconBigMoney, IconUpload } from "./icons";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import TemplateManager from "./components/TemplateManager";
import ClientManager from "./components/ClientManager";
import { exportJobsToCSV } from "./utils/csvExport";
import { generateInvoicePDF } from "./utils/pdfExport";
import { PBox, PBtn, PModal, PLbl, PInput, PStepper, PSelect, PCollapsible, OptionGrid, MatChip } from "./components/ui";
import { supabase } from "./utils/supabaseClient";
import Auth from "./components/Auth";
import UpgradeModal from "./components/UpgradeModal";
import PricingPage from "./components/PricingPage";
import TutorialPage from "./components/TutorialPage";
import GlitchLogo from "./components/GlitchLogo";
import HexBackground from "./components/HexBackground";
import DMGEInvoiceEditor from "./components/DMGEInvoiceEditor";
import SplashScreen from "./components/SplashScreen";
import PixelArrow from "./components/PixelArrow";
import { playCalculate, playSave, playEmail, playGlow, isMuted, toggleMuted } from "./utils/sfx";
import { TIERS, loadSubscription, canAddClient, canAddClientsBatch, canAddTemplate, canExportCSV, canViewAnalytics, canExportPDF, canWhiteLabel, getJobsWithinWindow, getUsageStats, canCloudSync } from "./utils/subscription";
import { redirectToCheckout, redirectToBillingPortal, invokeEdgeFunction, getValidSession } from "./utils/stripe";
import { calcPrice, complexityMods, usageRightsMods, clientMods } from "./utils/pricing";
import { CATEGORY_THEMES, getMashupTheme, CARTRIDGE } from "./utils/themeUtils";

// Add Legacy disciplines to the data (No emojis)
const LEGACY_DISCIPLINES = {
  "Featured Crafts": {
    color: "#ffd6e8",
    accent: "#d94a8a",
    roles: [
      {
        name: "Photography",
        models: [{ type: "Standard Session", unit: "per hour", base: 25 }],
        materials: [
          { name: "Film Roll (36exp)", cost: 14 },
          { name: "Print 8x10 (each)", cost: 4 },
          { name: "USB Delivery Drive", cost: 12 },
        ],
      },
      {
        name: "Illustration",
        models: [{ type: "Commission", unit: "per hour", base: 30 }],
        materials: [
          { name: "Arches Watercolor Sheet", cost: 5 },
          { name: "Copic Markers (set/12)", cost: 55 },
        ],
      },
    ],
  },
};

const rawData = { ...LEGACY_DISCIPLINES, ...rolesData };

const ALL_DATA = Object.keys(rawData).reduce((acc, catName) => {
  const theme = CATEGORY_THEMES[catName] || { color: CARTRIDGE.surface, accent: "#2a2a2a", activeBg: CARTRIDGE.surface };
  acc[catName] = { ...rawData[catName], ...theme };
  return acc;
}, {});

const PRESET_COLORS = [
  "#ffffff", "#f5f0d6", "#f5ebd6", "#f5ead6", "#f5d6f0", "#f5d6d6", "#ead6f5", "#ffd6e8", "#e8e8e8", "#e0e0e0",
  "#d6e8f5", "#d6f5f5", "#d6f5e3", "#dedede", "#d5d5d5", "#d6e0f5", "#d9b74a", "#d94aab", "#d94a8a", "#d94a4a",
  "#c0c0c0", "#aaaaaa", "#8c8c8c", "#8c6a47", "#8a4ad9", "#c4622d", "#E040FB", "#FFD700", "#FF9800", "#f44336",
  "#4CAF50", "#2eb351", "#2a99d9", "#2a70d9", "#475f94",
  "#666666", "#2a2a2a", "#000000"
];

const ColorSwatches = ({ value, onChange }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "0.75rem" }}>
    {PRESET_COLORS.map(c => (
      <div
        key={c}
        onClick={() => onChange(c)}
        style={{
          width: "clamp(1.75rem, 7vw, 2.5rem)", height: "clamp(1.75rem, 7vw, 2.5rem)", background: c, cursor: "pointer",
          border: (value || "").toLowerCase() === c.toLowerCase() ? "3px solid #fff" : "3px solid #2a2a2a",
          boxShadow: (value || "").toLowerCase() === c.toLowerCase() ? "0 0 0 3px #2a2a2a" : "none",
          boxSizing: "border-box"
        }}
        title={c}
      />
    ))}
  </div>
);

const travelOptions = {
  "None": 0,
  "Local (up to 10 mi)": 25,
  "Regional (up to 50 mi)": 75,
  "Long Distance (up to 200 mi)": 200,
  "Overnight / Airfare": 500
};

function pdfQuotaDayKey() {
  return new Date().toISOString().split("T")[0];
}

async function saveJob(job, tier, user) {
  if (!job.id) job.id = "job-" + Date.now() + Math.random().toString(36).substr(2, 5);

  // Always save to localStorage
  const localJobs = JSON.parse(localStorage.getItem('rateapp_jobs') || '[]');
  const jobToSave = { ...job, id: String(job.id) };
  const idx = localJobs.findIndex(j => String(j.id) === String(jobToSave.id));
  if (idx >= 0) localJobs[idx] = jobToSave; else localJobs.push(jobToSave);
  localStorage.setItem('rateapp_jobs', JSON.stringify(localJobs));

  if (user && canCloudSync(tier)) {
    supabase.from('jobs').upsert([{ id: job.id, user_id: user.id, data: job }], { onConflict: 'id' }).then(({ error }) => {
      if (error) console.error('[saveJob] error:', error);
    });
  }
  return localJobs;
}

async function deleteJob(id, tier, user) {
  console.log('[deleteJob] ID:', id, 'Tier:', tier, 'User:', user?.id);
  // 1. Always delete from localStorage FIRST
  const localJobs = JSON.parse(localStorage.getItem('rateapp_jobs') || '[]');
  // Coerce both to strings for reliable comparison
  const updated = localJobs.filter(j => String(j.id) !== String(id));
  localStorage.setItem('rateapp_jobs', JSON.stringify(updated));

  // 2. Perform background sync if possible
  if (user && canCloudSync(tier)) {
    supabase.from('jobs').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
      if (error) console.error('[deleteJob] Supabase error:', error);
      else console.log('[deleteJob] Supabase Delete Success');
    });
  } else {
    console.log('[deleteJob] Skipping cloud sync');
  }

  return updated; // Return the updated list for immediate state update
}

async function loadJobs(tier, user) {
  let jobs = [];
  // Load from localStorage first
  jobs = JSON.parse(localStorage.getItem('rateapp_jobs') || '[]');

  if (user && canCloudSync(tier)) {
    console.log('[loadJobs] Syncing with Cloud...');
    const { data, error } = await supabase
      .from('jobs')
      .select('id, data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('[loadJobs] error:', error);
    if (data) {
      console.log(`[loadJobs] Cloud found ${data.length} jobs.`);
      const cloudJobs = data.map(d => ({ ...d.data, id: d.data?.id || d.id }));
      // For Agency, cloud is the source of truth
      jobs = cloudJobs;
      localStorage.setItem('rateapp_jobs', JSON.stringify(jobs));
    }
  }

  let modified = false;
  jobs = jobs.map((j, i) => {
    if (!j.id) {
      modified = true;
      return { ...j, id: "job-" + Date.now() + Math.random().toString(36).substr(2, 5) + i };
    }
    return j;
  });

  const profile = await loadProfile(tier);
  const prefix = profile.invoicePrefix || "INV-";
  let lastNum = profile.lastInvoiceNumber || (profile.invoiceStartNumber ? profile.invoiceStartNumber - 1 : 999);

  const updatedJobs = jobs.slice().reverse().map(j => {
    if (!j.invoiceNumber) {
      modified = true;
      lastNum++;
      return { ...j, invoiceNumber: `${prefix}${lastNum}`, invoiceStatus: "pending" };
    }
    return j;
  }).reverse();

  if (modified) {
    for (const j of updatedJobs) {
      if (!jobs.find(oldJ => oldJ.id === j.id && oldJ.invoiceNumber)) {
        await saveJob(j, tier, user);
      }
    }
    profile.lastInvoiceNumber = lastNum;
    await saveProfile(profile, tier, user);
  }
  return updatedJobs;
}

// ─────────────────────────────────────────────
// PROFILE STORAGE
// ─────────────────────────────────────────────
async function saveProfile(p, tier, user) {

  // Always save to localStorage
  localStorage.setItem('rateapp_profile', JSON.stringify(p));

  if (!user || !canCloudSync(tier)) return;
  const { error } = await supabase.from('profiles').upsert([{ user_id: user.id, data: p }], { onConflict: 'user_id' });
  if (error) console.error('[saveProfile]', error);
}
async function loadProfile(tier, user) {
  // Load from localStorage first
  let p = JSON.parse(localStorage.getItem('rateapp_profile') || 'null');

  if (user && canCloudSync(tier)) {
    const { data, error } = await supabase.from('profiles').select('data').eq('user_id', user.id).single();
    if (error && error.code !== 'PGRST116') console.error('[loadProfile]', error);
    if (data?.data) {
      p = data.data;
      localStorage.setItem('rateapp_profile', JSON.stringify(p));
    }
  }

  if (!p) p = { name: "", defaultBaseRate: 25, presets: [] };

  return {
    invoicePrefix: "INV-",
    invoiceStartNumber: 1000,
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    logoUrl: "",
    paymentInstructions: "",
    invoiceTerms: "Net 14",
    taxId: "",
    branding: {
      companyName: "",
      logoBase64: "",
      surfaceColor: "#1A1A1A",
      bgColor: "#0A0A0A",
      textColor: "#FFB347",
      accentColor: "#E91E63"
    },
    pdfQuota: { day: "", count: 0 },
    ...p
  };
}

// ─────────────────────────────────────────────
// TEMPLATE STORAGE
// ─────────────────────────────────────────────
async function saveTemplateToStorage(template, tier, user) {
  console.log('[saveTemplate] ID:', template.id, 'Tier:', tier);
  // 1. Always save to localStorage FIRST
  const localTemplates = JSON.parse(localStorage.getItem('rateapp_templates') || '[]');
  const tplToSave = { ...template, id: String(template.id) };
  const idx = localTemplates.findIndex(t => String(t.id) === String(tplToSave.id));
  if (idx >= 0) localTemplates[idx] = tplToSave; else localTemplates.push(tplToSave);
  localStorage.setItem('rateapp_templates', JSON.stringify(localTemplates));

  // 2. Background sync
  if (user && canCloudSync(tier)) {
    supabase.from('templates').upsert([{ id: template.id, user_id: user.id, data: template }], { onConflict: 'id' }).then(({ error }) => {
      if (error) console.error('[saveTemplate] error:', error);
    });
  }
  return localTemplates;
}
async function loadTemplatesFromStorage(tier, user) {
  let templates = JSON.parse(localStorage.getItem('rateapp_templates') || '[]');

  if (user && canCloudSync(tier)) {
    console.log('[loadTemplates] Syncing with Cloud...');
    const { data, error } = await supabase
      .from('templates')
      .select('id, data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('[loadTemplates] error:', error);
    if (data) {
      console.log(`[loadTemplates] Cloud found ${data.length} templates.`);
      templates = data.map(d => ({ ...d.data, id: d.data?.id || d.id }));
      localStorage.setItem('rateapp_templates', JSON.stringify(templates));
    }
  }
  return templates;
}
async function deleteTemplateFromStorage(id, tier, user) {
  console.log('[deleteTemplate] ID:', id, 'Tier:', tier, 'User:', user?.id);
  // 1. Always delete from localStorage FIRST
  const localTemplates = JSON.parse(localStorage.getItem('rateapp_templates') || '[]');
  const updated = localTemplates.filter(t => String(t.id) !== String(id));
  localStorage.setItem('rateapp_templates', JSON.stringify(updated));

  // 2. Background sync
  if (user && canCloudSync(tier)) {
    supabase.from('templates').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
      if (error) console.error('[deleteTemplate] Supabase error:', error);
      else console.log('[deleteTemplate] Supabase Delete Success');
    });
  }

  return updated;
}

// ─────────────────────────────────────────────
// CLIENT STORAGE
// ─────────────────────────────────────────────
async function saveClientToStorage(client, tier, user) {
  console.log('[saveClient] ID:', client.id, 'Tier:', tier);
  // 1. Always save to localStorage FIRST
  const localClients = JSON.parse(localStorage.getItem('rateapp_clients') || '[]');
  const cliToSave = { ...client, id: String(client.id) };
  const idx = localClients.findIndex(c => String(c.id) === String(cliToSave.id));
  if (idx >= 0) localClients[idx] = cliToSave; else localClients.push(cliToSave);
  localStorage.setItem('rateapp_clients', JSON.stringify(localClients));

  // 2. Background sync
  if (user && canCloudSync(tier)) {
    supabase.from('clients').upsert([{ id: client.id, user_id: user.id, data: client }], { onConflict: 'id' }).then(({ error }) => {
      if (error) console.error('[saveClient] error:', error);
    });
  }
  return localClients;
}
async function loadClientsFromStorage(tier, user) {
  let clients = JSON.parse(localStorage.getItem('rateapp_clients') || '[]');

  if (user && canCloudSync(tier)) {
    console.log('[loadClients] Syncing with Cloud...');
    const { data, error } = await supabase
      .from('clients')
      .select('id, data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) console.error('[loadClients] error:', error);
    if (data) {
      console.log(`[loadClients] Cloud found ${data.length} clients.`);
      clients = data.map(d => ({ ...d.data, id: d.data?.id || d.id }));
      localStorage.setItem('rateapp_clients', JSON.stringify(clients));
    }
  }
  return clients;
}
async function deleteClientFromStorage(id, tier, user) {
  console.log('[deleteClient] ID:', id, 'Tier:', tier, 'User:', user?.id);
  // 1. Always delete from localStorage FIRST
  const localClients = JSON.parse(localStorage.getItem('rateapp_clients') || '[]');
  const updated = localClients.filter(c => String(c.id) !== String(id));
  localStorage.setItem('rateapp_clients', JSON.stringify(updated));

  // 2. Background sync
  if (user && canCloudSync(tier)) {
    supabase.from('clients').delete().eq('id', id).eq('user_id', user.id).then(({ error }) => {
      if (error) console.error('[deleteClient] Supabase error:', error);
      else console.log('[deleteClient] Supabase Delete Success');
    });
  }

  return updated;
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [profile, setProfile] = useState({
    name: "",
    defaultBaseRate: 25,
    presets: [],
    pdfQuota: { day: "", count: 0 },
    branding: {
      companyName: "",
      logoBase64: "",
      surfaceColor: "#1A1A1A",
      bgColor: "#0A0A0A",
      textColor: "#FFB347",
      accentColor: "#E91E63"
    }
  });
  const [category, setCategory] = useState(Object.keys(ALL_DATA)[0]);
  const [roleIdx, setRoleIdx] = useState(0);
  const [modelIdx, setModelIdx] = useState(0);

  const [baseRate, setBaseRate] = useState(25);
  const [baseRateHasCents, setBaseRateHasCents] = useState(false);
  const [matQtys, setMatQtys] = useState({});
  const [matPriceOverrides, setMatPriceOverrides] = useState({});
  const [customMaterials, setCustomMaterials] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [price, setPrice] = useState(null);
  const [selectedTier, setSelectedTier] = useState("fair");
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("calc");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [resetKey, setResetKey] = useState(0);

  const [form, setForm] = useState({
    units: 2,
    complexity: "Standard",
    usage: "Personal",
    rush: false,
    revisions: 1,
    platformFee: 0,
    clientType: "Individual",
    travelExpense: 0,
    notes: ""
  });

  // Modal State
  const [showMatModal, setShowMatModal] = useState(false);
  const [newMatForm, setNewMatForm] = useState({ name: "", cost: 0 });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailForm, setEmailForm] = useState({ to: "", subject: "", message: "" });
  const [invoiceEditorData, setInvoiceEditorData] = useState(null);
  const [selectedJobForEmail, setSelectedJobForEmail] = useState(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState({ type: null, message: "" });
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [newTemplateForm, setNewTemplateForm] = useState({ name: "", notes: "" });
  const [deleteTarget, setDeleteTarget] = useState({ type: null, id: null, label: "" });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Subscription / Monetization State
  const [subscription, setSubscription] = useState({ tier: 'free', stripe_customer_id: null });
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('clients');
  const [todayPdfCount, setTodayPdfCount] = useState(0);

  // Splash + guided UX state
  const [splashDone, setSplashDone] = useState(() => {
    try { return sessionStorage.getItem('rateapp_splash_seen') === '1'; } catch { return false; }
  });
  // Glow walks: role -> clientType -> usage -> calculate -> null
  const [glowStep, setGlowStep] = useState('role');
  const [muted, setMutedState] = useState(() => isMuted());

  function advanceGlow(from) {
    setGlowStep(prev => {
      if (prev !== from) return prev;
      const NEXT = { role: 'clientType', clientType: 'usage', usage: 'calculate', calculate: null };
      const next = NEXT[from] ?? null;
      if (next) { try { playGlow(); } catch {} }
      return next;
    });
  }

  function handleToggleMute() {
    const next = toggleMuted();
    setMutedState(next);
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("LOGO FILE TOO LARGE (MAX 2MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;
      const p = { ...profile, branding: { ...profile.branding, logoBase64: base64 } };
      setProfile(p);
      saveProfile(p, userTier, currentUser);
    };
    reader.readAsDataURL(file);
  };
  const userTier = (subscription?.tier || 'free').toLowerCase();

  // Base Rate Editing State
  const [isEditingBase, setIsEditingBase] = useState(false);
  const [baseRateInputStr, setBaseRateInputStr] = useState("");
  const baseInputRef = useRef(null);

  const catData = ALL_DATA[category];
  const role = catData.roles[roleIdx];
  const model = role.models[modelIdx];
  const mats = role.materials;

  const activeTheme = getMashupTheme(category, role?.name, model?.type);

  useEffect(() => { if (isEditingBase) baseInputRef.current?.focus(); }, [isEditingBase]);

  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [recoveredMode, setRecoveredMode] = useState(false);

  // Visit ?reset_auth=1 to sign out and clear a stale session (fixes Edge 401 after env/project changes).
  useEffect(() => {
    if (
      !String(import.meta.env.VITE_SUPABASE_URL || "").trim() ||
      !String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim()
    ) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("reset_auth") !== "1") return;
    params.delete("reset_auth");
    const q = params.toString();
    const path = `${window.location.pathname}${q ? `?${q}` : ""}`;
    supabase.auth.signOut().finally(() => {
      window.history.replaceState({}, "", path);
      window.location.replace(path);
    });
  }, []);

  useEffect(() => {
    if (
      !String(import.meta.env.VITE_SUPABASE_URL || "").trim() ||
      !String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim()
    ) {
      setAuthLoading(false);
      return;
    }

    supabase.auth
      .getSession()
      .then((res) => {
        const session = res?.data?.session ?? null;
        setCurrentUser(session?.user ?? null);
      })
      .catch(() => {
        setCurrentUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App.jsx] onAuthStateChange event:', event, 'user:', !!session?.user);
      setCurrentUser(session?.user ?? null);
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveredMode(true);
      }
    });

    return () => {
      data?.subscription?.unsubscribe();
    };
  }, []);

  // 1. Load user and subscription
  useEffect(() => {
    if (!currentUser) return;
    loadSubscription().then(setSubscription);

    const hasSeen = localStorage.getItem('rateapp_has_seen_tutorial');
    if (!hasSeen) {
      setTab('tutorial');
      localStorage.setItem('rateapp_has_seen_tutorial', 'true');
    }
  }, [currentUser]);

  // 2. Load data once tier is known
  useEffect(() => {
    if (!currentUser || !subscription?.tier) return;
    const tier = subscription.tier;
    loadProfile(tier, currentUser).then(p => {
      setProfile(p);
      setBaseRate(p.defaultBaseRate || 25);
      const d = pdfQuotaDayKey();
      const pq = p.pdfQuota;
      setTodayPdfCount(pq && pq.day === d ? pq.count : 0);
    });
    loadJobs(tier, currentUser).then(setJobs);
    loadTemplatesFromStorage(tier, currentUser).then(setTemplates);
    loadClientsFromStorage(tier, currentUser).then(setClients);
  }, [currentUser, subscription?.tier]);

  useEffect(() => {
    if (!currentUser) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "true" || params.get("canceled") === "true") {
      loadSubscription().then(setSubscription);
      params.delete("success");
      params.delete("canceled");
      params.delete("session_id");
      const q = params.toString();
      window.history.replaceState({}, "", `${window.location.pathname}${q ? `?${q}` : ""}`);
    }
  }, [currentUser]);

  const configMissing =
    !String(import.meta.env.VITE_SUPABASE_URL || "").trim() ||
    !String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (configMissing) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.25rem", padding: "2rem", fontFamily: "'Press Start 2P', monospace", background: "#d5d5d5", color: "#2a2a2a", textAlign: "center", lineHeight: 1.8, fontSize: "0.65rem", maxWidth: "36rem", margin: "0 auto" }}>
        <p style={{ fontSize: "0.85rem" }}>APP CONFIG MISSING</p>
        <p>
          Add <code style={{ background: "#fff", padding: "0.2rem 0.4rem" }}>.env.local</code> next to <code style={{ background: "#fff", padding: "0.2rem 0.4rem" }}>package.json</code> with your Supabase + Stripe keys, then restart the dev server.
        </p>
        <pre style={{ textAlign: "left", background: "#2a2a2a", color: "#d6f5e3", padding: "1rem", overflow: "auto", fontSize: "0.5rem", width: "100%", boxSizing: "border-box" }}>
          {`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`}
        </pre>
        <p>Terminal: <code style={{ background: "#fff", padding: "0.2rem 0.4rem" }}>npm run dev</code> — use the Network URL if localhost does not load in the editor browser.</p>
      </div>
    );
  }

  if (!splashDone) {
    return (
      <SplashScreen onDone={() => {
        try { sessionStorage.setItem('rateapp_splash_seen', '1'); } catch {}
        setSplashDone(true);
      }} />
    );
  }

  if (authLoading) return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--pixel-text, #2a2a2a)", padding: "3.125rem", fontFamily: "'Press Start 2P'", background: "#d5d5d5" }}>LOADING...</div>;
  if (!currentUser || recoveredMode) {
    return (
      <Auth
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setRecoveredMode(false);
        }}
        initialMode={recoveredMode ? 'update_password' : 'login'}
      />
    );
  }

  const handleResetModel = (newModel) => {
    setBaseRate(newModel.base);
    setBaseRateHasCents(!!(newModel.base % 1));
    setMatQtys({});
    setCustomMaterials([]);
    setPrice(null);
  };

  const materialsCost = [
    ...mats.map(m => ({ ...m, id: m.name, cost: matPriceOverrides[m.name] ?? m.cost })),
    ...customMaterials.map(m => ({ ...m, id: m.name, cost: matPriceOverrides[m.name] ?? m.cost }))
  ].reduce((s, m) => s + (matQtys[m.id] || 0) * m.cost, 0);

  const set = (k) => (v) => { setForm(f => ({ ...f, [k]: v })); setPrice(null); };

  function handleCalc() {
    const cMult = clients.find(c => c.id === selectedClientId)?.rateMultiplier || 1.0;
    setPrice(calcPrice({ ...form, baseRate, materialsCost, clientMultiplier: cMult }));
    setSelectedTier("fair");
    setSaved(false);
    setGlowStep(null);
    try { playCalculate(); } catch {}
  }

  function handleReset() {
    setForm({
      units: 2,
      complexity: "Standard",
      usage: "Personal",
      rush: false,
      revisions: 1,
      platformFee: 0,
      clientType: "Individual",
      travelExpense: 0,
      notes: ""
    });
    setMatQtys({});
    setCustomMaterials([]);
    setPrice(null);
    setSaved(false);
    setResetKey(prev => prev + 1);
    setGlowStep('role');
  }
  async function handleSave() {
    try {
      // If we're editing an existing job, preserve its invoice details
      const isEdit = !!form.id;
      let nextInvoice = profile.lastInvoiceNumber || (profile.invoiceStartNumber - 1);
      let invoiceNumber = form.invoiceNumber;
      let invoiceDate = form.invoiceDate || new Date().toISOString();
      let dueDate = form.dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      if (!isEdit || !invoiceNumber) {
        nextInvoice += 1;
        invoiceNumber = `${profile.invoicePrefix}${nextInvoice}`;
        invoiceDate = new Date().toISOString();
        dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        const updatedProfile = { ...profile, lastInvoiceNumber: nextInvoice };
        setProfile(updatedProfile);
        await saveProfile(updatedProfile, userTier, currentUser);
      }

      const activeMaterials = [
        ...mats.map(m => ({ name: m.name, cost: matPriceOverrides[m.name] ?? m.cost, qty: matQtys[m.name] || 0 })),
        ...customMaterials.map(m => ({ name: m.name, cost: matPriceOverrides[m.name] ?? m.cost, qty: matQtys[m.name] || 0 }))
      ].filter(m => m.qty > 0);

      const updatedJobs = await saveJob({
        ...form,
        baseRate,
        category,
        role: role.name,
        model: model.type,
        materialsCost,
        materials: activeMaterials,
        travelExpense: form.travelExpense,
        price: price[selectedTier === "low" ? "low" : selectedTier === "premium" ? "premium" : "fair"],
        date: invoiceDate,
        status: form.status || "pending",
        clientId: selectedClientId || null,
        invoiceNumber,
        invoiceDate,
        dueDate,
        invoiceStatus: form.invoiceStatus || "pending",
        sentAt: form.sentAt || null,
        paidAt: form.paidAt || null,
        notes: form.notes
      }, userTier, currentUser);

      setJobs(updatedJobs);
      setSaved(true);
      try { playSave(); } catch {}
      setTimeout(() => setTab("history"), 500);
    } catch (e) {
      console.error("handleSave Error:", e);
    }
  }
  async function handleDeleteJob(id) {
    const job = jobs.find(j => String(j.id) === String(id));
    setDeleteTarget({ type: "job", id, label: job ? `Job ${job.invoiceNumber || 'ESTIMATE'}` : "this job" });
    setShowDeleteModal(true);
  }

  const confirmDelete = async () => {
    if (!deleteTarget.id) return;
    const { type, id } = deleteTarget;
    console.log(`[App.jsx] CONFIRMING DELETE: ${type} ID: ${id}`);

    try {
      if (type === "job") {
        const updated = await deleteJob(id, userTier, currentUser);
        setJobs(updated);
      } else if (type === "client") {
        const updated = await deleteClientFromStorage(id, userTier, currentUser);
        setClients(updated);
        if (String(selectedClientId) === String(id)) setSelectedClientId("");
      } else if (type === "template") {
        const updated = await deleteTemplateFromStorage(id, userTier, currentUser);
        setTemplates(updated);
      }
      console.log(`[App.jsx] ${type} deleted successfully.`);
    } catch (err) {
      console.error(`[App.jsx] Error deleting ${type}:`, err);
      alert(`Failed to delete ${type}. Please try again.`);
    } finally {
      setShowDeleteModal(false);
      setDeleteTarget({ type: null, id: null, label: "" });
    }
  };
  function handleEditJob(j) {
    if (!j.category || !ALL_DATA[j.category]) {
      alert("CATEGORY DATA NOT FOUND FOR THIS JOB.");
      return;
    }
    setCategory(j.category);
    const catD = ALL_DATA[j.category];
    const rIdx = catD.roles.findIndex(r => r.name === j.role);
    if (rIdx >= 0) {
      setRoleIdx(rIdx);
      const mIdx = catD.roles[rIdx].models.findIndex(m => m.type === j.model);
      if (mIdx >= 0) setModelIdx(mIdx);
    }

    setBaseRate(j.baseRate || 25);

    // Restore materials and custom items
    const qtys = {};
    const customs = [];
    if (j.materials && Array.isArray(j.materials)) {
      j.materials.forEach(m => {
        qtys[m.name] = m.qty;
        // Check if it was a custom material (not in the standard list for this role)
        const roleMats = catD?.roles[rIdx]?.materials || [];
        const isStandard = roleMats.some(std => std.name === m.name);
        if (!isStandard) {
          customs.push({ name: m.name, cost: m.cost });
        }
      });
    }
    setMatQtys(qtys);
    setCustomMaterials(customs);

    setForm({
      ...j, // Spread everything to preserve ID and invoice metadata
      units: j.units || 1,
      complexity: j.complexity || "Standard",
      usage: j.usage || "Personal",
      rush: j.rush || false,
      revisions: j.revisions || 1,
      platformFee: j.platformFee || 0,
      clientType: j.clientType || "Individual",
      travelExpense: j.travelExpense || 0,
      notes: j.notes || ""
    });
    setPrice(null);
    setTab("calc");
  }

  async function handleSaveTemplate() {
    if (!canAddTemplate(userTier, templates.length)) {
      setUpgradeFeature('templates');
      setShowUpgradeModal(true);
      setShowSaveTemplateModal(false);
      return;
    }
    const template = {
      id: "tpl-" + Date.now(),
      name: newTemplateForm.name || "Untitled Template",
      category,
      role: role.name,
      model: model.type,
      baseRate,
      form,
      materials: [
        ...mats.filter(m => (matQtys[m.name] || 0) > 0).map(m => ({ ...m, cost: matPriceOverrides[m.name] ?? m.cost, qty: matQtys[m.name] })),
        ...customMaterials.map(m => ({ ...m, cost: matPriceOverrides[m.name] ?? m.cost, qty: matQtys[m.name] || 1 }))
      ],
      notes: newTemplateForm.notes,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    await saveTemplateToStorage(template, userTier, currentUser);
    setTemplates(await loadTemplatesFromStorage(userTier, currentUser));
    setShowSaveTemplateModal(false);
    setTab("templates");
  }

  async function handlePlanSelect(targetTier, interval = 'month') {
    setShowUpgradeModal(false);
    if (targetTier === "portal") {
      try {
        await redirectToBillingPortal();
      } catch (e) {
        alert(e.message || "Could not open billing portal.");
      }
      return;
    }
    if (targetTier === "free") {
      if (subscription?.stripe_customer_id) {
        handlePlanSelect("portal"); // Redirect to portal for downgrades
      } else {
        alert("You are already on the free plan.");
      }
      return;
    }
    if (targetTier === "pro" || targetTier === "agency") {
      const currentTier = (subscription?.tier || 'free').toLowerCase();
      if (currentTier !== 'free') {
        // Already have a paid plan? Use portal to upgrade/downgrade with proration
        handlePlanSelect("portal");
      } else {
        // New subscriber? Go to checkout
        redirectToCheckout(targetTier, interval);
      }
    }
  }

  function handleUpgrade(targetTier, interval = 'month') {
    handlePlanSelect(targetTier, interval);
  }

  async function resetAppData() {
    if (!confirm("🚨 WARNING: This will permanently delete all local jobs, clients, and templates. Are you sure?")) return;

    // Clear localStorage
    const keys = ['rateapp_jobs', 'rateapp_profile', 'rateapp_clients', 'rateapp_templates'];
    keys.forEach(k => localStorage.removeItem(k));

    // Sign out if possible
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('[resetAppData] Sign out failed:', e);
    }

    // Reload to apply defaults
    window.location.reload();
  }

  async function handleGatedPDF(j) {
    if (!canExportPDF(userTier, todayPdfCount)) {
      setUpgradeFeature('pdf');
      setShowUpgradeModal(true);
      return;
    }
    generateInvoicePDF(j, profile, clients, ALL_DATA[j.category] || catData);
    const d = pdfQuotaDayKey();
    const prev = profile.pdfQuota?.day === d ? profile.pdfQuota.count : 0;
    const next = { day: d, count: prev + 1 };
    const p = { ...profile, pdfQuota: next };
    setProfile(p);
    setTodayPdfCount(next.count);
    await saveProfile(p, userTier, currentUser);
  }

  function handleGatedCSV() {
    if (!canExportCSV(userTier)) {
      setUpgradeFeature('csv');
      setShowUpgradeModal(true);
      return;
    }
    exportJobsToCSV(jobs);
  }

  const handleUseTemplate = async (t) => {
    t.usageCount = (t.usageCount || 0) + 1;
    await saveTemplateToStorage(t, userTier, currentUser);
    setTemplates(await loadTemplatesFromStorage(userTier, currentUser));

    setCategory(t.category);
    const catD = ALL_DATA[t.category];
    if (catD) {
      const rIdx = catD.roles.findIndex(r => r.name === t.role);
      if (rIdx >= 0) {
        setRoleIdx(rIdx);
        const mIdx = catD.roles[rIdx].models.findIndex(m => m.type === t.model);
        if (mIdx >= 0) setModelIdx(mIdx);
      }
    }
    setBaseRate(t.baseRate);
    setBaseRateHasCents(!!(t.baseRate % 1));
    setForm(t.form);

    const restoredQtys = {};
    const restoredCustomMats = [];
    const restoredOverrides = {};
    const defaultMats = catD?.roles.find(r => r.name === t.role)?.materials || [];
    const defaultMatNames = new Set(defaultMats.map(m => m.name));

    (t.materials || []).forEach(m => {
      restoredQtys[m.name] = m.qty || 1;
      restoredOverrides[m.name] = m.cost;
      if (!defaultMatNames.has(m.name)) {
        restoredCustomMats.push({ name: m.name, cost: m.cost });
      }
    });

    setMatQtys(restoredQtys);
    setCustomMaterials(restoredCustomMats);
    setMatPriceOverrides(restoredOverrides);
    setPrice(null);
    setSaved(false);
    setResetKey(prev => prev + 1);
    setTab("calc");
  };

  const handleDeleteTemplate = async (id) => {
    await deleteTemplateFromStorage(id, userTier, currentUser);
    setTemplates(await loadTemplatesFromStorage(userTier, currentUser));
  };

  function handleSendQuote(job) {
    setSelectedJobForEmail(job);
    const formattedPrice = Number(job.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fromName = profile.companyName || profile.name?.trim() || "DMGE Rate System";
    const invNum = job.invoiceNumber ? ` #${job.invoiceNumber}` : "";

    setEmailForm({
      to: "",
      subject: `Invoice${invNum} for ${job.role} - ${job.category}`,
      message: "" // No longer used for the body, but kept for payload compatibility if needed
    });
    setInvoiceEditorData(null); // Reset to fresh data
    setTab("invoice_editor");
  }

  async function sendEmail() {
    if (!emailForm.to) {
      alert("Please enter a recipient email address.");
      return;
    }

    setIsSendingEmail(true);

    try {
      const catD = ALL_DATA[selectedJobForEmail.category] || Object.values(ALL_DATA)[0];
      // Generate PDF using the enhanced template logic, passing the editor data
      const pdfBase64 = await generateInvoicePDF(selectedJobForEmail, profile, clients, catD, true, invoiceEditorData);

      const invoicePayload = {
        to: emailForm.to,
        subject: emailForm.subject,
        message: emailForm.message,
        pdfBase64: pdfBase64,
        pdfName: `${selectedJobForEmail.invoiceNumber || 'INV'}_${selectedJobForEmail.role.replace(/\s+/g, '_')}.pdf`,
        fromName: profile.companyName || profile.name?.trim() || "DMGE Invoicing"
      };
      const session = await getValidSession();
      if (!session?.access_token) throw new Error('You must be signed in to send invoices.');

      const data = await invokeEdgeFunction('send-invoice', invoicePayload, session.access_token);
      if (data?.error) throw new Error(data.error);
      // Successfully sent
      try { playEmail(); } catch {}
      setEmailStatus({ type: "success", message: "Invoice successfully dispatched!" });
      setTimeout(() => {
        alert("Invoice successfully dispatched!");
        setTab("history");
        setEmailStatus({ type: null, message: "" });
      }, 100);
    } catch (err) {
      console.error("Failed to send email:", err);
      setEmailStatus({ type: "error", message: "Failed to send: " + (err.message || "") });
      alert("Uh oh! Failed to send email. " + (err.message || ""));
    } finally {
      setIsSendingEmail(false);
    }
  }

  const handleAddCustomMaterial = () => {
    setNewMatForm({ name: "", cost: 0 });
    setShowMatModal(true);
  };

  const confirmAddMaterial = () => {
    if (newMatForm.name) {
      setCustomMaterials([...customMaterials, { ...newMatForm }]);
      setMatQtys(q => ({ ...q, [newMatForm.name]: 1 }));
      setShowMatModal(false);
      setPrice(null);
    }
  };

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const windowedJobs = getJobsWithinWindow(jobs, userTier);
  const dashboardJobCount = TIERS[userTier]?.limits.historyDays === Infinity ? jobs.length : windowedJobs.length;
  const historyJobs = windowedJobs;
  const totalBilled = historyJobs.reduce((s, j) => s + (Number(j.price) || 0), 0);
  const avgJob = historyJobs.length ? Math.round(totalBilled / historyJobs.length) : 0;

  const filteredJobs = historyJobs.filter(j => jobStatusFilter === "all" || j.status === jobStatusFilter);

  const materialSummary = Object.entries(matQtys)
    .filter(([, qty]) => qty > 0)
    .map(([name, qty]) => `${name} x${qty}`)
    .join(", ") || "None";

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      <style>{`
        :root {
          font-size: clamp(8px, 1.1vh + 0.4vw, 14px);
        }
        *{box-sizing:border-box;margin:0;padding:0;}

        /* DMGE guided-UX animations */
        @keyframes dmgeGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,179,71,0.0), 0.375rem 0.375rem 0 #E91E63; }
          50% { box-shadow: 0 0 24px 6px rgba(255,179,71,0.85), 0.375rem 0.375rem 0 #E91E63; }
        }
        .dmge-glow { animation: dmgeGlow 1.4s ease-in-out infinite; }

        @keyframes dmgeSplashPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.06); filter: brightness(1.25); }
        }
        .dmge-splash-pulse { animation: dmgeSplashPulse 1s ease-in-out infinite; }

        @keyframes dmgeArrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }
        .dmge-arrow-bounce { animation: dmgeArrowBounce 0.7s ease-in-out infinite; display: inline-block; }

        html, body { overflow: hidden; height: 100%; }
        body{background:#d5d5d5; font-size: 1rem;}
        input[type=range]{-webkit-appearance:none;height:0.625rem;background:#dedede;border:0.1875rem solid #2a2a2a;border-radius:0;outline:none;cursor:pointer;overflow:visible;}
        input[type=range]::-webkit-slider-thumb{
          -webkit-appearance:none;
          width:3.6rem;
          height:3.6rem;
          background-color:transparent;
          background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7 0h2v2h3v2H5v3h6v2h3v4h-2v1h-3v2H7v-2H4v-2h7V9H5V7H2V4h2v-2h3z' fill='%23FFB347' stroke='%23000' stroke-width='0.6' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          border:none;
          cursor:pointer;
          filter: drop-shadow(0.3125rem 0.3125rem 0 %23E91E63);
          margin-top: -1.5rem; /* Center the larger icon on the slimmer track */
        }
        input[type=range]::-moz-range-thumb{
          width:3.6rem;
          height:3.6rem;
          background-color:transparent;
          background-image:url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath d='M7 0h2v2h3v2H5v3h6v2h3v4h-2v1h-3v2H7v-2H4v-2h7V9H5V7H2V4h2v-2h3z' fill='%23FFB347' stroke='%23000' stroke-width='0.6' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          border:none;
          cursor:pointer;
          filter: drop-shadow(0.3125rem 0.3125rem 0 %23E91E63);
        }
        ::-webkit-scrollbar{width:1.25rem;}
        ::-webkit-scrollbar-track{background:#c0c0c0;}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;}
        @keyframes slideUp{from{opacity:0;transform:translateY(1.5625rem)}to{opacity:1;transform:translateY(0)}}
        .res-in{animation:slideUp(0.18s steps(3,end));}
        input{outline:none;}
        input:focus{outline:0.5rem solid ${activeTheme.roleColor};}
        
        /* TUTORIAL ANIMATIONS */
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-0.625rem); } }
        @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.1); } }
        @keyframes cycleColors { 
          0% { color: #ff6b6b; } 
          20% { color: #4ecdc4; } 
          40% { color: #ffe66d; } 
          60% { color: #ff9ff3; } 
          80% { color: #a29bfe; } 
          100% { color: #ff6b6b; } 
        }
        @keyframes slideInRight { from { transform: translateX(3.125rem); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes flyOut { 0% { transform: translate(0,0) scale(1); opacity: 1; } 100% { transform: translate(6.25rem,-6.25rem) scale(0.5); opacity: 0; } }
        .anim-float { animation: float 2s ease-in-out infinite; }
        .anim-pulse { animation: pulse 1.5s ease-in-out infinite; }
        .anim-cycle { animation: cycleColors 5s linear infinite; }
        .anim-slide { animation: slideInRight 0.3s ease-out; }
        .anim-fly { animation: flyOut 1s ease-in forwards; }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }

        /* ──── GLOBAL OVERFLOW SAFETY ──── */
        .header-grid, .content-wrapper, .app-wrapper {
          overflow-wrap: break-word;
          word-break: normal;
        }

        /* ──── TABLET (≤768px) ──── */
        @media (max-width: 768px) {
          .res-in { animation: none; }
          .app-wrapper { overflow-x: hidden !important; padding-bottom: 4rem !important; }
          .content-wrapper { max-width: 100% !important; padding: 1.25rem 0.75rem !important; overflow-x: hidden !important; }
          .header-main { padding: 1.25rem 1rem !important; }

          .role-title { font-size: 0.875rem !important; }
          .dmge-title { font-size: 2.25rem !important; }
          .base-rate-text { font-size: 1.25rem !important; }

          /* Nav: stack vertically, full-width uniform buttons */
          .nav-tabs { flex-direction: column !important; gap: 0.5rem !important; }
          .nav-btn { width: 100% !important; text-align: center !important; padding: 0.75rem 1rem !important; }

          /* Stack all side-by-side button rows */
          .action-buttons,
          .btn-row { flex-direction: column !important; gap: 0.5rem !important; }
          .btn-row > * { width: 100% !important; flex: none !important; }

          /* Reduce PBox shadow to prevent overflow */
          .app-wrapper div { max-width: 100% !important; }

          /* Price grid stacks on narrow screens */
          .price-grid { grid-template-columns: 1fr !important; }

          /* Modal: keep within viewport on tablets and landscape phones */
          .modal-overlay { padding: 0.75rem !important; }
          .modal-overlay > div { max-width: calc(100vw - 1.5rem) !important; }
        }

        /* ──── PHONE (≤480px) ──── */
        @media (max-width: 480px) {
          .header-main { padding: 1rem 0.625rem !important; }

          .dmge-title { font-size: 1.75rem !important; }
          .role-title { font-size: 0.75rem !important; }
          .base-rate-text { font-size: 1rem !important; }
          .nav-btn { padding: 0.625rem 0.75rem !important; font-size: 0.75rem !important; }

          /* Even smaller slider thumb on phone */
          input[type=range]::-webkit-slider-thumb { width: 2rem !important; height: 2rem !important; margin-top: -0.4rem !important; }
          input[type=range]::-moz-range-thumb { width: 2rem !important; height: 2rem !important; }

          /* Tighten modal */
          .modal-overlay { padding: 0.5rem !important; }
          .modal-overlay > div { max-width: 100% !important; }
        }

        :root {
          --pixel-bg: ${(canWhiteLabel(userTier) && profile.branding?.bgColor) || CARTRIDGE.bg};
          --pixel-surface: ${(canWhiteLabel(userTier) && profile.branding?.surfaceColor) || CARTRIDGE.surface};
          --pixel-text: ${(canWhiteLabel(userTier) && profile.branding?.textColor) || CARTRIDGE.text};
          --pixel-accent: ${(canWhiteLabel(userTier) && profile.branding?.accentColor) || "#FFD700"};
        }
      `}</style>

      <div className="app-wrapper" style={{
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--pixel-bg)",
        fontFamily: "'Press Start 2P',monospace",
        transition: "background 0.3s, color 0.3s",
        paddingBottom: 30,
        color: "var(--pixel-text)",
        "--pixel-surface": (canWhiteLabel(userTier) && profile.branding?.overrideThemes !== false && profile.branding?.surfaceColor) ? profile.branding.surfaceColor : activeTheme.roleBoxColor,
        "--pixel-accent": (canWhiteLabel(userTier) && profile.branding?.overrideThemes !== false && profile.branding?.accentColor) ? profile.branding.accentColor : activeTheme.catColor,
        "--pixel-text": (canWhiteLabel(userTier) && profile.branding?.overrideThemes !== false && profile.branding?.textColor) ? profile.branding.textColor : CARTRIDGE.text,
        "--pixel-bg": (canWhiteLabel(userTier) && profile.branding?.overrideThemes !== false && profile.branding?.bgColor) ? profile.branding.bgColor : CARTRIDGE.bg
      }}>
        <HexBackground color={profile.branding?.textColor || "#FFB347"} />
        <div className="main-sticky-header" style={{ position: "sticky", top: 0, zIndex: 20 }}>
          {/* HEADER (SCALED & CENTERED) */}
          {tab !== "invoice_editor" && (
            <div className="header-main" style={{
              background: "#0A0A0A",
              borderBottom: `0.375rem solid ${CARTRIDGE.border}`,
              boxShadow: `0 0.375rem 0 ${activeTheme.modelShadow}`,
              padding: "1rem 2rem",
              transition: "background 0.3s, box-shadow 0.3s"
            }}>
              <div className="header-grid" style={{ maxWidth: "90vw", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: "1rem" }}>

                {/* LEFT: ROLE INFO */}
                <div className="header-left" style={{ textAlign: "left", minWidth: 0, overflow: "hidden" }}>
                  <div className="role-title" style={{ fontSize: "clamp(0.65rem, 1.8vw, 1.25rem)", color: "#FFB347", lineHeight: 1.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {role.name.toUpperCase()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: "0.25rem" }}>
                    <span onClick={() => setTab('pricing')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', flexShrink: 0, background: (TIERS[userTier]?.color || '#9E9E9E') + '33', padding: '0.35rem', borderRadius: '4px', border: `0.125rem solid ${TIERS[userTier]?.color || '#9E9E9E'}` }}>
                      {userTier === 'free' && <IconTierFree size={16} color={TIERS[userTier]?.color || '#9E9E9E'} />}
                      {userTier === 'pro' && <IconTierPro size={16} color={TIERS[userTier]?.color || '#FFD700'} />}
                      {userTier === 'agency' && <IconTierAgency size={16} color={TIERS[userTier]?.color || '#E040FB'} />}
                    </span>
                    <span onClick={() => setTab('dashboard')} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', flexShrink: 0, padding: '0.35rem', borderRadius: '4px', background: '#FFB34722', border: '0.125rem solid #FFB347' }}>
                      <IconMenu size={16} color="#FFB347" />
                    </span>
                  </div>
                </div>

                {/* CENTER: TITLE (HOME LINK) */}
                <div className="header-center" style={{ textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} onClick={() => setTab("calc")}>
                  <GlitchLogo
                    text="DMGE"
                    fontSize="clamp(1.8rem, 6vw, 3rem)"
                    primaryColor="#FFB347"
                    secondaryColor="#E91E63"
                    isLoaded={true}
                  />
                  <div style={{ color: '#E91E63', fontSize: "clamp(0.5rem, 1.5vw, 0.75rem)", letterSpacing: "clamp(3px, 0.8vw, 6px)", marginTop: "0.75rem", fontFamily: "'Press Start 2P'" }}>RATE SYSTEM</div>
                </div>

                {/* RIGHT: BASE RATE CONTROLS */}
                <div className="header-right" style={{ textAlign: "right", minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "flex-end" }}>
                  <div
                    className="base-rate-text"
                    onClick={() => { setIsEditingBase(true); setBaseRateInputStr(baseRate.toString()); }}
                    style={{ fontSize: "clamp(0.875rem, 2vw, 1.5rem)", color: "#FFB347", cursor: "pointer", background: isEditingBase ? "#0A0A0A" : "transparent", padding: isEditingBase ? "0.3125rem" : "0", border: isEditingBase ? "0.25rem solid #FFB347" : "none", display: "inline-flex", alignItems: "center", gap: "0.35rem", fontFamily: "'Press Start 2P'", whiteSpace: "nowrap" }}
                  >
                    <IconBigMoney size={Math.min(36, Math.max(20, window.innerWidth * 0.03))} />
                    {isEditingBase ? (
                      <input
                        className="base-rate-input"
                        autoFocus
                        ref={baseInputRef}
                        type="number"
                        value={baseRateInputStr}
                        onChange={e => setBaseRateInputStr(e.target.value)}
                        onBlur={() => {
                          const newRate = parseFloat(baseRateInputStr);
                          if (!isNaN(newRate) && newRate > 0) {
                            setBaseRate(newRate);
                            setBaseRateHasCents(!!(newRate % 1));
                          }
                          setIsEditingBase(false);
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            const newRate = parseFloat(baseRateInputStr);
                            if (!isNaN(newRate) && newRate > 0) {
                              setBaseRate(newRate);
                              setBaseRateHasCents(!!(newRate % 1));
                            }
                            setIsEditingBase(false);
                          }
                        }}
                        style={{ width: "4.5rem", border: "none", background: "transparent", fontFamily: "inherit", fontSize: "inherit", outline: "none", textAlign: "left", color: "var(--pixel-text)" }}
                      />
                    ) : (
                      <span>{baseRateHasCents ? baseRate.toFixed(2) : Math.round(baseRate)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="content-wrapper" style={{ maxWidth: "90vw", margin: "0 auto", padding: "1rem 1.5rem" }}>

          {/* DASHBOARD */}
          {tab === "dashboard" && (
            <div style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <PBtn full small color="#FFB347" onClick={() => setTab("history")} style={{ color: "#0A0A0A" }}>JBS ({dashboardJobCount})</PBtn>
                <PBtn full small color="#FFB347" onClick={() => setTab("templates")} style={{ color: "#0A0A0A" }}>TMP ({templates.length})</PBtn>
                <PBtn full small color="#FFB347" onClick={() => setTab("clients")} style={{ color: "#0A0A0A" }}>CLI ({clients.length})</PBtn>
                <PBtn full small color="#FFB347" onClick={() => {
                  if (!canViewAnalytics(userTier)) {
                    setUpgradeFeature('analytics');
                    setShowUpgradeModal(true);
                  } else setTab("analytics");
                }} style={{ color: "#0A0A0A" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>ANA {!canViewAnalytics(userTier) && <IconLock size={14} color="#0A0A0A" />}</span>
                </PBtn>
                <PBtn full small color="#FFB347" onClick={() => setTab("profile")} style={{ color: "#0A0A0A" }}>PRO</PBtn>
                <PBtn full small color="#FFB347" onClick={() => setTab("calc")} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", color: "#0A0A0A" }}>
                  <IconArrowLeft size={18} color="#0A0A0A" /> CALC
                </PBtn>
              </div>
              <PBtn full small color="#E91E63" style={{ border: "0.25rem solid #0A0A0A", color: "#fff", marginTop: "0.75rem" }} onClick={() => supabase.auth.signOut()}>⏻ SIGN OUT</PBtn>
            </div>
          )}

          {/* MAIN CALCULATION CONTENT */}
          {tab === "calc" && <>
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
          </>}

          {tab === "history" && <>
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
          </>}

          {tab === "templates" && (
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
          )}

          {tab === "clients" && (
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
          )}

          {tab === "analytics" && <>
            <div style={{ marginBottom: "1rem" }}>
              <PBtn small color="#FFB347" onClick={() => setTab("calc")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0A0A0A" }}>
                <IconArrowLeft size={18} color="#0A0A0A" /> CALC
              </PBtn>
              <PLbl accent={catData.accent} style={{ marginBottom: 0, fontSize: "clamp(1.25rem, 3.5vw, 2rem)", textAlign: "center", marginTop: "0.75rem" }}>ANALYTICS</PLbl>
            </div>
            <AnalyticsDashboard jobs={windowedJobs} catData={catData} />
          </>}

          {tab === "tutorial" && (
            <TutorialPage onBack={() => setTab("calc")} />
          )}

          {/* INVOICE EDITOR TAB */}
          {tab === "invoice_editor" && (
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
          )}


          {tab === "pricing" && (
            <PricingPage
              currentTier={userTier}
              onSelectPlan={handlePlanSelect}
              onBack={() => setTab('calc')}
            />
          )}

          {tab === "profile" && <>
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
          </>}
        </div>
      </div>

      {/* CUSTOM MATERIAL MODAL */}
      <PModal isOpen={showMatModal} onClose={() => setShowMatModal(false)} title="ADD CUSTOM ITEM">
        <div style={{ padding: "1.25rem" }}>
          <PLbl>ITEM NAME</PLbl>
          <PInput value={newMatForm.name} onChange={v => setNewMatForm(f => ({ ...f, name: v }))} placeholder="e.g. Travel Offset" style={{ marginBottom: "2.1875rem" }} />

          <PLbl>COST PER UNIT ($)</PLbl>
          <PInput type="number" value={newMatForm.cost} onChange={v => setNewMatForm(f => ({ ...f, cost: v }))} placeholder="0.00" style={{ marginBottom: "2.1875rem" }} />

          <div className="btn-row" style={{ display: "flex", gap: "1.25rem", marginTop: "1.25rem" }}>
            <PBtn full color="#d6f5e3" onClick={confirmAddMaterial} disabled={!newMatForm.name}>ADD TO LIST</PBtn>
            <PBtn full color="#ffd6e8" onClick={() => setShowMatModal(false)}>CANCEL</PBtn>
          </div>
        </div>
      </PModal>

      {/* SAVE TEMPLATE MODAL */}
      <PModal isOpen={showSaveTemplateModal} onClose={() => setShowSaveTemplateModal(false)} title="SAVE TEMPLATE">
        <div style={{ padding: "1.25rem" }}>
          <PLbl>TEMPLATE NAME</PLbl>
          <PInput
            value={newTemplateForm.name}
            onChange={v => setNewTemplateForm(f => ({ ...f, name: v }))}
            placeholder="e.g. Photography Headshot Session"
            style={{ marginBottom: "2.1875rem" }}
          />

          <PLbl>NOTES (OPTIONAL)</PLbl>
          <textarea
            value={newTemplateForm.notes}
            onChange={e => setNewTemplateForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="e.g. Standard headshot session with 2 edits"
            style={{
              width: "100%",
              fontFamily: "'Press Start 2P'",
              fontSize: "0.75rem",
              lineHeight: 1.6,
              padding: "1.5625rem 2.1875rem",
              background: "var(--pixel-surface, #e8f4f8)",
              border: "0.5rem solid #2a2a2a",
              boxShadow: "0.625rem 0.625rem 0 #2a2a2a",
              outline: "none",
              color: "var(--pixel-text, #2a2a2a)",
              minHeight: 120,
              resize: "vertical",
              marginBottom: "2.1875rem"
            }}
          />

          <div className="btn-row" style={{ display: "flex", gap: "1.25rem", marginTop: "1.25rem" }}>
            <PBtn full color="#d6f5e3" onClick={handleSaveTemplate} disabled={!newTemplateForm.name}>SAVE TEMPLATE</PBtn>
            <PBtn full color="#ffd6e8" onClick={() => setShowSaveTemplateModal(false)}>CANCEL</PBtn>
          </div>
        </div>
      </PModal>

      {/* DELETE CONFIRMATION MODAL */}
      <PModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="CONFIRM DELETE">
        <div style={{ padding: "1.25rem", textAlign: "center", fontFamily: "'Press Start 2P'" }}>
          <div style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.9375rem)", color: "#FFB347", marginBottom: "2.1875rem", lineHeight: 2.2 }}>
            ARE YOU SURE YOU WANT TO DELETE:<br />
            <span style={{ color: "#E91E63", fontSize: "clamp(1rem, 2vw, 1.25rem)" }}>{deleteTarget.label}</span>?
            <br /><br />
            THIS ACTION CANNOT BE UNDONE.
          </div>
          <div className="btn-row" style={{ display: "flex", gap: "1.25rem", marginTop: "1.25rem" }}>
            <PBtn full color="#E91E63" onClick={confirmDelete} style={{ color: "#fff", fontSize: "clamp(0.75rem, 1.2vw, 0.8125rem)" }}>YES, DELETE</PBtn>
            <PBtn full color="#1A1A1A" onClick={() => setShowDeleteModal(false)} style={{ color: "#FFB347", fontSize: "clamp(0.75rem, 1.2vw, 0.8125rem)" }}>CANCEL</PBtn>
          </div>
        </div>
      </PModal>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        feature={upgradeFeature}
        currentTier={userTier}
        onUpgrade={handleUpgrade}
      />
    </>
  );
}
