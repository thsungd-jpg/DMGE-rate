import React, { useEffect, useRef, useState } from "react";
import { registerChapter, rectOf, COLORS, PALS, pointer } from "./scene";
import { PBtn } from "../components/ui";
import Auth from "../components/Auth";
import { TIERS, PROMO } from "../utils/subscription";
import {
  CATEGORIES, ROLE_COUNT, CLIENT_TYPES, USAGES, clientMods, usageRightsMods,
  niceCategory, rolesOf, quote, money,
} from "./demo";

// ───────────────────────── helpers ─────────────────────────

/** Register a chapter with the liquid scene. `build` always sees fresh closures via a ref. */
function useChapter(id, elRef, build) {
  const buildRef = useRef(build);
  buildRef.current = build;
  useEffect(
    () => registerChapter(id, { get el() { return elRef.current; }, build: (ctx) => buildRef.current(ctx) }),
    [id, elRef],
  );
}

const reduced = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** Tween a number toward `target` (money counters). */
function useCountUp(target, ms = 650) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    if (reduced()) { setVal(target); from.current = target; return undefined; }
    const start = performance.now();
    const a = from.current;
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / ms);
      const e = 1 - Math.pow(1 - t, 3);
      const v = a + (target - a) * e;
      from.current = v;
      setVal(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return val;
}

// cluster rows: [dx, dy, hw, hh, r] in units of (stage half-min), y up
const CLOUD = [
  [0, 0, 0.62, 0.55, 0.55],
  [-0.38, 0.2, 0.38, 0.38, 0.38],
  [0.4, 0.26, 0.34, 0.34, 0.34],
  [0.16, -0.4, 0.4, 0.3, 0.3],
  [-0.32, -0.3, 0.3, 0.3, 0.3],
  [0.12, 0.48, 0.26, 0.26, 0.26],
];

function variantRows(i) {
  const rows = [[0, 0, 0.5 + 0.06 * Math.sin(i), 0.46, 0.46]];
  for (let j = 0; j < 5; j++) {
    const a = (j / 5) * Math.PI * 2 + i * 0.9;
    const rad = 0.4 + 0.13 * Math.sin(i * 1.3 + j * 2.1);
    const s = 0.23 + 0.1 * Math.cos(i * 0.7 + j * 1.9);
    rows.push([Math.cos(a) * rad * 1.2, Math.sin(a) * rad, s * (1 + 0.35 * Math.sin(i + j)), s * (1 - 0.2 * Math.sin(i * 2 + j)), s * 0.85]);
  }
  return rows;
}

function rowsToShapes(S, rows, scale = 1, cols = [COLORS.pink]) {
  const m = Math.min(S.w, S.h) * 0.5 * scale;
  return rows.map((r, i) => ({
    cx: S.cx + r[0] * m, cy: S.cy - r[1] * m, hw: r[2] * m, hh: r[3] * m, r: r[4] * m, col: cols[i % cols.length],
  }));
}

function cardShapes(refs, cols, inflate = 10, radius = 34, boost = {}) {
  const out = [];
  refs.forEach((ref, i) => {
    if (!ref.current) return;
    const q = rectOf(ref.current);
    const b = boost[i] || 0;
    out.push({ cx: q.cx, cy: q.cy, hw: q.w / 2 + inflate + b, hh: q.h / 2 + inflate + b, r: radius + inflate * 0.5, col: cols[i] });
  });
  return out;
}

// texture picker: each craft family samples a different marble render at a different offset
const texFor = (i) => [i % 3 === 0 ? 1 : 0, i % 3 === 1 ? 1 : 0, i % 3 === 2 ? 1 : 0];
const seedFor = (i) => [(i * 0.173) % 1, (i * 0.291) % 1];

const dot = (i) => ["var(--pink)", "var(--blue)", "var(--mint)", "var(--butter)", "var(--lilac)"][i % 5];

// ───────────────────────── 1 · hero ─────────────────────────

const HERO_WORDS = ["Know", "what", "your", "work", "is", "worth."];

export function Hero({ onStart, onFlow }) {
  const ref = useRef(null);
  const stage = useRef(null);

  useChapter("hero", ref, ({ W }) => {
    const S0 = rectOf(stage.current);
    const m = Math.min(S0.w, S0.h) * 0.5;
    // lean toward the cursor a little, and sit a touch to the right like the reference render
    const S = { ...S0, cx: S0.cx + S0.w * 0.05 + (pointer.x - 0.5) * m * 0.22, cy: S0.cy + (pointer.y - 0.5) * m * 0.16 };
    return { shapes: rowsToShapes(S, CLOUD, W >= 900 ? 1.34 : 0.98, PALS[0]), k: m * 0.42, bevel: m * 0.78, wob: m * 0.045, marble: 1, shadow: 1, pal: PALS[0], tex: [1, 0, 0], seed: [0, 0] };
  });

  return (
    <section id="top" ref={ref} className="ll-ch ll-hero" aria-labelledby="ll-h1">
      <div className="ll-grid">
        <div className="ll-copy">
          <p className="ll-kicker ll-reveal">Rate calculator for creative freelancers</p>
          <h1 className="ll-h1" id="ll-h1" aria-label="Know what your work is worth.">
            {HERO_WORDS.map((w) => (
              <span className="ll-word" key={w} aria-hidden="true"><span>{w}</span></span>
            ))}
          </h1>
          <p className="ll-lede ll-reveal">
            Pick your craft, say who it&rsquo;s for, and get three honest prices in seconds. Then turn the one you choose into an invoice.
          </p>
          <div className="ll-cta ll-reveal">
            <PBtn color="#2B2140" onClick={onStart} style={{ color: "#FFF6E8" }}>Start free</PBtn>
            <PBtn color="#FFFBF4" onClick={onFlow}>See how it flows</PBtn>
          </div>
          <p className="ll-meta ll-reveal">{ROLE_COUNT} roles · {CATEGORIES.length} creative fields · free to start</p>
        </div>
        <div className="ll-stage" ref={stage} aria-hidden="true" />
      </div>
      <a className="ll-scroll-hint" href="#pick" onClick={(e) => { e.preventDefault(); onFlow(); }}>Scroll</a>
    </section>
  );
}

// ───────────────────────── 2 · pick ─────────────────────────

export function Pick({ demo, demoRef, setDemo }) {
  const ref = useRef(null);
  const stage = useRef(null);

  useChapter("pick", ref, () => {
    const S0 = rectOf(stage.current);
    const m = Math.min(S0.w, S0.h) * 0.5;
    const S = { ...S0, cx: S0.cx + (pointer.x - 0.5) * m * 0.16, cy: S0.cy + (pointer.y - 0.5) * m * 0.12 };
    const i = demoRef.current.catIdx;
    return { shapes: rowsToShapes(S, variantRows(i), 1, PALS[i % PALS.length]), k: m * 0.4, bevel: m * 0.72, wob: m * 0.05, marble: 1, shadow: 1, pal: PALS[i % PALS.length], tex: texFor(i), seed: seedFor(i) };
  });

  const roles = rolesOf(CATEGORIES[demo.catIdx]).slice(0, 8);
  const q = quote(demo);

  return (
    <section id="pick" ref={ref} className="ll-ch" aria-labelledby="ll-pick">
      <div className="ll-grid">
        <div>
          <p className="ll-kicker ll-reveal">01 · Craft</p>
          <h2 className="ll-h2 ll-reveal" id="ll-pick">Start with what you make.</h2>
          <p className="ll-lede ll-reveal">Choose your field and DMGE loads starting rates for every role in it. Watch the liquid take a new shape for each one.</p>
          <div className="ll-chips ll-reveal" role="group" aria-label="Creative field">
            {CATEGORIES.map((c, i) => (
              <button key={c} type="button" className="ll-chip" style={{ "--chip-fill": dot(i) }} aria-pressed={demo.catIdx === i}
                onClick={() => setDemo({ catIdx: i, roleIdx: 0 })}>
                <i />{niceCategory(c)}
              </button>
            ))}
          </div>
          <p className="ll-label ll-reveal">Role</p>
          <div className="ll-chips ll-reveal" role="group" aria-label="Role">
            {roles.map((r, i) => (
              <button key={r.name} type="button" className="ll-chip" style={{ "--chip-fill": dot(demo.catIdx) }} aria-pressed={demo.roleIdx === i}
                onClick={() => setDemo({ roleIdx: i })}>
                {r.name}
              </button>
            ))}
          </div>
          <p className="ll-meta ll-reveal" aria-live="polite">Starting rate: {money(q.model.base)} {q.model.unit}</p>
        </div>
        <div className="ll-stage" ref={stage} aria-hidden="true" />
      </div>
    </section>
  );
}

// ───────────────────────── 3 · context ─────────────────────────

export function Context({ demo, demoRef, setDemo }) {
  const ref = useRef(null);
  const stage = useRef(null);

  useChapter("context", ref, () => {
    const d = demoRef.current;
    const S = rectOf(stage.current);
    const m = Math.min(S.w, S.h) * 0.5;
    const cm = clientMods[d.clientType] || 1;
    const um = usageRightsMods[d.usage] || 1;
    const scale = 0.62 + 0.05 * Math.min(4.5, cm * um - 1);
    // lift the blob so the price readout can sit underneath it
    const Sb = { ...S, cy: S.cy - Math.min(S.w, S.h) * 0.12 };
    const base = rowsToShapes(Sb, CLOUD.slice(0, 4), scale, PALS[d.catIdx % PALS.length]);
    const ci = Math.max(0, CLIENT_TYPES.indexOf(d.clientType));
    const ui = Math.max(0, USAGES.indexOf(d.usage));
    const aA = Math.PI * 0.85 + (ci / 3) * Math.PI * 0.6;
    const aB = Math.PI * 0.15 - (ui / 3) * Math.PI * 0.6;
    const dA = 0.92 - 0.2 * (cm - 1);   // pricier client -> orb pulled closer -> stronger bridge
    const dB = 0.92 - 0.1 * (um - 1);
    const orbs = [
      { cx: Sb.cx + Math.cos(aA) * dA * m, cy: Sb.cy - Math.sin(aA) * dA * m, hw: 0.17 * m, hh: 0.17 * m, r: 0.17 * m, col: COLORS.butter },
      { cx: Sb.cx + Math.cos(aB) * dB * m, cy: Sb.cy - Math.sin(aB) * dB * m, hw: 0.2 * m, hh: 0.2 * m, r: 0.2 * m, col: COLORS.lilac },
    ];
    return { shapes: [...base, ...orbs], k: m * 0.4, bevel: m * 0.62, wob: m * 0.04, marble: 0.85, shadow: 1, pal: PALS[d.catIdx % PALS.length], tex: texFor(d.catIdx), seed: seedFor(d.catIdx) };
  });

  const q = quote(demo);
  const fair = useCountUp(q.fair);

  return (
    <section id="context" ref={ref} className="ll-ch" aria-labelledby="ll-context">
      <div className="ll-grid ll-grid--flip">
        <div className="ll-stage ll-stage--end" ref={stage}>
          <div className="ll-readout" aria-live="polite">
            <span>Fair price</span>
            <b>{money(fair)}</b>
            <em>×{(q.clientMult * q.usageMult).toFixed(2)} for this context</em>
          </div>
        </div>
        <div>
          <p className="ll-kicker ll-reveal">02 · Context</p>
          <h2 className="ll-h2 ll-reveal" id="ll-context">Say who it&rsquo;s for.</h2>
          <p className="ll-lede ll-reveal">The same work is worth more to a corporation than to a friend. Client type and usage rights pull the price like magnets.</p>
          <p className="ll-label ll-reveal">Client</p>
          <div className="ll-chips ll-reveal" role="group" aria-label="Client type">
            {CLIENT_TYPES.map((c, i) => (
              <button key={c} type="button" className="ll-chip" style={{ "--chip-fill": dot(i + 3) }} aria-pressed={demo.clientType === c}
                onClick={() => setDemo({ clientType: c })}>
                {c} <small>×{clientMods[c]}</small>
              </button>
            ))}
          </div>
          <p className="ll-label ll-reveal">Usage rights</p>
          <div className="ll-chips ll-reveal" role="group" aria-label="Usage rights">
            {USAGES.map((u, i) => (
              <button key={u} type="button" className="ll-chip" style={{ "--chip-fill": dot(i) }} aria-pressed={demo.usage === u}
                onClick={() => setDemo({ usage: u })}>
                {u} <small>×{usageRightsMods[u]}</small>
              </button>
            ))}
          </div>
          <p className="ll-label ll-reveal">{q.model.unit}</p>
          <div className="ll-units ll-reveal">
            <PBtn small color="#d6e8f5" aria-label="Fewer" onClick={() => setDemo({ units: Math.max(1, demo.units - 1) })}>−</PBtn>
            <output>{demo.units}</output>
            <PBtn small color="#d6f5e3" aria-label="More" onClick={() => setDemo({ units: Math.min(40, demo.units + 1) })}>+</PBtn>
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── 4 · price ─────────────────────────

const TIER_META = [
  { key: "low", name: "Budget", col: COLORS.blue, cssCol: "var(--blue)", note: "20% under fair. Wins the job, leaves room to negotiate." },
  { key: "fair", name: "Fair", col: COLORS.mint, cssCol: "var(--mint)", note: "Your baseline for this client and usage.", star: true },
  { key: "premium", name: "Premium", col: COLORS.pink, cssCol: "var(--pink)", note: "30% over fair. For rush work, exclusivity, or risk." },
];

export function Price({ demo, demoRef, setDemo }) {
  const ref = useRef(null);
  const refs = [useRef(null), useRef(null), useRef(null)];

  useChapter("price", ref, () => {
    const sel = TIER_META.findIndex((t) => t.key === demoRef.current.tier);
    return { shapes: cardShapes(refs, TIER_META.map((t) => t.col), 10, 32, { [sel]: 6 }), k: 12, bevel: 46, wob: 0, marble: 0.12, shadow: 0.5, pal: PALS[1] };
  });

  const q = quote(demo);
  const lo = useCountUp(q.low), fa = useCountUp(q.fair), pr = useCountUp(q.premium);
  const vals = [lo, fa, pr];

  return (
    <section id="price" ref={ref} className="ll-ch" aria-labelledby="ll-price">
      <div className="ll-center">
        <div className="ll-head">
          <p className="ll-kicker ll-reveal">03 · Price</p>
          <h2 className="ll-h2 ll-reveal" id="ll-price">Three honest prices.</h2>
          <p className="ll-lede ll-reveal">The liquid splits into three. Pick the one you&rsquo;ll quote &mdash; it carries into your invoice.</p>
        </div>
        <div className="ll-tiers ll-reveal" role="group" aria-label="Pick a price">
          {TIER_META.map((t, i) => (
            <button key={t.key} ref={refs[i]} type="button" className="ll-tier" aria-pressed={demo.tier === t.key} onClick={() => setDemo({ tier: t.key })}>
              <span className="ll-tier-name">
                <span>{t.name}{t.star && <span className="ll-tier-star"> ★</span>}</span>
                <span className="ll-tier-dot" style={{ background: t.cssCol }} />
              </span>
              <span className="ll-tier-price">{money(vals[i])}</span>
              <span className="ll-tier-note">{t.note}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── 5 · invoice ─────────────────────────

export function InvoiceCh({ demo, demoRef }) {
  const ref = useRef(null);
  const card = useRef(null);

  useChapter("invoice", ref, () => {
    const q = card.current ? cardShapes([card], [COLORS.pink], 14, 30) : [];
    return { shapes: q, k: 20, bevel: 54, wob: 0, marble: 1, lines: 0.6, shadow: 0.6, pal: PALS[3], tex: [0, 0, 1], seed: [0.2, 0.1] };
  });

  const q = quote(demo);
  const tier = TIER_META.find((t) => t.key === demo.tier) || TIER_META[1];
  const total = q[tier.key];

  return (
    <section id="invoice" ref={ref} className="ll-ch" aria-labelledby="ll-invoice">
      <div className="ll-grid">
        <div>
          <p className="ll-kicker ll-reveal">04 · Invoice</p>
          <h2 className="ll-h2 ll-reveal" id="ll-invoice">Send it like a pro.</h2>
          <p className="ll-lede ll-reveal">Save the job and export a PDF invoice with your logo and numbering, or email it straight to the client.</p>
          <p className="ll-meta ll-reveal">The sample on the right uses the price you just picked.</p>
        </div>
        <div className="ll-invoice ll-reveal" ref={card}>
          <div className="ll-inv-top"><h3>Invoice</h3><span className="ll-inv-tag">Sample</span></div>
          <div className="ll-inv-row">
            <span>{q.role.name}<small>{demo.units} × {q.model.unit} at {money(q.model.base)}</small></span>
            <span>{money(q.model.base * demo.units)}</span>
          </div>
          <div className="ll-inv-row"><span>Client: {demo.clientType}</span><span>×{q.clientMult}</span></div>
          <div className="ll-inv-row"><span>Usage: {demo.usage}</span><span>×{q.usageMult}</span></div>
          <div className="ll-inv-row"><span>Price tier</span><span>{tier.name}</span></div>
          <div className="ll-inv-total"><span>Total due</span><b>{money(total)}</b></div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── 6 · plans ─────────────────────────

const PLAN_COLORS = [COLORS.blue, COLORS.butter, COLORS.lilac];

function planFeatures(t) {
  const l = t.limits;
  return [
    [`${l.clients} clients`, true],
    [`${l.templates} templates`, true],
    [`${l.pdfsPerDay} PDF invoices a day`, true],
    ["CSV export & analytics", l.csvExport && l.analytics],
    ["Cloud sync & white-label", l.cloudSync && l.whiteLabel],
    ["Priority support", l.prioritySupport],
  ];
}

export function Plans({ onStart }) {
  const ref = useRef(null);
  const refs = [useRef(null), useRef(null), useRef(null)];

  useChapter("plans", ref, () => ({ shapes: cardShapes(refs, PLAN_COLORS, 10, 34, { 1: 6 }), k: 12, bevel: 46, wob: 0, marble: 0.12, shadow: 0.5, pal: PALS[2] }));

  const plans = [
    { id: "free", t: TIERS.free, price: "$0", per: "forever" },
    { id: "pro", t: TIERS.pro, price: `$${TIERS.pro.prices.monthly}`, per: "/month", promo: `First month $${PROMO.firstMonthPrice}` },
    { id: "agency", t: TIERS.agency, price: `$${TIERS.agency.prices.monthly}`, per: "/month", promo: `First month $${PROMO.firstMonthPrice}` },
  ];

  return (
    <section id="plans" ref={ref} className="ll-ch" aria-labelledby="ll-plans">
      <div className="ll-center">
        <div className="ll-head">
          <p className="ll-kicker ll-reveal">05 · Plans</p>
          <h2 className="ll-h2 ll-reveal" id="ll-plans">Free to start. Grow when you do.</h2>
          <p className="ll-lede ll-reveal">Everything above works on the free plan. Upgrade later from inside the app.</p>
        </div>
        <div className="ll-plans ll-reveal">
          {plans.map((p, i) => (
            <div key={p.id} ref={refs[i]} className="ll-plan">
              <h3>{p.t.name}</h3>
              <div className="ll-plan-price">{p.price} <small>{p.per}</small></div>
              {p.promo ? <span className="ll-plan-promo">{p.promo}</span> : <span style={{ height: 27 }} />}
              <ul>
                {planFeatures(p.t).map(([label, on]) => <li key={label} data-off={on ? undefined : ""}>{label}</li>)}
              </ul>
              <PBtn color={i === 1 ? "#FFE98A" : "#FFFBF4"} onClick={onStart}>Start free</PBtn>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── 7 · launch ─────────────────────────

export function Launch({ onAuthSuccess, initialMode }) {
  const ref = useRef(null);
  const auth = useRef(null);

  useChapter("start", ref, () => {
    if (!auth.current) return { shapes: [] };
    const q = rectOf(auth.current);
    const m = Math.max(q.w, q.h) * 0.5;
    return {
      shapes: [
        { cx: q.cx, cy: q.cy, hw: q.w / 2 + 16, hh: q.h / 2 + 16, r: 46, col: COLORS.pink },
        { cx: q.cx - q.w * 0.62, cy: q.cy - q.h * 0.3, hw: m * 0.34, hh: m * 0.34, r: m * 0.34, col: COLORS.blue },
        { cx: q.cx + q.w * 0.66, cy: q.cy + q.h * 0.32, hw: m * 0.4, hh: m * 0.4, r: m * 0.4, col: COLORS.mint },
        { cx: q.cx + q.w * 0.5, cy: q.cy - q.h * 0.62, hw: m * 0.22, hh: m * 0.22, r: m * 0.22, col: COLORS.butter },
      ],
      k: 38, bevel: 80, wob: 8, marble: 0.8, shadow: 0.8, pal: PALS[4], tex: [0, 1, 0], seed: [0.1, 0.3],
    };
  });

  return (
    <section id="start" ref={ref} className="ll-ch" aria-labelledby="ll-start">
      <div className="ll-center ll-launch">
        <div className="ll-head" style={{ marginBottom: 0 }}>
          <p className="ll-kicker ll-reveal">Start</p>
          <h2 className="ll-h2 ll-reveal" id="ll-start">Your next quote starts here.</h2>
          <p className="ll-lede ll-reveal">Create a free account in seconds, or sign in to pick up where you left off.</p>
        </div>
        <div className="ll-auth ll-reveal" ref={auth}>
          <Auth variant="card" onAuthSuccess={onAuthSuccess} initialMode={initialMode} />
        </div>
      </div>
    </section>
  );
}
