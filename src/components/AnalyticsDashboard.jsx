import React, { useState, useMemo } from "react";
import { Card, SectionTitle, Stat, Pill, Field, Segmented, EmptyState } from "./kit";
import { PBtn } from "./ui";
import { IconInsights, IconPlus } from "../icons";
import { CategoryChart, RevenueChart, money } from "../screens/insights/charts";
import { useChartTheme } from "../screens/insights/chartTheme";
import "../screens/insights.css";

const DAY = 86400000;

const DATE_RANGES = [
  { label: "All time", value: "all" },
  { label: "Last month", value: "month" },
  { label: "Last quarter", value: "quarter" },
  { label: "Last year", value: "year" },
];

const isPaid = (job) => job.invoiceStatus === "paid" || !!job.paidAt;

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

/** Whole percent, but never a flat 0% or 100% while a sliver of the other side exists. */
function pctLabel(share) {
  if (share > 0 && share < 0.01) return "<1%";
  if (share < 1 && share > 0.99) return ">99%";
  return Math.round(share * 100) + "%";
}

function weekStart(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  return d;
}

/** Revenue per period with empty periods filled in, so a quiet week shows as zero instead of vanishing.
 *  Short histories (every plan's window is ~30 days) bucket by week, longer ones by month. */
function buildRevenueSeries(list) {
  const dated = list.map((job) => ({ price: Number(job.price) || 0, at: new Date(job.date) })).filter((j) => Number.isFinite(j.at.getTime()));
  if (!dated.length) return { unit: "week", points: [] };

  const times = dated.map((j) => j.at.getTime());
  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  const unit = (last - first) / DAY <= 70 ? "week" : "month";
  const points = [];

  if (unit === "week") {
    const cur = weekStart(first);
    const end = weekStart(last).getTime();
    while (cur.getTime() <= end) {
      points.push({ start: new Date(cur), total: 0, count: 0 });
      cur.setDate(cur.getDate() + 7);
    }
    const base = points[0].start.getTime();
    dated.forEach((j) => {
      const p = points[Math.round((weekStart(j.at).getTime() - base) / (7 * DAY))];
      if (p) { p.total += j.price; p.count += 1; }
    });
    points.forEach((p) => {
      p.label = p.start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      p.title = "Week of " + p.start.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    });
  } else {
    const cur = new Date(first.getFullYear(), first.getMonth(), 1);
    const end = new Date(last.getFullYear(), last.getMonth(), 1).getTime();
    while (cur.getTime() <= end) {
      points.push({ start: new Date(cur), total: 0, count: 0 });
      cur.setMonth(cur.getMonth() + 1);
    }
    dated.forEach((j) => {
      const p = points.find((x) => x.start.getFullYear() === j.at.getFullYear() && x.start.getMonth() === j.at.getMonth());
      if (p) { p.total += j.price; p.count += 1; }
    });
    points.forEach((p) => {
      p.label = p.start.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      p.title = p.start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    });
  }
  return { unit, points };
}

function DataTable({ caption, head, rows }) {
  return (
    <details className="ins-details">
      <summary>View as a table</summary>
      <table>
        <caption>{caption}</caption>
        <thead><tr>{head.map((h, i) => <th key={h} scope="col" className={i ? "num" : undefined}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr key={r[0]}>{r.map((c, i) => (i ? <td key={i} className="num">{c}</td> : <th key={i} scope="row">{c}</th>))}</tr>)}</tbody>
      </table>
    </details>
  );
}

export default function AnalyticsDashboard({ jobs, windowDays, onNewQuote }) {
  const [dateRange, setDateRange] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const chartTheme = useChartTheme();

  // Get all unique categories from full jobs array (for dropdown)
  const allCategories = useMemo(() => {
    const categories = new Set();
    jobs.forEach((job) => {
      if (job.category) categories.add(job.category);
    });
    return Array.from(categories).sort();
  }, [jobs]);

  // Filter jobs based on selected range and category
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Date filtering
    const now = new Date();
    if (dateRange === "month") {
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      filtered = filtered.filter((job) => new Date(job.date) >= monthAgo);
    } else if (dateRange === "quarter") {
      const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      filtered = filtered.filter((job) => new Date(job.date) >= quarterAgo);
    } else if (dateRange === "year") {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filtered = filtered.filter((job) => new Date(job.date) >= yearAgo);
    }

    // Category filtering
    if (categoryFilter !== "all") {
      filtered = filtered.filter((job) => job.category === categoryFilter);
    }

    return filtered;
  }, [jobs, dateRange, categoryFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const price = (job) => Number(job.price) || 0;
    const totalRevenue = filteredJobs.reduce((sum, job) => sum + price(job), 0);
    const jobCount = filteredJobs.length;
    const avgJobPrice = jobCount > 0 ? totalRevenue / jobCount : 0;

    const paidJobs = filteredJobs.filter(isPaid);
    const paidTotal = paidJobs.reduce((sum, job) => sum + price(job), 0);
    const paidShare = totalRevenue > 0 ? paidTotal / totalRevenue : 0;

    // Jobs by category, biggest first
    const jobsByCategory = {};
    filteredJobs.forEach((job) => {
      const name = job.category || "Uncategorised";
      jobsByCategory[name] = (jobsByCategory[name] || 0) + 1;
    });
    const categoryRows = Object.entries(jobsByCategory)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

    return {
      totalRevenue, avgJobPrice, jobCount,
      paidTotal, paidCount: paidJobs.length, paidShare,
      outstandingTotal: totalRevenue - paidTotal, outstandingCount: jobCount - paidJobs.length,
      categoryRows,
      revenue: buildRevenueSeries(filteredJobs),
    };
  }, [filteredJobs]);

  const filtersActive = dateRange !== "all" || categoryFilter !== "all";
  const clearFilters = () => { setDateRange("all"); setCategoryFilter("all"); };

  if (jobs.length === 0) {
    return (
      <Card pad="lg">
        <EmptyState
          icon={<IconInsights size={28} />}
          title="No jobs to chart yet"
          body="Save a quote from the calculator and your totals, trends and payment status will show up here."
          action={<PBtn color="var(--butter)" onClick={onNewQuote} style={{ marginTop: 8 }}><IconPlus size={18} /> Create a quote</PBtn>}
        />
      </Card>
    );
  }

  const { revenue, categoryRows } = metrics;
  const revenueUnit = revenue.unit === "week" ? "week" : "month";
  const revenueAria = `Revenue per ${revenueUnit}. ` + revenue.points.map((p) => `${p.title}: ${money(p.total)}`).join(". ");
  const categoryAria = "Jobs per category. " + categoryRows.map((r) => `${r.label}: ${plural(r.count, "job", "jobs")}`).join(". ");

  return (
    <div className="ins">
      {/* FILTER BAR */}
      <Card tone="glass" pad="sm" className="ins-filters">
        <div className="ins-filter">
          <span className="kit-field-label">Date range</span>
          <Segmented ariaLabel="Date range" options={DATE_RANGES} value={dateRange} onChange={setDateRange} />
        </div>
        <div className="ins-filter ins-filter--select">
          <Field label="Category" htmlFor="ins-category">
            <div className="ins-select">
              <select id="ins-category" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All categories</option>
                {allCategories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M3.5 6l4.5 4.5L12.5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </Field>
        </div>
      </Card>

      {filteredJobs.length === 0 ? (
        <Card pad="lg" className="ins-gap">
          <EmptyState
            icon={<IconInsights size={28} />}
            title="Nothing matches these filters"
            body="Try a wider date range or another category to see your numbers."
            action={filtersActive && <PBtn color="var(--butter)" onClick={clearFilters} style={{ marginTop: 8 }}>Clear filters</PBtn>}
          />
        </Card>
      ) : (
        <>
          <SectionTitle>At a glance</SectionTitle>
          <div className="ins-stats">
            <Card><Stat label="Total billed" value={money(metrics.totalRevenue)} hint={`Across ${plural(metrics.jobCount, "job", "jobs")}`} /></Card>
            <Card><Stat tone="blue" label="Average job" value={money(metrics.avgJobPrice)} hint="Per job" /></Card>
            <Card><Stat tone="lilac" label="Jobs" value={metrics.jobCount} hint={`In ${plural(categoryRows.length, "category", "categories")}`} /></Card>
          </div>

          <Card className="ins-pay ins-gap" as="section" aria-labelledby="ins-pay-title">
            <div className="ins-card-head">
              <div>
                <h3 id="ins-pay-title">Paid vs outstanding</h3>
                <p>What has landed in your account and what is still waiting.</p>
              </div>
              <Pill tone="mint">{pctLabel(metrics.paidShare)} collected</Pill>
            </div>
            <div className="ins-pay-figures">
              <Stat tone="mint" label="Paid" value={money(metrics.paidTotal)} hint={plural(metrics.paidCount, "paid job", "paid jobs")} />
              <div className="ins-out"><Stat label="Outstanding" value={money(metrics.outstandingTotal)} hint={plural(metrics.outstandingCount, "job", "jobs") + " waiting"} /></div>
            </div>
            <div
              className="ins-split"
              role="img"
              aria-label={`Paid ${money(metrics.paidTotal)} (${pctLabel(metrics.paidShare)}), outstanding ${money(metrics.outstandingTotal)} (${pctLabel(1 - metrics.paidShare)})`}
            >
              {metrics.paidTotal > 0 && <i className="ins-split-paid" style={{ flexGrow: metrics.paidShare }} />}
              {metrics.outstandingTotal > 0 && <i className="ins-split-out" style={{ flexGrow: 1 - metrics.paidShare }} />}
            </div>
            <ul className="ins-legend">
              <li><span className="ins-dot ins-dot--paid" aria-hidden="true" />Paid, {pctLabel(metrics.paidShare)}</li>
              <li><span className="ins-dot ins-dot--out" aria-hidden="true" />Outstanding, {pctLabel(1 - metrics.paidShare)}</li>
            </ul>
          </Card>

          <SectionTitle>Trends</SectionTitle>
          <div className="ins-charts">
            <Card as="section" aria-labelledby="ins-rev-title" className="ins-chart">
              <div className="ins-card-head">
                <div>
                  <h3 id="ins-rev-title">Revenue over time</h3>
                  <p>Billed per {revenueUnit}</p>
                </div>
              </div>
              <div className="ins-canvas">
                <RevenueChart points={revenue.points} t={chartTheme} ariaLabel={revenueAria} />
              </div>
              <DataTable
                caption={`Revenue per ${revenueUnit}`}
                head={[revenue.unit === "week" ? "Week of" : "Month", "Billed", "Jobs"]}
                rows={revenue.points.map((p) => [p.label, money(p.total), p.count])}
              />
            </Card>

            <Card as="section" aria-labelledby="ins-cat-title" className="ins-chart">
              <div className="ins-card-head">
                <div>
                  <h3 id="ins-cat-title">Category mix</h3>
                  <p>Jobs per category</p>
                </div>
              </div>
              <div className="ins-canvas" style={{ height: Math.max(180, categoryRows.length * 46 + 36) }}>
                <CategoryChart rows={categoryRows} t={chartTheme} ariaLabel={categoryAria} />
              </div>
              <DataTable
                caption="Jobs per category"
                head={["Category", "Jobs"]}
                rows={categoryRows.map((r) => [r.label, r.count])}
              />
            </Card>
          </div>
        </>
      )}
      {windowDays != null && windowDays !== Infinity && (
        <p className="ins-note">Your plan keeps the last {windowDays} days of jobs in Insights.</p>
      )}
    </div>
  );
}
