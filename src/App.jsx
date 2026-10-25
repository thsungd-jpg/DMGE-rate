import React, { useState, useEffect, useRef, Suspense } from "react";
import rolesData from "./processed_roles.json";
import { exportJobsToCSV } from "./utils/csvExport";
import { generateInvoicePDF } from "./utils/pdfExport";
import { supabase } from "./utils/supabaseClient";
import Auth from "./components/Auth";
import { Mark } from "./components/Brand";
import { devMock } from "./dev/mock";
import { AppTopBar, AppDock } from "./app/AppChrome";
import { playCalculate, playSave, playEmail, playGlow, isMuted, toggleMuted } from "./utils/sfx";
import { TIERS, loadSubscription, canAddTemplate, canExportCSV, canViewAnalytics, canExportPDF, canWhiteLabel, getJobsWithinWindow, canCloudSync } from "./utils/subscription";
import { redirectToCheckout, redirectToBillingPortal, invokeEdgeFunction, getValidSession } from "./utils/stripe";
import { calcPrice, hasLicensing } from "./utils/pricing";
import { CATEGORY_THEMES, getMashupTheme, CARTRIDGE } from "./utils/themeUtils";
import CalcScreen from "./screens/CalcScreen";
import HistoryScreen from "./screens/HistoryScreen";
import TemplatesScreen from "./screens/TemplatesScreen";
import ClientsScreen from "./screens/ClientsScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import TutorialScreen from "./screens/TutorialScreen";
import InvoiceEditorScreen from "./screens/InvoiceEditorScreen";
import PricingScreen from "./screens/PricingScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AppModals from "./screens/AppModals";

// Landing is code-split: it pulls in WebGL/GSAP/Lenis only for logged-out visitors.
const Landing = React.lazy(() => import("./landing/Landing"));
// Ambient liquid behind the app (shader + textures are code-split).
const AppLiquid = React.lazy(() => import("./app/AppLiquid"));

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
      // empty = unset: the day/night theme tokens apply (only real white-label choices override them)
      surfaceColor: "",
      bgColor: "",
      textColor: "",
      accentColor: ""
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
      // empty = unset: the day/night theme tokens apply (only real white-label choices override them)
      surfaceColor: "",
      bgColor: "",
      textColor: "",
      accentColor: ""
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
  const [tab, setTab] = useState((devMock && devMock.tab) || "calc");
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

  // Guided UX state
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
      alert("That logo file is too large. Please use an image under 2MB.");
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

  const [currentUser, setCurrentUser] = useState(devMock ? devMock.user : null);
  const [authLoading, setAuthLoading] = useState(!devMock);
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
    if (devMock) return undefined; // dev mock session: no Supabase auth
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
    if (devMock) setSubscription({ tier: devMock.tier, stripe_customer_id: null });
    else loadSubscription().then(setSubscription);

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
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, padding: 32, fontFamily: "var(--font-body, system-ui, sans-serif)", background: "var(--cream, #FFF6E8)", color: "var(--ink, #1c1a26)", textAlign: "center", lineHeight: 1.6, fontSize: 16, maxWidth: 560, margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-display, serif)", fontSize: 32, lineHeight: 1.1 }}>App config missing</p>
        <p>
          Add <code style={{ background: "var(--paper, #fff)", padding: "2px 6px", borderRadius: 6 }}>.env.local</code> next to <code style={{ background: "var(--paper, #fff)", padding: "2px 6px", borderRadius: 6 }}>package.json</code> with your Supabase + Stripe keys, then restart the dev server.
        </p>
        <pre style={{ textAlign: "left", background: "var(--ink, #1c1a26)", color: "var(--cream, #FFF6E8)", padding: 16, borderRadius: 12, overflow: "auto", fontFamily: "var(--font-mono, monospace)", fontSize: 13, width: "100%", boxSizing: "border-box" }}>
          {`VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`}
        </pre>
        <p>Terminal: <code style={{ background: "var(--paper, #fff)", padding: "2px 6px", borderRadius: 6 }}>npm run dev</code> — use the Network URL if localhost does not load in the editor browser.</p>
      </div>
    );
  }

  if (authLoading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--cream, #FFF6E8)" }} role="status" aria-label="Loading">
      <Mark size={44} />
    </div>
  );

  // Password-recovery links land straight on the new-password form.
  if (recoveredMode) {
    return (
      <Auth
        variant="page"
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          setRecoveredMode(false);
        }}
        initialMode="update_password"
      />
    );
  }

  // Logged-out visitors get the animated Liquid Ledger landing, which hosts sign-in.
  if (!currentUser) {
    return (
      <Suspense fallback={<div style={{ height: "100vh", background: "var(--cream, #FFF6E8)" }} />}>
        <Landing
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            setRecoveredMode(false);
          }}
          initialMode="login"
        />
      </Suspense>
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
    const lic = hasLicensing(category, role.name);
    setPrice(calcPrice({ ...form, usageTerm: lic ? form.usageTerm : undefined, exclusive: lic && !!form.exclusive, baseRate, materialsCost, clientMultiplier: cMult }));
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
        usageTerm: hasLicensing(category, role.name) ? form.usageTerm : undefined,
        exclusive: hasLicensing(category, role.name) && !!form.exclusive,
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
      alert("Could not find the category for this job.");
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
    if (!confirm("This will permanently delete all local jobs, clients and templates. Are you sure?")) return;

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
      setEmailStatus({ type: "error", message: "Please enter a recipient email address." });
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
      // let the inline success banner be seen before heading back to Jobs
      setTimeout(() => {
        setTab("history");
        setEmailStatus({ type: null, message: "" });
      }, 1600);
    } catch (err) {
      console.error("Failed to send email:", err);
      setEmailStatus({ type: "error", message: "Failed to send: " + (err.message || "") });
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

    // White-label colors only count when the user really customised them: the old retro defaults saved in existing
  // profiles (#1A1A1A, #0A0A0A, #FFB347, #E91E63) are treated as unset so they do not fight the new look.
  const LEGACY_BRAND_DEFAULTS = ["#1a1a1a", "#0a0a0a", "#ffb347", "#e91e63"];
  const brandColor = (key) => {
    const v = profile.branding?.[key];
    const custom = canWhiteLabel(userTier) && profile.branding?.overrideThemes !== false && v && !LEGACY_BRAND_DEFAULTS.includes(String(v).toLowerCase());
    return custom ? v : null;
  };

  // Everything the extracted screens need, in one bag (see src/screens/*).
  const ctx = {
    ALL_DATA,
    advanceGlow,
    catData,
    category,
    clients,
    confirmAddMaterial,
    confirmDelete,
    currentUser,
    customMaterials,
    deleteTarget,
    emailForm,
    emailStatus,
    filteredJobs,
    fmtDate,
    form,
    glowStep,
    handleAddCustomMaterial,
    handleCalc,
    handleDeleteJob,
    handleEditJob,
    handleGatedCSV,
    handleGatedPDF,
    handleLogoUpload,
    handlePlanSelect,
    handleReset,
    handleResetModel,
    handleSave,
    handleSaveTemplate,
    handleSendQuote,
    handleToggleMute,
    handleUpgrade,
    handleUseTemplate,
    historyJobs,
    isSendingEmail,
    jobStatusFilter,
    jobs,
    loadClientsFromStorage,
    loadJobs,
    loadTemplatesFromStorage,
    matPriceOverrides,
    matQtys,
    materialSummary,
    materialsCost,
    mats,
    model,
    modelIdx,
    muted,
    newMatForm,
    newTemplateForm,
    price,
    profile,
    resetAppData,
    resetKey,
    role,
    roleIdx,
    saveClientToStorage,
    saveJob,
    saveProfile,
    saveTemplateToStorage,
    saved,
    selectedClientId,
    selectedJobForEmail,
    selectedTier,
    sendEmail,
    set,
    setCategory,
    setClients,
    setDeleteTarget,
    setEmailForm,
    setEmailStatus,
    setForm,
    setInvoiceEditorData,
    setJobStatusFilter,
    setJobs,
    setMatPriceOverrides,
    setMatQtys,
    setModelIdx,
    setNewMatForm,
    setNewTemplateForm,
    setPrice,
    setProfile,
    setRoleIdx,
    setSelectedClientId,
    setSelectedTier,
    setShowDeleteModal,
    setShowMatModal,
    setShowSaveTemplateModal,
    setShowUpgradeModal,
    setTab,
    setTemplates,
    setUpgradeFeature,
    showDeleteModal,
    showMatModal,
    showSaveTemplateModal,
    showUpgradeModal,
    templates,
    todayPdfCount,
    totalBilled,
    upgradeFeature,
    userTier,
    windowedJobs,
  };

return (
    <>
      <style>{`
        /* App-mode globals (only while the signed-in app is mounted; the landing page scrolls normally). */
        *{box-sizing:border-box;margin:0;padding:0;}
        html, body { overflow: hidden; height: 100%; }
        body { background: var(--cream, #FFF6E8); }
        .app-wrapper{scrollbar-width:thin;}
        input{outline:none;}
        input[type=range]{-webkit-appearance:none;appearance:none;height:10px;background:var(--line-strong);border:none;border-radius:999px;outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:30px;height:30px;border-radius:50%;border:2px solid var(--paper);background:radial-gradient(circle at 35% 30%,#fff,var(--pink) 55%,var(--blue));box-shadow:var(--sh-2);cursor:pointer;}
        input[type=range]::-moz-range-thumb{width:30px;height:30px;border-radius:50%;border:2px solid var(--paper);background:radial-gradient(circle at 35% 30%,#fff,var(--pink) 55%,var(--blue));box-shadow:var(--sh-2);cursor:pointer;}
        ::-webkit-scrollbar{width:10px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:var(--line-strong);border-radius:999px;}
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type=number] { -moz-appearance: textfield; }
        .app-wrapper { overflow-wrap: break-word; word-break: normal; }
        @media (max-width: 768px) { .app-wrapper { overflow-x: hidden !important; } }

        :root {
          --pixel-bg: ${brandColor("bgColor") || "var(--cream)"};
          --pixel-surface: ${brandColor("surfaceColor") || "var(--paper)"};
          --pixel-text: ${brandColor("textColor") || "var(--ink)"};
          --pixel-accent: ${brandColor("accentColor") || "var(--pink)"};
        }
      `}</style>

      <React.Suspense fallback={null}><AppLiquid tab={tab} /></React.Suspense>

      <AppTopBar
        tab={tab}
        userTier={userTier}
        setTab={setTab}
        baseRate={baseRate}
        baseRateHasCents={baseRateHasCents}
        onBaseRateChange={(n) => { setBaseRate(n); setBaseRateHasCents(!!(n % 1)); }}
      />

      <div className="app-wrapper" style={{
        height: "100vh",
        overflowY: "auto",
        overflowX: "hidden",
        background: "transparent",
        position: "relative",
        zIndex: 1,
        fontFamily: "var(--font-body)",
        color: "var(--pixel-text)",
        "--pixel-surface": brandColor("surfaceColor") || "var(--paper)",
        "--pixel-accent": brandColor("accentColor") || "var(--pink)",
        "--pixel-text": brandColor("textColor") || "var(--ink)",
        "--pixel-bg": brandColor("bgColor") || "var(--cream)",
      }}>
        {/* each tab remounts on change and eases in while the liquid flies out and back in */}
        <div className="app-stage kit-page-enter" key={tab}>

          {/* MAIN CALCULATION CONTENT */}
          {tab === "calc" && <CalcScreen ctx={ctx} />}

          {tab === "history" && <HistoryScreen ctx={ctx} />}

          {tab === "templates" && <TemplatesScreen ctx={ctx} />}

          {tab === "clients" && <ClientsScreen ctx={ctx} />}

          {tab === "analytics" && <AnalyticsScreen ctx={ctx} />}

          {tab === "tutorial" && <TutorialScreen ctx={ctx} />}

          {/* INVOICE EDITOR TAB */}
          {tab === "invoice_editor" && <InvoiceEditorScreen ctx={ctx} />}


          {tab === "pricing" && <PricingScreen ctx={ctx} />}

          {tab === "profile" && <ProfileScreen ctx={ctx} />}
        </div>
      </div>

      <AppDock
        tab={tab}
        setTab={setTab}
        canViewInsights={canViewAnalytics(userTier)}
        onLockedInsights={() => { setUpgradeFeature("analytics"); setShowUpgradeModal(true); }}
        jobCount={dashboardJobCount}
        onSignOut={() => (devMock ? window.location.assign("/") : supabase.auth.signOut())}
      />

      <AppModals ctx={ctx} />
    </>
  );
}
