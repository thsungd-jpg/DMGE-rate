import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Go } from "../world/controls";
import { warmAudio } from "../utils/sfx";
import { IconArrowLeft, IconArrowRight, IconBook, IconVolume, IconVolumeOff } from "../icons";
import { reduced } from "./quote/common";
import CraftStation from "./quote/CraftStation";
import JobStation from "./quote/JobStation";
import RateStation from "./quote/RateStation";
import { RightsStation, WhoStation } from "./quote/WhoRights";
import ExtrasStation from "./quote/ExtrasStation";
import PriceStation from "./quote/PriceStation";
import "../world/world.css";

// The Quote page as a journey: one station per screen over the scrapbook scene (src/world), in place of the old stack of cards. All the state and every
// handler still come from App through `ctx`, unchanged; this file decides what is shown and in what order, and each station lives in ./quote.

const STATIONS = [
  { id: "craft",  name: "Craft",  title: <>What do you <em>do?</em></>,         hint: "Search for your craft, or browse the fields. Not listed? Add it." },
  { id: "job",    name: "Job",    title: <>Size the <em>job.</em></>,           hint: "How you charge, how much of it, and how demanding it is." },
  { id: "rate",   name: "Rate",   title: <>What should you <em>charge?</em></>, hint: "Your base rate for one unit of this job. The next steps adjust it." },
  { id: "who",    name: "Who",    title: <>Who is it <em>for?</em></>,          hint: "Say who is paying, or pick a client you have saved." },
  { id: "rights", name: "Rights", title: <>How will it be <em>used?</em></>,    hint: "What the client may do with the work changes what it is worth." },
  { id: "extras", name: "Extras", title: <>Anything <em>extra?</em></>,         hint: "Optional details that move the price. Open any tag to set it." },
  { id: "price",  name: "Price",  title: <>Your <em>price.</em></>,             hint: "Three honest prices. Pick the one you quote." },
];
const LAST = STATIONS.length - 1;
const indexOfStation = (id) => STATIONS.findIndex((s) => s.id === id);

export default function QuoteJourney({ ctx }) {
  const {
    form, handleAddCustomMaterial, handleCalc, handleReset, handleToggleMute, matPriceOverrides, matQtys, materialSummary, materialsCost, mats, customMaterials,
    muted, price, resetKey, set, setForm, setScene, setMatPriceOverrides, setMatQtys, setPrice, setTab,
  } = ctx;

  const [at, setAt] = useState(price ? LAST : 0); // the station on screen; a quote you already have opens on its price
  const stationRef = useRef(null), titleRef = useRef(null), shown = useRef(at); // shown: the station the page last moved to

  // moving: arriving at the price makes sure there is one
  const go = (to) => {
    const next = Math.max(0, Math.min(LAST, to));
    if (next === LAST && !price) handleCalc();
    setAt(next);
  };
  const goTo = (id) => go(indexOfStation(id));

  // a new station rises into place; the page is back at the top and the title has focus (so a screen reader announces where you are). Only when the
  // station really changed: not on first load, and not on the second run React's strict mode does in development.
  useLayoutEffect(() => {
    if (shown.current === at) return undefined;
    shown.current = at;
    document.querySelector(".app-wrapper")?.scrollTo({ top: 0 });
    titleRef.current?.focus({ preventScroll: true });
    if (reduced() || !stationRef.current) return undefined;
    const t = gsap.fromTo(stationRef.current.querySelectorAll(".qw-in"), { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, ease: "power3.out", stagger: 0.07, clearProps: "transform,opacity" });
    return () => t.kill();
  }, [at]);

  // the first tap or key anywhere sets the sound system up, so the first Calculate does not pay for it
  useEffect(() => {
    const warm = () => { try { warmAudio(); } catch { /* no audio: nothing to do */ } };
    window.addEventListener("pointerdown", warm, { once: true }); window.addEventListener("keydown", warm, { once: true });
    return () => { window.removeEventListener("pointerdown", warm); window.removeEventListener("keydown", warm); };
  }, []);

  // the scene behind the page lives in App (so it carries over from page to page); this tells it which station the camera belongs at
  useLayoutEffect(() => { setScene(at); }, [at, setScene]);

  const patch = (obj) => { setForm((f) => ({ ...f, ...obj })); setPrice(null); };

  const st = STATIONS[at];
  return (
    <>
      <section className="qw" aria-label="Quote">
        <div className="qw-top">
          {form.id && <span className="qw-editing">Editing {form.invoiceNumber}</span>}
          <button type="button" className="qw-icon" aria-label={muted ? "Turn sounds on" : "Turn sounds off"} onClick={handleToggleMute}>
            {muted ? <IconVolumeOff size={19} /> : <IconVolume size={19} />}
          </button>
          <button type="button" className="qw-paperbtn" aria-label="Tutorial" onClick={() => setTab("tutorial")}><IconBook size={17} /><span>Tutorial</span></button>
        </div>

        <p className="qw-sr" role="status" aria-live="polite">{`Step ${at + 1} of ${STATIONS.length}: ${st.name}`}</p>

        <div className="qw-col" ref={stationRef} key={at}>
          <h1 className="qw-title" tabIndex={-1} ref={titleRef}>{st.title}</h1>
          <p className="qw-hint qw-in">{st.hint}</p>

          <div className="qw-body">
            {st.id === "craft" && <CraftStation ctx={ctx} />}
            {st.id === "job" && <JobStation ctx={ctx} patch={patch} />}
            {st.id === "rate" && <RateStation ctx={ctx} patch={patch} goTo={goTo} />}
            {st.id === "who" && <WhoStation ctx={ctx} />}
            {st.id === "rights" && <RightsStation ctx={ctx} patch={patch} />}
            {st.id === "extras" && (
              <div className="qw-in">
                <ExtrasStation
                  key={resetKey}
                  form={form} set={set} patch={patch} materialSummary={materialSummary} materialsCost={materialsCost}
                  mats={mats} customMaterials={customMaterials} matPriceOverrides={matPriceOverrides} matQtys={matQtys}
                  setMatQtys={setMatQtys} setMatPriceOverrides={setMatPriceOverrides} onAddCustom={handleAddCustomMaterial}
                />
              </div>
            )}
            {st.id === "price" && <PriceStation ctx={ctx} goTo={goTo} onRestart={() => { handleReset(); setAt(0); }} />}
          </div>
        </div>
        <div className="qw-scrim" aria-hidden="true" />
        <nav className="qw-bar" aria-label="Quote steps">
          <button type="button" className="qw-back" aria-label="Back" disabled={at === 0} onClick={() => go(at - 1)}><IconArrowLeft size={18} /><span>Back</span></button>
          <ol className="qw-rail">
            {STATIONS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button" className={"qw-stop" + (i < at ? " is-done" : "")} aria-current={i === at ? "step" : undefined}
                  aria-label={`Step ${i + 1} of ${STATIONS.length}: ${s.name}`} onClick={() => go(i)}
                >
                  <i className="qw-dot" /><span className="qw-stop-name">{s.name}</span>
                </button>
              </li>
            ))}
          </ol>
          {at < LAST && <Go icon={<IconArrowRight size={19} />} onClick={() => go(at + 1)}>{at === LAST - 1 ? <><span className="qw-opt">Get my price</span><span className="qw-opt-phone">Price</span></> : "Next"}</Go>}
        </nav>

      </section>
    </>
  );
}
