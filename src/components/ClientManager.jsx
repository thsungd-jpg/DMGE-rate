import React, { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';
import { Card, EmptyState, Grid, Pill, Screen } from './kit';
import { PBtn, PInput } from './ui';
import { IconArrowLeft, IconCheck, IconClients, IconCross, IconDownload, IconPlus, IconSearch, IconUpload } from '../icons';
import { exportClientsToCSV } from '../utils/csvExport';
import { canAddClient, canAddClientsBatch, getUsageStats } from '../utils/subscription';
import ClientCard from '../screens/clients/ClientCard';
import ClientDetail from '../screens/clients/ClientDetail';
import ClientForm from '../screens/clients/ClientForm';
import { scrollToTop } from '../screens/clients/format';
import '../screens/clients/clients.css';

export default function ClientManager({ clients, jobs, tier, onClientLimitReached, onUseClient, onSaveClient, onDeleteClient, onImportClients, onBack }) {
  const [search, setSearch] = useState("");
  const [viewingClient, setViewingClient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [notice, setNotice] = useState(null);
  const fileRef = useRef(null);

  // Quote count + total billed per client, computed once per jobs change.
  const jobsByClient = useMemo(() => {
    const m = new Map();
    for (const j of jobs || []) {
      if (j.clientId == null) continue;
      const s = m.get(j.clientId) || { count: 0, total: 0, list: [] };
      s.count += 1;
      s.total += Number(j.price) || 0;
      s.list.push(j);
      m.set(j.clientId, s);
    }
    return m;
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter(c => !q || (c.name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q))
      .sort((a, b) => (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" }));
  }, [clients, search]);

  const usage = getUsageStats(tier, clients.length).clients;

  useEffect(() => {
    if (!notice || notice.tone === "error") return undefined;
    const id = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(id);
  }, [notice]);

  useEffect(() => { scrollToTop(); }, [viewingClient, isEditing]);

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parsed = results.data.map(row => ({
          name: row.Name || row.name,
          email: row.Email || row.email || "",
          phone: row.Phone || row.phone || "",
          rateMultiplier: parseFloat(row.RateMultiplier || row.rateMultiplier) || 1,
          preferredComplexity: row.PreferredComplexity || row.preferredComplexity || "Standard",
          preferredUsageRights: row.PreferredUsageRights || row.preferredUsageRights || "Personal",
          preferredClientType: row.PreferredClientType || row.preferredClientType || "Individual",
          notes: row.Notes || row.notes || ""
        })).filter(c => c.name);
        if (!onImportClients) return;
        if (!parsed.length) {
          setNotice({ tone: "error", text: "We couldn't find any clients in that file. Check that it has a Name column." });
          return;
        }
        if (!canAddClientsBatch(tier, clients.length, parsed.length)) {
          const room = typeof usage.max === "number" ? Math.max(0, usage.max - clients.length) : 0;
          setNotice({ tone: "error", text: `That file has ${parsed.length} ${parsed.length === 1 ? "client" : "clients"}, but your plan has room for ${room} more.` });
          onClientLimitReached?.();
          return;
        }
        try {
          await onImportClients(parsed);
          setNotice({ tone: "success", text: `Imported ${parsed.length} ${parsed.length === 1 ? "client" : "clients"}.` });
        } catch (err) {
          setNotice({ tone: "error", text: "Something went wrong while importing. Please try again." });
        }
      },
      error: () => setNotice({ tone: "error", text: "We couldn't read that file. Make sure it's a CSV." }),
    });
    // Reset file input
    e.target.value = null;
  };

  const handleEditNew = () => {
    if (!canAddClient(tier, clients.length)) {
      onClientLimitReached?.();
      return;
    }
    setForm({
      id: "cli-" + Date.now(),
      name: "",
      email: "",
      phone: "",
      preferredComplexity: "Standard",
      preferredUsageRights: "Personal",
      preferredClientType: "Individual",
      rateMultiplier: 1.0,
      notes: ""
    });
    setIsEditing(true);
    setViewingClient(null);
  };

  const handleEditExisting = (c) => {
    setForm({ ...c });
    setIsEditing(true);
  };

  const handleSave = (data) => {
    if (!data.name) return;
    const isNew = !clients.some(c => c.id === data.id);
    if (isNew && !canAddClient(tier, clients.length)) {
      onClientLimitReached?.();
      return;
    }
    onSaveClient(data);
    setIsEditing(false);
    setViewingClient(data);
  };

  const handleDeleteFromDetail = (c) => {
    onDeleteClient(c.id);
    setViewingClient(null);
  };

  if (isEditing && form) {
    const isNew = !clients.some(c => c.id === form.id);
    return (
      <Screen
        key="form"
        className="cli-view"
        eyebrow={isNew ? "New client" : "Edit client"}
        title={isNew ? <>Add a <em>client</em></> : <>Edit <em>client</em></>}
        subtitle={isNew ? "Save their details once, then quote them in a tap." : undefined}
        actions={
          <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => setIsEditing(false)}>
            <IconArrowLeft size={18} /> {viewingClient ? "Back to client" : "All clients"}
          </PBtn>
        }
      >
        <ClientForm initial={form} onSave={handleSave} onCancel={() => setIsEditing(false)} />
      </Screen>
    );
  }

  if (viewingClient) {
    const clientJobs = jobsByClient.get(viewingClient.id)?.list || [];
    return (
      <ClientDetail
        client={viewingClient}
        jobs={clientJobs}
        onBack={() => setViewingClient(null)}
        onEdit={handleEditExisting}
        onUse={onUseClient}
        onDelete={handleDeleteFromDetail}
      />
    );
  }

  const atLimit = usage.atLimit;
  return (
    <Screen
      key="list"
      className="cli-view cli-list"
      eyebrow="Your people"
      title={<>Your <em>clients</em></>}
      subtitle="Contact details, rate multipliers and quote history for everyone you work with."
      actions={
        <>
          <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => exportClientsToCSV(clients)}>
            <IconDownload size={18} /> Export
          </PBtn>
          <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => fileRef.current?.click()}>
            <IconUpload size={18} /> Import
          </PBtn>
          <input ref={fileRef} type="file" accept=".csv" hidden aria-label="Import clients from a CSV file" onChange={handleImport} />
          <PBtn className="cli-new" color="var(--butter)" onClick={handleEditNew}>
            <IconPlus size={18} /> New client
          </PBtn>
        </>
      }
    >
      {notice && (
        <Card tone={notice.tone === "error" ? "pink" : "mint"} pad="sm" className="cli-notice" role={notice.tone === "error" ? "alert" : "status"}>
          {notice.tone === "error" ? null : <IconCheck size={18} />}
          <span>{notice.text}</span>
          <button type="button" className="cli-notice-x" aria-label="Dismiss message" onClick={() => setNotice(null)}><IconCross size={16} /></button>
        </Card>
      )}

      {atLimit && (
        <Card tone="butter" pad="sm" className="cli-limit">
          <span>
            You've used all {usage.max} client spots on your plan. Upgrade to add more.
          </span>
          <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => onClientLimitReached?.()}>See plans</PBtn>
        </Card>
      )}

      {clients.length === 0 ? (
        <Card tone="glass">
          <EmptyState
            icon={<IconClients size={28} />}
            title="No clients yet"
            body="Add your first client to keep their details, rate multiplier and quote history in one place. Already have a list? Import it from a CSV."
            action={
              <div className="cli-empty-actions">
                <PBtn color="var(--butter)" onClick={handleEditNew}><IconPlus size={18} /> Add a client</PBtn>
                <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => fileRef.current?.click()}><IconUpload size={18} /> Import CSV</PBtn>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <div className="cli-toolbar">
            <div className="cli-search">
              <span className="cli-search-icon" aria-hidden="true"><IconSearch size={18} /></span>
              <PInput type="search" value={search} onChange={setSearch} placeholder="Search by name or email" aria-label="Search clients" autoComplete="off" />
            </div>
            <Pill tone={atLimit ? "pink" : "ink"}>
              {usage.max === '∞' ? `${usage.used} clients` : `${usage.used} of ${usage.max} clients`}
            </Pill>
          </div>
          <p className="cli-count" aria-live="polite">
            {filtered.length === clients.length
              ? `${clients.length} ${clients.length === 1 ? "client" : "clients"}`
              : `Showing ${filtered.length} of ${clients.length}`}
          </p>

          {filtered.length === 0 ? (
            <Card tone="glass">
              <EmptyState
                icon={<IconSearch size={28} />}
                title="No clients match"
                body={`Nothing matches “${search.trim()}”. Try a name or an email address.`}
                action={<PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => setSearch("")}>Clear search</PBtn>}
              />
            </Card>
          ) : (
            <Grid min={420} gap={16}>
              {filtered.map((c, i) => {
                const s = jobsByClient.get(c.id);
                return (
                  <ClientCard
                    key={c.id}
                    client={c}
                    count={s?.count || 0}
                    total={s?.total || 0}
                    index={i}
                    onOpen={setViewingClient}
                    onDelete={onDeleteClient}
                  />
                );
              })}
            </Grid>
          )}
        </>
      )}
    </Screen>
  );
}
