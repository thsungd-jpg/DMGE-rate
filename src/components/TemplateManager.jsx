import React, { useEffect, useMemo, useState } from 'react';
import { Card, EmptyState, Grid, Screen } from './kit';
import { PBtn, PInput, PSelect } from './ui';
import { IconArrowLeft, IconCalc, IconCheck, IconCross, IconSearch, IconTemplates } from '../icons';
import TemplateCard from '../screens/templates/TemplateCard';
import TemplateEditor from '../screens/templates/TemplateEditor';
import { scrollToTop } from '../screens/templates/format';
import '../screens/templates/templates.css';

export default function TemplateManager({ templates, onUseTemplate, onDeleteTemplate, onBack, onSaveTemplate }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("all");
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState(null);

  const categories = useMemo(() => ["all", ...new Set(templates.map(t => t.category))], [templates]);
  // A filter can outlive its category (e.g. after deleting the last template in it): fall back to "all".
  const activeCat = categories.includes(filterCat) ? filterCat : "all";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates
      .filter(t => {
        if (activeCat !== "all" && t.category !== activeCat) return false;
        if (q && !(t.name || "").toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0));
  }, [templates, search, activeCat]);

  useEffect(() => {
    if (!notice) return undefined;
    const id = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(id);
  }, [notice]);

  useEffect(() => { scrollToTop(); }, [editing]);

  const handleDuplicate = async (t) => {
    const newTpl = {
      ...t,
      id: "tpl-" + Date.now(),
      name: `${t.name} (Copy)`,
      createdAt: new Date().toISOString(),
      usageCount: 0
    };
    await (onSaveTemplate && onSaveTemplate(newTpl));
    setNotice(`Duplicated “${t.name}”.`);
  };

  const handleSaveEdit = async (updated) => {
    await (onSaveTemplate && onSaveTemplate(updated));
    setEditing(null);
    setNotice(`Saved “${updated.name}”.`);
  };

  const clearFilters = () => { setSearch(""); setFilterCat("all"); };

  if (editing) {
    return (
      <Screen
        key="edit"
        className="tpl-view"
        eyebrow="Template"
        title={<>Edit <em>template</em></>}
        subtitle={`${editing.role} · ${editing.model}`}
        actions={
          <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => setEditing(null)}>
            <IconArrowLeft size={18} /> All templates
          </PBtn>
        }
      >
        <TemplateEditor template={editing} onSave={handleSaveEdit} onCancel={() => setEditing(null)} />
      </Screen>
    );
  }

  return (
    <Screen
      key="list"
      className="tpl-view"
      eyebrow="Saved setups"
      title={<>Your <em>templates</em></>}
      subtitle="Reusable quote setups. Load one into the calculator and adjust from there."
      actions={templates.length > 0 ? (
        <PBtn color="var(--butter)" onClick={onBack}>
          <IconCalc size={18} /> Create in calculator
        </PBtn>
      ) : undefined}
    >
      {notice && (
        <Card tone="mint" pad="sm" className="tpl-notice" role="status">
          <IconCheck size={18} />
          <span>{notice}</span>
          <button type="button" className="tpl-notice-x" aria-label="Dismiss message" onClick={() => setNotice(null)}><IconCross size={16} /></button>
        </Card>
      )}

      {templates.length === 0 ? (
        <Card tone="glass">
          <EmptyState
            icon={<IconTemplates size={28} />}
            title="No templates yet"
            body="Set up a quote in the calculator, then choose Save as template. It will live here, ready to reuse in one tap."
            action={<PBtn color="var(--butter)" onClick={onBack}><IconCalc size={18} /> Open the calculator</PBtn>}
          />
        </Card>
      ) : (
        <>
          <div className="tpl-toolbar">
            <div className="tpl-search">
              <span className="tpl-search-icon" aria-hidden="true"><IconSearch size={18} /></span>
              <PInput type="search" value={search} onChange={setSearch} placeholder="Search templates by name" aria-label="Search templates" autoComplete="off" />
            </div>
            {categories.length > 2 && (
              <div className="tpl-filter" role="group" aria-label="Filter by category">
                <PSelect
                  value={activeCat}
                  onChange={setFilterCat}
                  options={categories.map(c => ({ label: c === "all" ? "All categories" : c, value: c }))}
                  iconType="none"
                  style={{ marginBottom: 0 }}
                />
              </div>
            )}
          </div>
          <p className="tpl-count" aria-live="polite">
            {filtered.length === templates.length
              ? `${templates.length} ${templates.length === 1 ? "template" : "templates"}`
              : `Showing ${filtered.length} of ${templates.length}`}
          </p>

          {filtered.length === 0 ? (
            <Card tone="glass">
              <EmptyState
                icon={<IconSearch size={28} />}
                title="No templates match"
                body="Try a different name or category."
                action={<PBtn color="var(--paper)" className="lq-btn--neutral" onClick={clearFilters}>Clear filters</PBtn>}
              />
            </Card>
          ) : (
            <Grid min={300} gap={16}>
              {filtered.map((t, i) => (
                <TemplateCard
                  key={t.id}
                  t={t}
                  index={i}
                  onUse={onUseTemplate}
                  onDuplicate={handleDuplicate}
                  onEdit={setEditing}
                  onDelete={onDeleteTemplate}
                />
              ))}
            </Grid>
          )}
        </>
      )}
    </Screen>
  );
}
