import React, { useState, useMemo } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { PBox, PBtn, PLbl, PSelect } from "./ui";
import { IconMoney, IconStar, IconCheck, IconArrowLeft } from "../icons";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

export default function AnalyticsDashboard({ jobs, catData }) {
  const [dateRange, setDateRange] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Get all unique categories from full jobs array (for dropdown)
  const allCategories = useMemo(() => {
    const categories = new Set();
    jobs.forEach(job => {
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
      filtered = filtered.filter(job => new Date(job.date) >= monthAgo);
    } else if (dateRange === "quarter") {
      const quarterAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      filtered = filtered.filter(job => new Date(job.date) >= quarterAgo);
    } else if (dateRange === "year") {
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      filtered = filtered.filter(job => new Date(job.date) >= yearAgo);
    }

    // Category filtering
    if (categoryFilter !== "all") {
      filtered = filtered.filter(job => job.category === categoryFilter);
    }

    return filtered;
  }, [jobs, dateRange, categoryFilter]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredJobs.reduce((sum, job) => sum + job.price, 0);
    const avgJobPrice = filteredJobs.length > 0 ? totalRevenue / filteredJobs.length : 0;
    const jobCount = filteredJobs.length;

    // Revenue by month
    const revenueByMonth = {};
    filteredJobs.forEach(job => {
      const date = new Date(job.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      revenueByMonth[monthKey] = (revenueByMonth[monthKey] || 0) + job.price;
    });

    // Jobs by category
    const jobsByCategory = {};
    filteredJobs.forEach(job => {
      jobsByCategory[job.category] = (jobsByCategory[job.category] || 0) + 1;
    });

    return { totalRevenue, avgJobPrice, jobCount, revenueByMonth, jobsByCategory };
  }, [filteredJobs]);

  // Chart data
  const revenueChartData = {
    labels: Object.keys(metrics.revenueByMonth).sort(),
    datasets: [{
      label: 'Revenue ($)',
      data: Object.keys(metrics.revenueByMonth).sort().map(month => metrics.revenueByMonth[month]),
      backgroundColor: catData.color + '80',
      borderColor: catData.accent,
      borderWidth: 2,
    }],
  };

  const categoryChartData = {
    labels: Object.keys(metrics.jobsByCategory),
    datasets: [{
      label: 'Jobs',
      data: Object.keys(metrics.jobsByCategory).map(cat => metrics.jobsByCategory[cat]),
      backgroundColor: catData.color + '80',
      borderColor: catData.accent,
      borderWidth: 2,
    }],
  };

  const chartOptions = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: value => Number.isInteger(value) ? value : null,
        },
      },
    },
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Revenue Trends' },
    },
  };

  return (
    <div className="analytics-dashboard" style={{ paddingRight: "0.5rem", paddingBottom: "0.5rem" }}>

      {/* METRIC CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 16rem), 1fr))", gap: "1.5625rem", marginBottom: "2.5rem", paddingRight: "0.5rem", paddingBottom: "0.5rem" }}>
        <div style={{ gridColumn: "1 / -1", minWidth: 0 }}>
        <PBox bg={catData.color + "22"} borderColor={catData.accent} shadowColor={catData.accent + "44"}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "clamp(0.5rem, 2vw, 0.75rem)", color: "#888", marginBottom: "0.9375rem" }}>TOTAL REVENUE</div>
              <div style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", color: "var(--pixel-text, #2a2a2a)", marginBottom: "0.3125rem" }}>${Math.round(metrics.totalRevenue)}</div>
            </div>
            <IconMoney size="clamp(2rem, 8vw, 3rem)" color={catData.accent} />
          </div>
        </PBox>
        </div>

        <PBox bg={catData.color + "22"} borderColor={catData.accent} shadowColor={catData.accent + "44"}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "clamp(0.5rem, 2vw, 0.75rem)", color: "#888", marginBottom: "0.9375rem" }}>AVG JOB PRICE</div>
              <div style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", color: "var(--pixel-text, #2a2a2a)", marginBottom: "0.3125rem" }}>${Math.round(metrics.avgJobPrice)}</div>
            </div>
            <IconStar size="clamp(1.75rem, 7vw, 2.75rem)" color={catData.accent} />
          </div>
        </PBox>

        <PBox bg={catData.color + "22"} borderColor={catData.accent} shadowColor={catData.accent + "44"}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
            <div>
              <div style={{ fontSize: "clamp(0.5rem, 2vw, 0.75rem)", color: "#888", marginBottom: "0.9375rem" }}>JOBS COMPLETED</div>
              <div style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", color: "var(--pixel-text, #2a2a2a)", marginBottom: "0.3125rem" }}>{metrics.jobCount}</div>
            </div>
            <IconCheck size="clamp(2rem, 8vw, 3rem)" color={catData.accent} />
          </div>
        </PBox>
      </div>

      {/* FILTER BAR */}
      <PBox bg="var(--pixel-surface, #e0e0e0)" shadowColor="#aaaaaa" style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 15.625rem), 1fr))", gap: "2.1875rem" }}>
          <div>
            <PLbl accent={catData.accent} style={{ marginBottom: "0.9375rem", fontSize: "clamp(0.6rem, 2vw, 0.875rem)" }}>DATE RANGE</PLbl>
            <PSelect
              value={dateRange}
              onChange={setDateRange}
              options={[
                { label: "All Time", value: "all" },
                { label: "Last Month", value: "month" },
                { label: "Last Quarter", value: "quarter" },
                { label: "Last Year", value: "year" },
              ]}
              iconType="none"
            />
          </div>
          <div>
            <PLbl accent={catData.accent} style={{ marginBottom: "0.9375rem", fontSize: "clamp(0.6rem, 2vw, 0.875rem)" }}>CATEGORY FILTER</PLbl>
            <PSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={[
                { label: "All Categories", value: "all" },
                ...allCategories.map(cat => ({ label: cat, value: cat })),
              ]}
              iconType="none"
            />
          </div>
        </div>
      </PBox>

      {/* CHARTS SECTION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 31.25rem), 1fr))", gap: "2.1875rem", marginBottom: "2.5rem" }}>
        <PBox bg="var(--pixel-surface, #e0e0e0)" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.9375rem", marginBottom: "2.1875rem" }}>
            <div style={{ width: "0.625rem", height: "1.5625rem", background: catData.accent }}></div>
            <div style={{ fontSize: "clamp(0.75rem, 3vw, 1.125rem)", color: "#2a2a2a", fontFamily: "'Press Start 2P'" }}>REVENUE TRENDS</div>
          </div>
          <div style={{ height: "18.75rem", position: "relative" }}>
            <Line data={revenueChartData} options={{ ...chartOptions, maintainAspectRatio: false }} />
          </div>
        </PBox>

        <PBox bg="var(--pixel-surface, #e0e0e0)" style={{ overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.9375rem", marginBottom: "2.1875rem" }}>
            <div style={{ width: "0.625rem", height: "1.5625rem", background: catData.accent }}></div>
            <div style={{ fontSize: "clamp(0.75rem, 3vw, 1.125rem)", color: "#2a2a2a", fontFamily: "'Press Start 2P'" }}>CATEGORY MIX</div>
          </div>
          <div style={{ height: "18.75rem", position: "relative" }}>
            <Bar data={categoryChartData} options={{ ...chartOptions, maintainAspectRatio: false, plugins: { ...chartOptions.plugins, title: { display: false } } }} />
          </div>
        </PBox>
      </div>
    </div>
  );
}