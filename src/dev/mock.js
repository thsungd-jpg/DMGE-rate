// DEV-ONLY mock session so every in-app screen can be rendered and tested without a real login.
//   /?mock=1            logged in as a fake local user (Pro tier) with sample jobs, clients and templates
//   /?mock=1&tier=free  or tier=agency   pick a subscription tier
//   /?mock=empty        same, but with no data (empty states)
//   /?mock=reset        re-seed the sample data
//   &tab=history        open a screen directly (calc, history, templates, clients, analytics, profile, tutorial, pricing)
// Nothing here ships: `import.meta.env.DEV` is false in production builds, so this whole module is dead code.
import { calcPrice } from "../utils/pricing";

const day = (n) => new Date(Date.now() - n * 86400000).toISOString();

function job(i, o) {
  const form = { units: 2, complexity: "Standard", usage: "Personal", rush: false, revisions: 1, platformFee: 0, clientType: "Individual", travelExpense: 0, notes: "", ...o.form };
  const prices = calcPrice({ ...form, baseRate: o.baseRate, materialsCost: o.materialsCost || 0, clientMultiplier: o.mult || 1 });
  const price = Math.round(prices[o.tier || "fair"]);
  return {
    id: "job-demo-" + i, ...form, baseRate: o.baseRate, category: o.category, role: o.role, model: o.model,
    materialsCost: o.materialsCost || 0, materials: o.materials || [], price, date: day(o.daysAgo), status: o.status,
    clientId: o.clientId, invoiceNumber: "INV-" + (1000 + i), invoiceDate: day(o.daysAgo), dueDate: day(o.daysAgo - 14),
    invoiceStatus: o.invoiceStatus || o.status, sentAt: o.sent ? day(o.daysAgo - 1) : null, paidAt: o.status === "paid" ? day(o.daysAgo - 6) : null, notes: o.form?.notes || "",
  };
}

function seed(empty) {
  const clients = empty ? [] : [
    { id: "cli-demo-1", name: "Northwind Studio", email: "hello@northwind.example", phone: "555-0142", preferredComplexity: "Complex", preferredUsageRights: "Commercial", preferredClientType: "Startup", rateMultiplier: 1.2, notes: "Prefers invoices on the 1st." },
    { id: "cli-demo-2", name: "Atlas & Co", email: "billing@atlas.example", phone: "555-0190", preferredComplexity: "Standard", preferredUsageRights: "Commercial", preferredClientType: "Agency", rateMultiplier: 1.5, notes: "Net 30." },
    { id: "cli-demo-3", name: "Mara Ellison", email: "mara@ellison.example", phone: "", preferredComplexity: "Simple", preferredUsageRights: "Personal", preferredClientType: "Individual", rateMultiplier: 1, notes: "" },
    { id: "cli-demo-4", name: "Helix Media Group", email: "ap@helix.example", phone: "555-0107", preferredComplexity: "Masterpiece", preferredUsageRights: "Exclusive", preferredClientType: "Corporate", rateMultiplier: 2.2, notes: "PO number required." },
  ];
  const G = { category: "Visual And Graphic Arts", role: "Graphic Designer", model: "Hourly Rate", baseRate: 35 };
  const M = { category: "Music", role: "Songwriter / Composer", model: "Co-Write Fee", baseRate: 200 };
  const F = { category: "Film And Tv", role: "Director", model: "DGA Day Rate (TV)", baseRate: 5000 };
  const T = { category: "Tech And Digital", role: "Web Developer (Media / Streaming)", model: "Hourly Rate", baseRate: 50 };
  const jobs = empty ? [] : [
    job(1, { ...G, status: "paid", daysAgo: 41, clientId: "cli-demo-2", mult: 1.5, form: { units: 12, complexity: "Complex", usage: "Commercial", clientType: "Agency", revisions: 2, notes: "Brand identity system" } }),
    job(2, { ...M, status: "paid", daysAgo: 27, clientId: "cli-demo-1", mult: 1.2, form: { units: 1, complexity: "Standard", usage: "Commercial", clientType: "Startup", notes: "Podcast theme" } }),
    job(3, { ...T, status: "sent", sent: true, daysAgo: 16, clientId: "cli-demo-1", mult: 1.2, form: { units: 24, complexity: "Standard", usage: "Commercial", clientType: "Startup", rush: true, notes: "Landing page build" } }),
    job(4, { ...G, status: "pending", daysAgo: 9, clientId: "cli-demo-3", form: { units: 5, complexity: "Simple", notes: "Wedding stationery" } }),
    job(5, { ...F, status: "pending", daysAgo: 4, clientId: "cli-demo-4", mult: 2.2, tier: "premium", form: { units: 2, complexity: "Masterpiece", usage: "Exclusive", clientType: "Corporate", travelExpense: 800, notes: "Commercial spot, 2 shoot days" } }),
    job(6, { ...G, status: "pending", daysAgo: 1, clientId: "cli-demo-2", mult: 1.5, tier: "low", form: { units: 8, complexity: "Standard", usage: "Commercial", clientType: "Agency", notes: "Social template pack" } }),
  ];
  const templates = empty ? [] : [
    { id: "tpl-demo-1", name: "Brand identity: agency", category: G.category, role: G.role, model: G.model, baseRate: 35, form: { units: 12, complexity: "Complex", usage: "Commercial", rush: false, revisions: 2, platformFee: 0, clientType: "Agency", travelExpense: 0 }, materials: [], notes: "Starting point for identity work", createdAt: day(30), usageCount: 3 },
    { id: "tpl-demo-2", name: "Landing page: rush", category: T.category, role: T.role, model: T.model, baseRate: 50, form: { units: 24, complexity: "Standard", usage: "Commercial", rush: true, revisions: 1, platformFee: 0, clientType: "Startup", travelExpense: 0 }, materials: [], notes: "", createdAt: day(12), usageCount: 1 },
  ];
  const profile = {
    name: "Demo Freelancer", defaultBaseRate: 35, presets: [], invoicePrefix: "INV-", invoiceStartNumber: 1000, lastInvoiceNumber: 1006,
    companyName: "Demo Studio", companyEmail: "studio@demo.example", companyPhone: "555-0100", companyAddress: "12 Garden Lane, Portland, OR", paymentInstructions: "Bank transfer, details on request.", invoiceTerms: "Net 14", taxId: "",
    branding: { companyName: "Demo Studio", logoBase64: "", surfaceColor: "#1A1A1A", bgColor: "#0A0A0A", textColor: "#FFB347", accentColor: "#E91E63" },
    pdfQuota: { day: "", count: 0 },
  };
  localStorage.setItem("rateapp_clients", JSON.stringify(clients));
  localStorage.setItem("rateapp_jobs", JSON.stringify(jobs));
  localStorage.setItem("rateapp_templates", JSON.stringify(templates));
  localStorage.setItem("rateapp_profile", JSON.stringify(profile));
  localStorage.setItem("rateapp_has_seen_tutorial", "true");
  localStorage.setItem("rateapp_dev_seeded", empty ? "empty" : "full");
}

function build() {
  const q = new URLSearchParams(window.location.search);
  const mode = q.get("mock");
  const want = mode === "empty" ? "empty" : "full";
  if (mode === "reset" || mode === "empty" || localStorage.getItem("rateapp_dev_seeded") !== want) seed(want === "empty");
  const tier = ["free", "pro", "agency"].includes(q.get("tier")) ? q.get("tier") : "pro";
  return { user: { id: "dev-user", email: "dev@local.test" }, tier, tab: q.get("tab") || null };
}

export const devMock = import.meta.env.DEV && typeof window !== "undefined" && new URLSearchParams(window.location.search).has("mock") ? build() : null;
