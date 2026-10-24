import React from "react";
import PricingPage from "../components/PricingPage";

// Screen for tab "pricing".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function PricingScreen({ ctx }) {
  const {
    handlePlanSelect,
    setTab,
    userTier,
  } = ctx;

  return (
    <PricingPage
                  currentTier={userTier}
                  onSelectPlan={handlePlanSelect}
                  onBack={() => setTab('calc')}
                />
  );
}
