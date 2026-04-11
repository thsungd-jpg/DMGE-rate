import { useState, useEffect } from "react";

// ─────────────────────────────────────────────
// ART DISCIPLINES + MATERIALS
// ─────────────────────────────────────────────
const DISCIPLINES = {
  "📷 Photography": {
    color: "#b5d5f5",
    accent: "#4a90d9",
    materials: [
      { name: "Film Roll (36exp)", cost: 14 },
      { name: "Print 8x10 (each)", cost: 4 },
      { name: "Print 4x6 (set/25)", cost: 8 },
      { name: "Darkroom Session/hr", cost: 20 },
      { name: "Photo Book (softcover)", cost: 35 },
      { name: "USB Delivery Drive", cost: 12 },
      { name: "Backdrop Rental", cost: 40 },
      { name: "Prop Kit", cost: 25 },
    ],
  },
  "🎨 Illustration": {
    color: "#ffd6e8",
    accent: "#d94a8a",
    materials: [
      { name: "Arches Watercolor Sheet", cost: 5 },
      { name: "Copic Markers (set/12)", cost: 55 },
      { name: "Fine Liner Set", cost: 18 },
      { name: "Bristol Board (pad)", cost: 14 },
      { name: "Gouache Set", cost: 30 },
      { name: "Print & Ship A3", cost: 12 },
      { name: "Canvas Stretch 16x20", cost: 22 },
      { name: "Procreate Brush Pack", cost: 10 },
    ],
  },
  "✂️ Cutting & Sewing": {
    color: "#d6f5e3",
    accent: "#2a9d5c",
    materials: [
      { name: "Cotton Fabric (per yd)", cost: 8 },
      { name: "Silk Fabric (per yd)", cost: 28 },
      { name: "Interfacing (per yd)", cost: 5 },
      { name: "Pattern Paper (roll)", cost: 15 },
      { name: "Thread Set (12 spools)", cost: 16 },
      { name: "Zipper Pack (10ct)", cost: 9 },
      { name: "Buttons / Hardware", cost: 12 },
      { name: "Machine Maintenance", cost: 45 },
    ],
  },
  "🖶 Printmaking": {
    color: "#f5e6d6",
    accent: "#c4622d",
    materials: [
      { name: "Lino Block (A4)", cost: 8 },
      { name: "Etching Plate (zinc)", cost: 22 },
      { name: "Screen 18x20", cost: 35 },
      { name: "Etching Ink (tube)", cost: 14 },
      { name: "Screen Ink (pint)", cost: 18 },
      { name: "Speedball Carving Set", cost: 20 },
      { name: "Brayer / Roller", cost: 15 },
      { name: "Exposure Unit (use)", cost: 30 },
    ],
  },
  "🏺 Ceramics": {
    color: "#f5f0d6",
    accent: "#b8860b",
    materials: [
      { name: "Stoneware Clay (25lb)", cost: 22 },
      { name: "Porcelain Clay (25lb)", cost: 35 },
      { name: "Glaze (pint)", cost: 14 },
      { name: "Kiln Firing (load)", cost: 60 },
      { name: "Underglaze Set (6)", cost: 45 },
      { name: "Trimming Tools Set", cost: 18 },
      { name: "Slab Roller (per hr)", cost: 10 },
      { name: "Wax Resist (pint)", cost: 12 },
    ],
  },
  "🎭 Face & Body Art": {
    color: "#ead6f5",
    accent: "#8a4ad9",
    materials: [
      { name: "Face Paint Set (pro)", cost: 45 },
      { name: "Skin-safe Glitter (jar)", cost: 16 },
      { name: "Brush Set", cost: 28 },
      { name: "Sponge Pack (20ct)", cost: 10 },
      { name: "Body Paint 8oz", cost: 22 },
      { name: "Fixing Spray", cost: 14 },
      { name: "Latex Prosthetics", cost: 35 },
      { name: "Airbrush Rental", cost: 50 },
    ],
  },
  "📐 Graphic Design": {
    color: "#d6e8f5",
    accent: "#2a70d9",
    materials: [
      { name: "Adobe CC (monthly)", cost: 55 },
      { name: "Stock Image License", cost: 30 },
      { name: "Font License", cost: 45 },
      { name: "Mockup Pack", cost: 20 },
      { name: "Print Proof", cost: 15 },
      { name: "Pantone Swatch Book", cost: 180 },
      { name: "External SSD", cost: 70 },
      { name: "Tablet Pen Nibs (set)", cost: 12 },
    ],
  },
  "🪡 Fiber & Textile": {
    color: "#f5d6d6",
    accent: "#d94a4a",
    materials: [
      { name: "Wool Yarn (100g skein)", cost: 18 },
      { name: "Embroidery Floss/50", cost: 22 },
      { name: "Loom Rental (session)", cost: 25 },
      { name: "Weaving Warp (per yd)", cost: 6 },
      { name: "Natural Dye Kit", cost: 40 },
      { name: "Tapestry Needles Set", cost: 8 },
      { name: "Hoop Set (3 sizes)", cost: 20 },
      { name: "Blocking Mats", cost: 30 },
    ],
  },
};

// ─────────────────────────────────────────────
// PRICING ENGINE
// ─────────────────────────────────────────────
const complexityMods = { Simple: 0.8, Standard: 1.0, Complex: 1.4, Masterpiece: 2.0 };
const usageRightsMods = { "Personal": 1.0, "Commercial": 1.6, "Merch/Print": 1.9, "Exclusive": 2.5 };
const clientMods = { Individual: 1.0, Startup: 1.2, Agency: 1.5, Corporate: 2.2 };

function calcPrice({ baseRate, hours, complexity, usage, rush, revisions, materialsCost, platformFee, clientType }) {
  const base = baseRate * hours;
  const cM = complexityMods[complexity] || 1;
  const uM = usageRightsMods[usage] || 1;
  const clM = clientMods[clientType] || 1;
  const rushM = rush ? 1.3 : 1;
  const revM = revisions === 0 ? 0.95 : revisions <= 2 ? 1 : 1.15;
  const subtotal = base * cM * uM * rushM * revM * clM;
  const withMats = subtotal + (Number(materialsCost) || 0);
  const final = withMats * (1 + (Number(platformFee) || 0) / 100);
  const fair = Math.max(final, 50);
  return { low: fair * 0.8, fair, premium: fair * 1.3 };
}

async function saveJob(job) {
  const existing = JSON.parse(localStorage.getItem("rate_jobs_v2") || "[]");
  localStorage.setItem("rate_jobs_v2", JSON.stringify([job, ...existing]));
}
async function loadJobs() {
  return JSON.parse(localStorage.getItem("rate_jobs_v2") || "[]");
}

// ─────────────────────────────────────────────
// PIXEL COMPONENTS
// ─────────────────────────────────────────────
function PBox({ children, style = {}, bg = "#fffdf7", borderColor = "#2a2a2a", shadowColor = "#2a2a2a" }) {
  return (
    <div style={{ background: bg, border: `3px solid ${borderColor}`, boxShadow: `4px 4px 0 ${shadowColor}`, padding: 14, ...style }}>
      {children}
    </div>
  );
}

function PBtn({ children, onClick, color = "#b5d5f5", full = false, small = false, disabled = false }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onClick} onMouseDown={() => setP(true)} onMouseUp={() => setP(false)} onMouseLeave={() => setP(false)} disabled={disabled}
      style={{
        fontFamily: "'Press Start 2P', monospace", fontSize: small ? 7 : 8, color: "#2a2a2a",
        background: color, border: "3px solid #2a2a2a",
        boxShadow: p ? "1px 1px 0 #2a2a2a" : "4px 4px 0 #2a2a2a",
        padding: small ? "5px 8px" : "10px 14px", cursor: disabled ? "default" : "pointer",
        width: full ? "100%" : "auto", transform: p ? "translate(3px,3px)" : "none",
        transition: "box-shadow 0.05s, transform 0.05s", lineHeight: 1.8, opacity: disabled ? 0.5 : 1,
      }}
    >{children}</button>
  );
}

function PLbl({ children, accent = "#6a5a7a" }) {
  return <div style={{ fontFamily: "'Press Start 2P'", fontSize: 7, color: accent, marginBottom: 8, lineHeight: 1.8 }}>{children}</div>;
}

function PStepper({ value, onChange, min = 0, step = 1, suffix = "" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <PBtn small color="#ffd6e8" onClick={() => onChange(Math.max(min, value - step))}>◀</PBtn>
      <div style={{ fontFamily: "'Press Start 2P'", fontSize: 13, color: "#2a2a2a", minWidth: 64, textAlign: "center", background: "#fffdf7", border: "3px solid #2a2a2a", boxShadow: "3px 3px 0 #2a2a2a", padding: "8px 4px" }}>
        {value}{suffix}
      </div>
      <PBtn small color="#d6f5e3" onClick={() => onChange(value + step)}>▶</PBtn>
    </div>
  );
}

function PDivider({ c1, c2 = "#fffdf7" }) {
  return <div style={{ height: 8, margin: "16px 0", backgroundImage: `repeating-conic-gradient(${c1} 0% 25%, ${c2} 0% 50%)`, backgroundSize: "8px 8px" }} />;
}

function OptionGrid({ options, value, onChange, cols = 4, activeColor, activeShadow }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
      {Object.entries(options).map(([k, v]) => {
        const active = k === value;
        return (
          <button key={k} onClick={() => onChange(k)} style={{
            fontFamily: "'Press Start 2P'", fontSize: 6, color: "#2a2a2a", lineHeight: 1.9,
            background: active ? activeColor : "#fffdf7",
            border: `3px solid ${active ? activeShadow : "#ccc"}`,
            boxShadow: active ? `3px 3px 0 ${activeShadow}` : "2px 2px 0 #ccc",
            padding: "8px 4px", cursor: "pointer",
          }}>
            {k}<br /><span style={{ color: "#999" }}>x{v}</span>
          </button>
        );
      })}
    </div>
  );
}

function MatChip({ mat, qty, onAdd, onRemove, accent, bg }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: qty > 0 ? bg : "#fffdf7",
      border: `3px solid ${qty > 0 ? accent : "#ddd"}`,
      boxShadow: qty > 0 ? `3px 3px 0 ${accent}` : "2px 2px 0 #ddd",
      padding: "7px 10px", marginBottom: 8, transition: "border 0.1s, background 0.1s",
    }}>
      <div>
        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: "#2a2a2a", lineHeight: 1.9 }}>{mat.name}</div>
        <div style={{ fontFamily: "'Press Start 2P'", fontSize: 6, color: "#aaa" }}>${mat.cost} ea.</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {qty > 0 && <>
          <PBtn small onClick={onRemove} color="#ffd6e8">-</PBtn>
          <div style={{ fontFamily: "'Press Start 2P'", fontSize: 10, minWidth: 18, textAlign: "center" }}>{qty}</div>
        </>}
        <PBtn small onClick={onAdd} color="#d6f5e3">+</PBtn>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [baseRate, setBaseRate] = useState(25);
  const [discipline, setDiscipline] = useState("📷 Photography");
  const [matQtys, setMatQtys] = useState({});
  const [jobs, setJobs] = useState([]);
  const [price, setPrice] = useState(null);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState("calc");
  const [blink, setBlink] = useState(true);
  const [form, setForm] = useState({ hours: 2, complexity: "Standard", usage: "Personal", rush: false, revisions: 1, platformFee: 0, clientType: "Individual" });

  useEffect(() => { const t = setInterval(() => setBlink(b => !b), 530); return () => clearInterval(t); }, []);
  useEffect(() => { loadJobs().then(setJobs); }, []);
  useEffect(() => { setMatQtys({}); setPrice(null); }, [discipline]);

  const disc = DISCIPLINES[discipline];
  const mats = disc.materials;
  const materialsCost = mats.reduce((s, m) => s + (matQtys[m.name] || 0) * m.cost, 0);
  const set = (k) => (v) => { setForm(f => ({ ...f, [k]: v })); setPrice(null); };

  function handleCalc() { setPrice(calcPrice({ ...form, baseRate, materialsCost })); setSaved(false); }

  async function handleSave() {
    await saveJob({ ...form, baseRate, discipline, materialsCost, price: price.fair, date: new Date().toISOString() });
    const updated = await loadJobs();
    setJobs(updated);
    setSaved(true);
    setTimeout(() => setTab("history"), 500);
  }

  const fmtDate = (iso) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const totalBilled = jobs.reduce((s, j) => s + j.price, 0);
  const avgJob = jobs.length ? Math.round(totalBilled / jobs.length) : 0;

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" />
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#fff8f5;}
        input[type=range]{-webkit-appearance:none;height:8px;background:#e0d0ee;border:2px solid #2a2a2a;border-radius:0;outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;background:#ffb347;border:3px solid #2a2a2a;border-radius:0;cursor:pointer;}
        ::-webkit-scrollbar{width:8px;}
        ::-webkit-scrollbar-track{background:#f5ead6;}
        ::-webkit-scrollbar-thumb{background:#2a2a2a;}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .res-in{animation:slideUp 0.18s steps(3,end);}
        select,input{outline:none;}
        select:focus,input:focus{outline:3px solid #ffb347;}
      `}</style>

      <div style={{ minHeight: "100vh", background: `linear-gradient(160deg, ${disc.color}66 0%, #fff8f5 55%, ${disc.color}33 100%)`, fontFamily: "'Press Start 2P',monospace", transition: "background 0.3s", paddingBottom: 60 }}>

        {/* HEADER */}
        <div style={{ background: disc.color, borderBottom: "4px solid #2a2a2a", boxShadow: "0 4px 0 #2a2a2a", padding: "16px 20px 14px", position: "sticky", top: 0, zIndex: 20 }}>
          <div style={{ maxWidth: 520, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 22, color: "#2a2a2a", letterSpacing: "0.06em", lineHeight: 1 }}>★ RATE ★</div>
              <div style={{ fontSize: 7, color: "#5a4a6a", marginTop: 6, lineHeight: 1.8 }}>
                creative pricing tool{blink ? "█" : " "}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 7, color: "#5a4a6a", marginBottom: 4 }}>BASE RATE</div>
              <div style={{ fontSize: 18, color: "#2a2a2a" }}>${baseRate}<span style={{ fontSize: 8 }}>/hr</span></div>
              <input type="range" min="10" max="250" step="5" value={baseRate} onChange={e => setBaseRate(Number(e.target.value))} style={{ width: 110, marginTop: 6 }} />
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>

          {/* DISCIPLINE PICKER */}
          <PBox bg={disc.color + "55"} borderColor={disc.accent} shadowColor={disc.accent} style={{ marginBottom: 18 }}>
            <PLbl accent={disc.accent}>▸ SELECT YOUR CRAFT</PLbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {Object.keys(DISCIPLINES).map(d => {
                const dd = DISCIPLINES[d];
                const active = d === discipline;
                return (
                  <button key={d} onClick={() => setDiscipline(d)} style={{
                    fontFamily: "'Press Start 2P'", fontSize: 6, color: "#2a2a2a",
                    background: active ? dd.color : "#fffdf7",
                    border: `3px solid ${active ? dd.accent : "#ccc"}`,
                    boxShadow: active ? `4px 4px 0 ${dd.accent}` : "2px 2px 0 #ccc",
                    padding: "9px 7px", cursor: "pointer", textAlign: "left", lineHeight: 1.9,
                  }}>{d}</button>
                );
              })}
            </div>
          </PBox>

          {/* TABS */}
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {[["calc", "▸ PRICE JOB"], ["history", `▸ HISTORY (${jobs.length})`]].map(([id, lbl]) => (
              <button key={id} onClick={() => setTab(id)} style={{
                fontFamily: "'Press Start 2P'", fontSize: 7, color: "#2a2a2a",
                background: tab === id ? disc.color : "#e8ddf5",
                border: "3px solid #2a2a2a",
                boxShadow: tab === id ? `4px 4px 0 ${disc.accent}` : "3px 3px 0 #aaa",
                padding: "9px 10px", cursor: "pointer", flex: 1, lineHeight: 1.8,
              }}>{lbl}</button>
            ))}
          </div>

          {/* ─── CALCULATOR ─── */}
          {tab === "calc" && <>

            <PBox bg="#fffdf7" style={{ marginBottom: 14 }}>
              <PLbl>▸ HOURS OF WORK</PLbl>
              <PStepper value={form.hours} onChange={set("hours")} min={0.5} step={0.5} suffix="h" />
            </PBox>

            <PBox bg="#fffdf7" style={{ marginBottom: 14 }}>
              <PLbl>▸ COMPLEXITY</PLbl>
              <OptionGrid options={complexityMods} value={form.complexity} onChange={set("complexity")} cols={4} activeColor={disc.color} activeShadow={disc.accent} />
            </PBox>

            <PBox bg="#fffdf7" style={{ marginBottom: 14 }}>
              <PLbl>▸ CLIENT TYPE</PLbl>
              <OptionGrid options={clientMods} value={form.clientType} onChange={set("clientType")} cols={4} activeColor="#ffd6e8" activeShadow="#d94a8a" />
            </PBox>

            <PBox bg="#fffdf7" style={{ marginBottom: 14 }}>
              <PLbl>▸ USAGE RIGHTS</PLbl>
              <OptionGrid options={usageRightsMods} value={form.usage} onChange={set("usage")} cols={2} activeColor="#f5e6d6" activeShadow="#c4622d" />
            </PBox>

            <PBox bg="#fffdf7" style={{ marginBottom: 14 }}>
              <PLbl>▸ REVISIONS</PLbl>
              <PStepper value={form.revisions} onChange={set("revisions")} min={0} step={1} />
              <div style={{ fontSize: 6, color: "#bbb", marginTop: 8, lineHeight: 2 }}>
                {form.revisions === 0 ? "NONE → -5% DISCOUNT" : form.revisions <= 2 ? "1-2 → STANDARD RATE" : "3+ → +15% SURCHARGE"}
              </div>
            </PBox>

            <PBox bg="#fffdf7" style={{ marginBottom: 14 }}>
              <PLbl>▸ PLATFORM FEE</PLbl>
              <PStepper value={form.platformFee} onChange={set("platformFee")} min={0} step={1} suffix="%" />
            </PBox>

            <PBox bg={form.rush ? "#fff3e0" : "#fffdf7"} borderColor={form.rush ? "#ffb347" : "#2a2a2a"} shadowColor={form.rush ? "#ffb347" : "#2a2a2a"} style={{ marginBottom: 14, cursor: "pointer" }}>
              <div onClick={() => set("rush")(!form.rush)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 24, height: 24, background: form.rush ? "#ffb347" : "#fffdf7", border: "3px solid #2a2a2a", boxShadow: "2px 2px 0 #2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#2a2a2a", flexShrink: 0 }}>
                  {form.rush ? "✓" : ""}
                </div>
                <div>
                  <div style={{ fontSize: 7, color: form.rush ? "#c47a00" : "#2a2a2a", lineHeight: 1.9 }}>⚡ RUSH JOB</div>
                  <div style={{ fontSize: 6, color: "#bbb", lineHeight: 1.9 }}>APPLIES x1.3 RATE</div>
                </div>
              </div>
            </PBox>

            {/* MATERIALS */}
            <PBox bg={disc.color + "33"} borderColor={disc.accent} shadowColor={disc.accent} style={{ marginBottom: 14 }}>
              <PLbl accent={disc.accent}>▸ MATERIALS — {discipline.replace(/^\S+\s/, "").toUpperCase()}</PLbl>
              {mats.map(mat => (
                <MatChip
                  key={mat.name} mat={mat} qty={matQtys[mat.name] || 0}
                  accent={disc.accent} bg={disc.color + "55"}
                  onAdd={() => setMatQtys(q => ({ ...q, [mat.name]: (q[mat.name] || 0) + 1 }))}
                  onRemove={() => setMatQtys(q => ({ ...q, [mat.name]: Math.max(0, (q[mat.name] || 0) - 1) }))}
                />
              ))}
              {materialsCost > 0 && (
                <div style={{ fontFamily: "'Press Start 2P'", fontSize: 9, color: disc.accent, textAlign: "right", marginTop: 6 }}>
                  SUBTOTAL: ${materialsCost.toFixed(2)}
                </div>
              )}
            </PBox>

            <PDivider c1={disc.color} />

            <PBtn full color={disc.color} onClick={handleCalc}>★ CALCULATE PRICE ★</PBtn>

            {price && (
              <div className="res-in" style={{ marginTop: 16 }}>
                <PBox bg={disc.color + "44"} borderColor={disc.accent} shadowColor={disc.accent} style={{ boxShadow: `6px 6px 0 ${disc.accent}` }}>
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 7, color: "#6a5a7a", marginBottom: 10 }}>✦ FAIR MARKET RATE ✦</div>
                    <div style={{ fontSize: 40, color: "#2a2a2a", letterSpacing: "0.02em" }}>${Math.round(price.fair)}</div>
                    {materialsCost > 0 && <div style={{ fontSize: 6, color: "#aaa", marginTop: 6, lineHeight: 2 }}>INCLUDES ${Math.round(materialsCost)} MATERIALS</div>}
                  </div>

                  {/* pixel bar */}
                  <div style={{ display: "flex", height: 16, border: "3px solid #2a2a2a", overflow: "hidden", marginBottom: 14 }}>
                    <div style={{ width: `${(price.low / price.premium) * 100}%`, background: "#ddd", borderRight: "2px solid #2a2a2a" }} />
                    <div style={{ width: `${((price.fair - price.low) / price.premium) * 100}%`, background: disc.color, borderRight: "2px solid #2a2a2a" }} />
                    <div style={{ flex: 1, background: "#f5e0d0" }} />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                    {[["BUDGET", price.low, "#e8ddf5"], ["FAIR ★", price.fair, disc.color], ["PREMIUM", price.premium, "#f5e6d6"]].map(([lbl, val, bg]) => (
                      <PBox key={lbl} bg={bg} style={{ textAlign: "center", padding: "10px 4px" }}>
                        <div style={{ fontSize: 13, color: "#2a2a2a", marginBottom: 4 }}>${Math.round(val)}</div>
                        <div style={{ fontSize: 6, color: "#888" }}>{lbl}</div>
                      </PBox>
                    ))}
                  </div>

                  <PBtn full color={saved ? "#d6f5e3" : "#ffd6e8"} onClick={handleSave}>
                    {saved ? "✓ SAVED!" : "▸ SAVE JOB"}
                  </PBtn>
                </PBox>
              </div>
            )}
          </>}

          {/* ─── HISTORY ─── */}
          {tab === "history" && <>
            {jobs.length === 0 ? (
              <PBox bg="#fffdf7" style={{ textAlign: "center", padding: 40 }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>📋</div>
                <div style={{ fontSize: 7, color: "#ccc", lineHeight: 2 }}>NO JOBS SAVED YET</div>
              </PBox>
            ) : (
              <>
                <PBox bg={disc.color + "55"} borderColor={disc.accent} shadowColor={disc.accent} style={{ marginBottom: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 6, color: "#6a5a7a", marginBottom: 6 }}>AVG. JOB VALUE</div>
                      <div style={{ fontSize: 20, color: "#2a2a2a" }}>${avgJob}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 6, color: "#6a5a7a", marginBottom: 6 }}>TOTAL BILLED</div>
                      <div style={{ fontSize: 20, color: "#2a2a2a" }}>${Math.round(totalBilled)}</div>
                    </div>
                  </div>
                </PBox>

                {jobs.map((j, i) => {
                  const jd = DISCIPLINES[j.discipline] || disc;
                  return (
                    <PBox key={i} bg="#fffdf7" borderColor={jd.accent} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 16, color: "#2a2a2a", marginBottom: 8 }}>${Math.round(j.price)}</div>
                          <div style={{ fontSize: 6, color: "#999", lineHeight: 2.2 }}>
                            {j.discipline || "—"}<br />
                            {j.hours}h · {j.clientType} · {j.complexity}{j.rush ? " ⚡" : ""}
                            {j.materialsCost > 0 && <><br />${Math.round(j.materialsCost)} materials</>}
                          </div>
                        </div>
                        <div style={{ background: jd.color, border: "2px solid #2a2a2a", padding: "4px 7px", fontSize: 6, color: "#2a2a2a", whiteSpace: "nowrap" }}>
                          {fmtDate(j.date)}
                        </div>
                      </div>
                    </PBox>
                  );
                })}
              </>
            )}
          </>}
        </div>
      </div>
    </>
  );
}