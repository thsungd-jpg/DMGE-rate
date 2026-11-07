import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chip, Desc, Go, Group, Row, useDescribe } from "../../world/controls";
import { describeCraft } from "./describe";
import { getCategoryIcon, IconPlus, IconSearch } from "../../icons";
import { buildIndex, POPULAR, recentCrafts, searchCrafts } from "../../utils/craftSearch";
import { addCraft, CUSTOM_FIELD, CUSTOM_WAYS, makeCraft } from "../../utils/customCrafts";
import { goalHourly } from "../../utils/rateModels";
import { onPhone, prettyCategory } from "./common";

// Step 1: what do you do? Search every craft, or start from a popular one, a recent one, or browse the fields. Always an inline way to add a craft that is not listed.
export default function CraftStation({ ctx }) {
  const { ALL_DATA, addCustomCraft, catData, category, handleResetModel, jobs, profile, removeCustomCraft, role, roleIdx, setCategory, setModelIdx, setRoleIdx } = ctx;
  const [query, setQuery] = useState("");
  const [browse, setBrowse] = useState(() => !onPhone());   // the field grid is long: collapsed on a phone
  const [adding, setAdding] = useState(null);              // null, or the name typed so far for a craft being added
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [dc, peek] = useDescribe();
  const inputRef = useRef(null), resultsRef = useRef(null), addBtn = useRef(null), wasAdding = useRef(false);

  const index = useMemo(() => buildIndex(ALL_DATA), [ALL_DATA]);
  const q = query.trim();
  const found = useMemo(() => searchCrafts(index, q, 10), [index, q]);
  const popular = useMemo(() => POPULAR.filter(([f, r]) => ALL_DATA[f]?.roles.some((x) => x.name === r)).map(([f, r]) => ({ field: f, role: r })), [ALL_DATA]);
  const recent = useMemo(() => recentCrafts(jobs, ALL_DATA, 4), [jobs, ALL_DATA]);
  const indexOf = (field, name) => ALL_DATA[field].roles.findIndex((x) => x.name === name);

  const pick = (field, i) => {
    if (field === category && i === roleIdx) return;
    setCategory(field); setRoleIdx(i); setModelIdx(0); setConfirmRemove(false);
    handleResetModel(ALL_DATA[field].roles[i].models[0]);
  };
  const isCurrent = (field, name) => field === category && role.name === name;

  // after the "not listed" note closes (added or cancelled) put focus back on the button that opened it
  useEffect(() => { if (wasAdding.current && adding === null) addBtn.current?.focus(); wasAdding.current = adding !== null; }, [adding]);

  const add = (craft) => {
    const at = addCraft(profile.customCrafts, craft).length - 1;   // a craft is appended, so it is the last of "My crafts"
    addCustomCraft(craft);
    setCategory(CUSTOM_FIELD); setRoleIdx(at); setModelIdx(0);
    handleResetModel(craft.models[0]);
    setAdding(null); setQuery("");
  };

  const onSearchKey = (e) => {
    if (e.key === "Enter" && found[0]) { e.preventDefault(); pick(found[0].field, found[0].index); }
    else if (e.key === "ArrowDown" && found.length) { e.preventDefault(); resultsRef.current?.querySelector("button")?.focus(); }
    else if (e.key === "Escape" && query) { e.preventDefault(); e.stopPropagation(); setQuery(""); }
  };
  const onResultsKey = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const items = [...resultsRef.current.querySelectorAll("button")], i = items.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const next = items[i + (e.key === "ArrowDown" ? 1 : -1)];
    if (next) next.focus(); else if (e.key === "ArrowUp") inputRef.current?.focus();
  };

  const chip = (c, tone) => <Chip key={c.field + c.role} tone={tone} on={isCurrent(c.field, c.role)} sub={prettyCategory(c.field)} onClick={() => pick(c.field, indexOf(c.field, c.role))} {...peek({ name: c.role, text: describeCraft(ALL_DATA[c.field].roles[indexOf(c.field, c.role)]) })}>{c.role}</Chip>;

  return (
    <>
      <div className="qw-in qw-group qw-group--search">
        <label className="qw-lab" htmlFor="qw-craft-search">Search every craft</label>
        <div className="qw-search">
          <IconSearch size={21} />
          <input
            id="qw-craft-search" ref={inputRef} className="qw-search-input" type="search" autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go"
            placeholder="podcast, tattoo, florist…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onSearchKey}
            aria-describedby="qw-craft-status"
          />
          {query && <button type="button" className="qw-search-x" aria-label="Clear search" onClick={() => { setQuery(""); inputRef.current?.focus(); }}>×</button>}
        </div>
        <p className="qw-sr" id="qw-craft-status" role="status" aria-live="polite">{q ? (found.length ? `${found.length} ${found.length === 1 ? "craft matches" : "crafts match"}` : "No crafts match") : ""}</p>
        <p className="qw-picked">
          <span>Quoting for</span> <b>{role.name}</b> <i>{prettyCategory(category)}</i>
        </p>
        <Desc d={dc} selected={{ name: role.name, text: describeCraft(role) }} tone="blue" />
      </div>

      {q ? (
        <div className="qw-in" ref={resultsRef} onKeyDown={onResultsKey}>
          {found.length ? (
            <Group label={`${found.length} ${found.length === 1 ? "craft matches" : "crafts match"}`}>
              <Row>{found.map((h) => chip(h, "blue"))}</Row>
            </Group>
          ) : (
            <div className="qw-group">
              <p className="qw-small">Nothing matches “{q}”. If it is your own thing, add it: you only do this once.</p>
              <button type="button" className="qw-paperbtn" onClick={() => setAdding(q)}><IconPlus size={16} /><span>Add “{q}” as my own craft</span></button>
            </div>
          )}
        </div>
      ) : (
        <>
          {recent.length > 0 && <div className="qw-in"><Group label="Recent"><Row>{recent.map((c) => chip(c, "mint"))}</Row></Group></div>}
          <div className="qw-in"><Group label="Popular"><Row>{popular.map((c) => chip(c, "butter"))}</Row></Group></div>
        </>
      )}

      <div className="qw-in qw-group">
        <button type="button" className="qw-paperbtn" aria-expanded={browse} aria-controls="qw-browse" onClick={() => setBrowse((b) => !b)}>
          <span>{browse ? "Hide the fields" : "Browse by field"}</span>
        </button>
        {browse && (
          <div id="qw-browse" className="qw-browse">
            <Group label="Field">
              <Row className="qw-row--cats">
                {Object.keys(ALL_DATA).map((c) => {
                  const Ico = getCategoryIcon(c);
                  return <Chip key={c} tone="lilac" on={c === category} icon={<Ico size={20} />} onClick={() => pick(c, 0)}>{prettyCategory(c)}</Chip>;
                })}
              </Row>
            </Group>
            <Group label="Role">
              <Row>{catData.roles.map((r, i) => <Chip key={r.name} tone="blue" on={i === roleIdx} onClick={() => pick(category, i)}>{r.name}</Chip>)}</Row>
            </Group>
            {category === CUSTOM_FIELD && (
              confirmRemove ? (
                <p className="qw-small">
                  Remove “{role.name}” from your crafts? Jobs you saved with it still open.{" "}
                  <button type="button" className="qw-link" onClick={() => { removeCustomCraft(role.name); setConfirmRemove(false); }}>Yes, remove it</button>{" · "}
                  <button type="button" className="qw-link" onClick={() => setConfirmRemove(false)}>Keep it</button>
                </p>
              ) : (
                <button type="button" className="qw-ghost" onClick={() => setConfirmRemove(true)}>Remove “{role.name}” from my crafts</button>
              )
            )}
          </div>
        )}
      </div>

      <div className="qw-in qw-group">
        {adding === null ? (
          <button type="button" ref={addBtn} className="qw-paperbtn" onClick={() => setAdding("")}><IconPlus size={16} /><span>My craft isn't listed</span></button>
        ) : (
          <CustomCraftNote draft={adding} profile={profile} onAdd={add} onCancel={() => setAdding(null)} />
        )}
      </div>
    </>
  );
}

/** The starting number for a way of charging: your own hourly rate where you have one, else a plain placeholder you can change. */
function startRate(way, profile) {
  const w = CUSTOM_WAYS.find((x) => x.id === way) || CUSTOM_WAYS[0], h = goalHourly(profile);
  return h && (way === "hour" || way === "day") ? Math.round(h * (way === "day" ? 8 : 1)) : w.rate;
}

/** A small paper note for adding a craft of your own: a name, how you charge, your usual rate. */
function CustomCraftNote({ draft, profile, onAdd, onCancel }) {
  const [name, setName] = useState(draft);
  const [way, setWay] = useState("hour");
  const [rate, setRate] = useState(() => String(startRate("hour", profile)));
  const [typed, setTyped] = useState(false);   // true once you have typed a rate yourself: changing the way then leaves it alone
  const [err, setErr] = useState("");
  const nameRef = useRef(null);
  const w = CUSTOM_WAYS.find((x) => x.id === way);

  const choose = (id) => { setWay(id); if (!typed) setRate(String(startRate(id, profile))); setErr(""); };
  const submit = (e) => {
    e.preventDefault();
    const clean = name.replace(/\s+/g, " ").trim(), r = Number(rate);
    if (clean.length < 2) { setErr("Give your craft a name."); nameRef.current?.focus(); return; }
    if (!(r > 0)) { setErr("Enter your usual rate as a number above zero."); return; }
    if (way === "percent" && r > 100) { setErr("A share cannot be more than 100%."); return; }
    onAdd(makeCraft({ name: clean, way, rate: r }));
  };

  return (
    <form className="qw-paper" aria-label="Add a craft of your own" onSubmit={submit} onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); onCancel(); } }}>
      <label className="qw-paper-lab" htmlFor="qw-cc-name">What do you call your craft?</label>
      <input id="qw-cc-name" ref={nameRef} className="qw-field" autoFocus maxLength={60} placeholder="e.g. Cake topper maker" value={name} onChange={(e) => { setName(e.target.value); setErr(""); }} />

      <span className="qw-paper-lab" id="qw-cc-way">How do you usually charge?</span>
      <div className="qw-paper-row" role="group" aria-labelledby="qw-cc-way">
        {CUSTOM_WAYS.map((x) => <Chip key={x.id} className="qw-mini" tone="mint" on={x.id === way} onClick={() => choose(x.id)}>{x.label}</Chip>)}
      </div>
      <span className="qw-paper-small">{w.hint}.</span>

      <label className="qw-paper-lab" htmlFor="qw-cc-rate">{way === "percent" ? "Your usual share (%)" : `Your usual rate ($ ${w.unit})`}</label>
      <input id="qw-cc-rate" className="qw-field" type="number" inputMode="decimal" min={0} step="any" value={rate} onChange={(e) => { setRate(e.target.value); setTyped(true); setErr(""); }} />
      <span className="qw-paper-small">A starting point only. You can change the rate on the Rate step, and your craft is saved with your profile for next time.</span>

      {err && <span className="qw-paper-err" role="alert">{err}</span>}
      <div className="qw-paper-row" style={{ marginTop: 16 }}>
        <Go tone="mint" className="qw-go--sm" type="submit">Add my craft</Go>
        <button type="button" className="qw-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
