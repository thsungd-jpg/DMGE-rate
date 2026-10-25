import React, { useEffect, useMemo, useRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip } from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { withAlpha } from "./chartTheme";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip);

export const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-US");
const compactMoney = (n) => (Math.abs(n) >= 1000 ? "$" + Math.round(n / 100) / 10 + "k" : "$" + Math.round(n));

/** Canvas text uses whatever font is ready at draw time, so redraw once DM Sans has actually loaded. */
function useRedrawWhenFontsLoad() {
  const ref = useRef(null);
  useEffect(() => {
    let live = true;
    const fonts = document.fonts;
    if (!fonts?.load) return undefined;
    Promise.all([fonts.load('500 12px "DM Sans"'), fonts.load('700 15px "DM Sans"')])
      .then(() => { if (live) ref.current?.update("none"); })
      .catch(() => {});
    return () => { live = false; };
  }, []);
  return ref;
}

/** Options shared by both charts: ink ticks, hairline grid, soft paper tooltip, DM Sans everywhere. */
const tickFont = (t) => ({ family: t.fontBody, size: 12, weight: 500 });

function baseOptions(t, { tooltipTitle, tooltipLines }) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    animation: t.reducedMotion ? false : { duration: 450, easing: "easeOutQuart" },
    layout: { padding: { top: 6, right: 8 } },
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: t.paper,
        titleColor: t.ink2,
        bodyColor: t.ink,
        borderColor: t.lineStrong,
        borderWidth: 1,
        cornerRadius: 14,
        padding: 12,
        caretSize: 6,
        displayColors: false,
        titleFont: { family: t.fontBody, size: 12, weight: 600 },
        bodyFont: { family: t.fontBody, size: 15, weight: 700 },
        footerFont: { family: t.fontBody, size: 12, weight: 500 },
        footerColor: t.ink2,
        callbacks: { title: tooltipTitle, label: (c) => tooltipLines(c)[0], footer: (items) => tooltipLines(items[0]).slice(1) },
      },
    },
  };
}

/** Revenue over time. Three or more periods draw as a soft area line; one or two periods read better as columns. */
export function RevenueChart({ points, t, ariaLabel }) {
  const ref = useRedrawWhenFontsLoad();
  const asBars = points.length < 3;

  const data = useMemo(() => ({
    labels: points.map((p) => p.label),
    datasets: [asBars
      ? {
        label: "Revenue", data: points.map((p) => p.total),
        backgroundColor: t.pink, borderColor: t.pinkDeep, borderWidth: 1.5,
        borderRadius: 10, borderSkipped: false, maxBarThickness: 64,
      }
      : {
        label: "Revenue", data: points.map((p) => p.total), fill: true, tension: 0.38,
        borderColor: t.pinkDeep, borderWidth: 2,
        backgroundColor: (c) => {
          const { ctx, chartArea } = c.chart;
          if (!chartArea) return withAlpha(t.pink, 0.3);
          const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, withAlpha(t.pink, 0.6));
          g.addColorStop(1, withAlpha(t.pink, 0.02));
          return g;
        },
        pointRadius: 5, pointHoverRadius: 7, pointBorderWidth: 2, pointHoverBorderWidth: 2,
        pointBackgroundColor: t.paper, pointBorderColor: t.pinkDeep,
      }],
  }), [points, t, asBars]);

  const options = useMemo(() => {
    const font = tickFont(t);
    return {
      ...baseOptions(t, {
        tooltipTitle: ([i]) => points[i.dataIndex]?.title,
        tooltipLines: (c) => {
          const p = points[c.dataIndex];
          return [money(p?.total), `${p?.count} ${p?.count === 1 ? "job" : "jobs"}`];
        },
      }),
      scales: {
        x: { grid: { display: false }, border: { display: false }, ticks: { color: t.ink2, font, maxRotation: 0, autoSkipPadding: 14, padding: 8 } },
        y: {
          beginAtZero: true, grace: "10%",
          grid: { color: t.line, drawTicks: false }, border: { display: false },
          ticks: { color: t.ink2, font, padding: 10, maxTicksLimit: 5, callback: (v) => compactMoney(v) },
        },
      },
    };
  }, [t, points]);

  const Chart = asBars ? Bar : Line;
  return <Chart ref={ref} key={asBars ? "bar" : "line"} data={data} options={options} role="img" aria-label={ariaLabel} />;
}

/** Jobs per category: horizontal rounded bars, one hue (the categories are names, not a scale). */
export function CategoryChart({ rows, t, ariaLabel }) {
  const ref = useRedrawWhenFontsLoad();

  const data = useMemo(() => ({
    labels: rows.map((r) => r.label),
    datasets: [{
      label: "Jobs", data: rows.map((r) => r.count),
      backgroundColor: t.blue, borderColor: t.blueDeep, borderWidth: 1.5,
      borderRadius: 8, borderSkipped: false, maxBarThickness: 26,
    }],
  }), [rows, t]);

  const options = useMemo(() => {
    const font = tickFont(t);
    return {
      ...baseOptions(t, {
        tooltipTitle: ([i]) => rows[i.dataIndex]?.label,
        tooltipLines: (c) => [`${c.parsed.x} ${c.parsed.x === 1 ? "job" : "jobs"}`],
      }),
      indexAxis: "y",
      scales: {
        y: {
          grid: { display: false }, border: { display: false },
          ticks: {
            color: t.ink2, font, autoSkip: false, padding: 8,
            // long discipline names would eat the whole plot on a phone, so wrap them to about 40% of the chart width
            callback(value) {
              const label = this.getLabelForValue(value);
              const budget = Math.max(9, Math.floor((this.chart.width * 0.4) / 6.6));
              const lines = [];
              let line = "";
              label.split(" ").forEach((word) => {
                if (line && (line + " " + word).length > budget) { lines.push(line); line = word; } else { line = line ? line + " " + word : word; }
              });
              lines.push(line);
              if (lines.length > 2) { lines.length = 2; lines[1] += "…"; }
              return lines.map((l) => (l.length > budget + 2 ? l.slice(0, budget + 1) + "…" : l));
            },
          },
        },
        x: {
          beginAtZero: true, grace: "10%",
          grid: { color: t.line, drawTicks: false }, border: { display: false },
          ticks: { color: t.ink2, font, padding: 8, maxTicksLimit: 5, callback: (v) => (Number.isInteger(v) ? v : null) },
        },
      },
    };
  }, [t, rows]);

  return <Bar ref={ref} data={data} options={options} role="img" aria-label={ariaLabel} />;
}
