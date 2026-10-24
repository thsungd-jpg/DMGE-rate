import React from "react";
import { PBtn, PLbl } from "../components/ui";
import { IconArrowLeft } from "../icons";
import AnalyticsDashboard from "../components/AnalyticsDashboard";

// Screen for tab "analytics".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function AnalyticsScreen({ ctx }) {
  const {
    catData,
    setTab,
    windowedJobs,
  } = ctx;

  return (
    <>
                <div style={{ marginBottom: "1rem" }}>
                  <PBtn small color="#FFB347" onClick={() => setTab("calc")} style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0A0A0A" }}>
                    <IconArrowLeft size={18} color="#0A0A0A" /> CALC
                  </PBtn>
                  <PLbl accent={catData.accent} style={{ marginBottom: 0, fontSize: "clamp(1.25rem, 3.5vw, 2rem)", textAlign: "center", marginTop: "0.75rem" }}>ANALYTICS</PLbl>
                </div>
                <AnalyticsDashboard jobs={windowedJobs} catData={catData} />
              </>
  );
}
