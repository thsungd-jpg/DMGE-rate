import React from "react";
import TutorialPage from "../components/TutorialPage";

// Screen for tab "tutorial".
// Everything it needs from the app (state, handlers, helpers) arrives in `ctx`.
// The "seen tutorial" flag and the first-login redirect live in App.jsx; this screen only offers the way out (back to the calculator).
export default function TutorialScreen({ ctx }) {
  const {
    setTab,
  } = ctx;

  return <TutorialPage onBack={() => setTab("calc")} />;
}
