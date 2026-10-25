import React, { useMemo, useState } from "react";
import { Card, EmptyState, Pill, Row, Screen, SectionTitle, Stat } from "../../components/kit";
import { PBtn } from "../../components/ui";
import { IconArrowLeft, IconCalc, IconDelete, IconEdit, IconJobs } from "../../icons";
import { fmtDate, money, multiplierHint, multiplierLabel, multiplierTone, statusPill } from "./format";

const RECENT = 5;

/** Detail view for one client: stats, quote history, contact, quote defaults and notes. */
export default function ClientDetail({ client, jobs, onBack, onEdit, onUse, onDelete }) {
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(
    () => [...jobs].sort((a, b) => (new Date(b.date).getTime() || 0) - (new Date(a.date).getTime() || 0)),
    [jobs]
  );
  const total = sorted.reduce((acc, j) => acc + (Number(j.price) || 0), 0);
  const visible = showAll ? sorted : sorted.slice(0, RECENT);

  const name = (client.name || "Client").trim();
  const words = name.split(/\s+/);
  const title = words.length > 1 ? <>{words.slice(0, -1).join(" ")} <em>{words[words.length - 1]}</em></> : <em>{name}</em>;

  return (
    <Screen
      key="detail"
      className="cli-view"
      eyebrow="Client"
      title={title}
      actions={
        <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={onBack}>
          <IconArrowLeft size={18} /> All clients
        </PBtn>
      }
    >
      <Card tone="glass" pad="lg" className="cli-stats">
        <Stat label="Total billed" value={money(total)} tone="mint" hint={sorted.length ? "Across all quotes" : "Nothing quoted yet"} />
        <Stat label="Quotes" value={sorted.length} hint={sorted.length === 1 ? "1 quote saved" : `${sorted.length} quotes saved`} />
        <Stat label="Rate multiplier" value={multiplierLabel(client.rateMultiplier)} tone="pink" hint={multiplierHint(client.rateMultiplier)} />
      </Card>

      <div className="cli-cta">
        <PBtn color="var(--butter)" onClick={() => onUse(client)}><IconCalc size={18} /> Use for a new quote</PBtn>
        <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => onEdit(client)}><IconEdit size={18} /> Edit</PBtn>
        <PBtn color="var(--paper)" className="lq-btn--neutral cli-btn-danger" onClick={() => onDelete(client)}><IconDelete size={18} /> Delete</PBtn>
      </div>

      <div className="cli-detail-grid">
        <section aria-labelledby="cli-quotes-h">
          <SectionTitle aside={sorted.length > 0 && <span className="cli-aside">{sorted.length} total</span>}>
            <span id="cli-quotes-h">Recent quotes</span>
          </SectionTitle>
          {sorted.length === 0 ? (
            <Card>
              <EmptyState
                icon={<IconJobs size={28} />}
                title="No quotes yet"
                body="Quotes you build for this client will show up here with their status and price."
              />
            </Card>
          ) : (
            <>
              <ul className="cli-jobs">
                {visible.map((j, i) => {
                  const [tone, label] = statusPill(j.status);
                  return (
                    <li key={j.id || i}>
                      <Row
                        leading={<IconJobs size={20} />}
                        title={j.role || "Quote"}
                        meta={[j.model, fmtDate(j.date)].filter(Boolean).join(" · ")}
                        aside={money(j.price)}
                      >
                        <span className="cli-job-status"><Pill tone={tone} dot>{label}</Pill></span>
                      </Row>
                    </li>
                  );
                })}
              </ul>
              {sorted.length > RECENT && (
                <div className="cli-more">
                  <PBtn color="var(--paper)" className="lq-btn--neutral" onClick={() => setShowAll((s) => !s)} aria-expanded={showAll}>
                    {showAll ? "Show fewer" : `Show all ${sorted.length} quotes`}
                  </PBtn>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="cli-side">
          <Card>
            <h2 className="cli-card-h">Contact</h2>
            <dl className="cli-dl">
              <dt>Email</dt>
              <dd>{client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : <span className="cli-muted">Not added</span>}</dd>
              <dt>Phone</dt>
              <dd>{client.phone ? <a href={`tel:${client.phone}`}>{client.phone}</a> : <span className="cli-muted">Not added</span>}</dd>
            </dl>
          </Card>

          <Card>
            <h2 className="cli-card-h">Quote defaults</h2>
            <ul className="cli-prefs" aria-label="Quote defaults">
              <li><Pill tone="blue">{client.preferredComplexity || "Standard"}</Pill></li>
              <li><Pill tone="lilac">{client.preferredUsageRights || "Personal"}</Pill></li>
              <li><Pill tone="mint">{client.preferredClientType || "Individual"}</Pill></li>
              <li><Pill tone={multiplierTone(client.rateMultiplier)}>{multiplierLabel(client.rateMultiplier)} rate</Pill></li>
            </ul>
          </Card>

          <Card>
            <h2 className="cli-card-h">Notes</h2>
            {client.notes ? <p className="cli-notes">{client.notes}</p> : <p className="cli-muted">No notes yet. Use Edit to add some.</p>}
          </Card>
        </aside>
      </div>
    </Screen>
  );
}
