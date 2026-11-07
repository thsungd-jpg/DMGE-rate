import React from "react";
import {
  IconTalent, IconTag, IconMoney, IconJobs, IconSend, IconStar, IconTech, IconHelp, IconBiz,
  IconEdit, IconTemplates, IconPending, IconVisual, IconMusic, IconFilm, IconCheck,
} from "../../icons";

// Content for the walkthrough. Copy is short and plain; the illustrations are decorative (aria-hidden) CSS/SVG.

/* ── illustrations ─────────────────────────────────────────── */
function ArtCraft() {
  const chips = [
    { Icon: IconVisual, label: "Illustrator", tone: "pink" },
    { Icon: IconMusic, label: "Composer", tone: "blue" },
    { Icon: IconFilm, label: "Editor", tone: "mint" },
  ];
  return (
    <div className="tut-art tut-art--craft" aria-hidden="true">
      {chips.map(({ Icon, label, tone }, i) => (
        <span key={label} className={`tut-chip tut-chip--${tone}`} style={{ "--d": `${i * 0.9}s` }}>
          <Icon size={20} /> {label}
        </span>
      ))}
      <span className="tut-rate">
        <small>Starting rate</small>
        <b>$45<i>/hr</i></b>
      </span>
      <span className="tut-eg">Example</span>
    </div>
  );
}

function ArtContext() {
  const rows = [
    { label: "Complexity", opts: ["Simple", "Standard", "Complex"], on: 1 },
    { label: "Usage", opts: ["Personal", "Commercial", "Exclusive"], on: 1 },
    { label: "Client", opts: ["Individual", "Startup", "Corporate"], on: 2 },
  ];
  return (
    <div className="tut-art tut-art--ctx" aria-hidden="true">
      {rows.map((r, ri) => (
        <div className="tut-row" key={r.label}>
          <span className="tut-row-label">{r.label}</span>
          <span className="tut-opts">
            {r.opts.map((o, oi) => (
              <span key={o} className={"tut-opt" + (oi === r.on ? " is-on" : "")} style={{ "--d": `${ri * 0.5}s` }}>{o}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function ArtPrices() {
  const bars = [
    { label: "Budget", amount: "$480", tone: "blue", h: 46 },
    { label: "Fair", amount: "$640", tone: "mint", h: 66 },
    { label: "Premium", amount: "$860", tone: "pink", h: 92 },
  ];
  return (
    <div className="tut-art tut-art--prices" aria-hidden="true">
      <div className="tut-bars">
        {bars.map((b, i) => (
          <div className="tut-bar-col" key={b.label} style={{ "--d": `${i * 0.12}s` }}>
            <b className="tut-bar-amount">{b.amount}</b>
            <span className={`tut-bar tut-bar--${b.tone}`} style={{ height: b.h }} />
            <span className="tut-bar-label">{b.label}</span>
          </div>
        ))}
      </div>
      <span className="tut-eg">Example</span>
    </div>
  );
}

function ArtSave() {
  return (
    <div className="tut-art tut-art--save" aria-hidden="true">
      <div className="tut-log">
        <span className="tut-log-row tut-log-row--new">
          <span className="tut-log-dot"><IconCheck size={14} /></span>
          <span className="tut-log-text"><b>Logo refresh</b><small>Saved just now</small></span>
          <span className="tut-log-amt">$640</span>
        </span>
        <span className="tut-log-row">
          <span className="tut-log-dot tut-log-dot--off"><IconJobs size={14} /></span>
          <span className="tut-log-text"><b>Podcast theme</b><small>Last week</small></span>
          <span className="tut-log-amt">$900</span>
        </span>
        <span className="tut-log-row tut-log-row--ghost">
          <span className="tut-log-dot tut-log-dot--off"><IconJobs size={14} /></span>
          <span className="tut-log-text"><b>Landing page</b><small>2 weeks ago</small></span>
          <span className="tut-log-amt">$2,400</span>
        </span>
      </div>
    </div>
  );
}

function ArtInvoice() {
  return (
    <div className="tut-art tut-art--invoice" aria-hidden="true">
      <div className="tut-sheet">
        <span className="tut-sheet-head"><b>Invoice</b><small>INV-1001</small></span>
        <span className="tut-line" style={{ width: "78%" }} />
        <span className="tut-line" style={{ width: "58%" }} />
        <span className="tut-line" style={{ width: "68%" }} />
        <span className="tut-sheet-total"><small>Total</small><b>$640</b></span>
      </div>
      <span className="tut-plane"><IconSend size={26} /></span>
    </div>
  );
}

export const STEPS = [
  {
    key: "craft",
    tone: "pink",
    Icon: IconTalent,
    title: "Pick your craft",
    body: "Search for what you do, or browse the fields. If your craft is not listed, add it once and it is yours to reuse. Then choose how you charge: by the hour, the day, the project, the piece, or a share of a deal.",
    tip: "Try typing podcast, tattoo or florist.",
    Art: ArtCraft,
  },
  {
    key: "context",
    tone: "blue",
    Icon: IconTag,
    title: "Set the context",
    body: "Set your base rate, then tell us about the job: how many units, how complex it is, who the client is, where the work will be used and how many revisions are included. Each answer nudges the price up or down.",
    tip: "Next and Back move you along, or tap a dot to jump.",
    Art: ArtContext,
  },
  {
    key: "prices",
    tone: "mint",
    Icon: IconMoney,
    title: "Get three prices",
    body: "The last step gives you three numbers: a budget price, a fair price and a premium price. Pick the one that suits the client and the moment.",
    tip: "Not sure? Start with fair and adjust from there.",
    Art: ArtPrices,
  },
  {
    key: "save",
    tone: "butter",
    Icon: IconJobs,
    title: "Save it",
    body: "Save the quote to your job log so you can find it, edit it or reuse it later. If you quote the same kind of job often, save the setup as a template.",
    tip: "Templates and jobs live in their own tabs.",
    Art: ArtSave,
  },
  {
    key: "invoice",
    tone: "lilac",
    Icon: IconSend,
    title: "Send an invoice",
    body: "Turn any saved job into a polished PDF invoice with your details, then send it straight to the client.",
    tip: "Open a job in Jobs and choose Invoice.",
    Art: ArtInvoice,
  },
];

/** What each calculator box does, in plain words. */
export const FIELD_NOTES = [
  { Icon: IconStar, title: "Craft and how you charge", body: "Sets your starting point. Every way of charging comes with a typical starting rate: a starting point, not a promise. All other adjustments build on the rate you settle on." },
  { Icon: IconMoney, title: "Rate", body: "Your base rate for one unit. Start from a typical rate (adjusted for your experience), from your own goal (what you want to take home, worked out in Profile) or from a number you already use. Where it fits, a quick check shows what US employees in a similar job earn, for orientation only." },
  { Icon: IconTech, title: "Quantity", body: "Multiplies your starting price. Charging by the hour, day or item? Enter how many. For example, $50/hr for 3 hours is $150." },
  { Icon: IconHelp, title: "Complexity", body: "Adjusts the price for how hard the job is. An easy job lowers it slightly; a tough one raises it so you are paid fairly." },
  { Icon: IconTag, title: "Usage rights", body: "Charges for where the work will be shown. A quick local flyer stays cheap; a national TV ad reflects the bigger value." },
  { Icon: IconBiz, title: "Client type", body: "Adjusts the price for client size. Corporations have bigger budgets and need more management; individuals get a friendlier price." },
  { Icon: IconEdit, title: "Revisions", body: "Protects your time from scope creep. The first edits are usually free; more rounds raise the price to cover the extra hours." },
  { Icon: IconMoney, title: "Commute cost", body: "Adds a flat fee for travel. Gas or a train ticket, it adds that exact amount to the total." },
  { Icon: IconTemplates, title: "Materials and supplies", body: "Adds flat fees for physical items such as props, software licences or specialised tools, passed on to the client." },
  { Icon: IconPending, title: "Rush and platform fee", body: "Rush adds 30% for a fast turnaround. Platform fee adds a percentage to cover card processing fees." },
];

