import React from "react";
import TutorialPage from "../components/TutorialPage";

// Screen for tab "tutorial".
// Extracted verbatim from App.jsx: everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
export default function TutorialScreen({ ctx }) {
  const {
    setTab,
  } = ctx;

  return (
    <TutorialPage onBack={() => setTab("calc")} />
  );
}
