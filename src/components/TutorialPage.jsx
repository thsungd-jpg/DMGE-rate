import React, { useEffect } from "react";
import { Screen, Card, SectionTitle, Grid } from "./kit";
import { PBtn } from "./ui";
import { IconArrowLeft, IconCalc } from "../icons";
import { STEPS, FIELD_NOTES } from "../screens/tutorial/TutorialSteps";
import "../screens/tutorial/tutorial.css";

// Friendly walkthrough: the five-step flow, how the price is built, and what every calculator box does.
// `onBack` returns to the calculator (it is both the skip and the finish action).
export default function TutorialPage({ onBack }) {
  useEffect(() => {
    // the app scrolls inside .app-wrapper, so reset both that and the window
    window.scrollTo(0, 0);
    document.querySelector(".app-wrapper")?.scrollTo?.(0, 0);
  }, []);

  return (
    <Screen
      eyebrow="Guide"
      title={<>How it <em>works</em></>}
      subtitle="Five quick steps from your craft to a polished invoice. It takes a minute to learn and a few taps to use."
      actions={
        <PBtn small color="var(--paper)" className="lq-btn--neutral" onClick={onBack}>
          <IconArrowLeft size={16} /> Back to calculator
        </PBtn>
      }
    >
      <Card tone="glass" pad="md" className="tut-formula" aria-label="How your price is built">
        <p className="tut-formula-title">How your price is built</p>
        <div className="tut-eq">
          <div className="tut-term">
            <small>Starting point</small>
            <b>Base rate</b>
          </div>
          <span className="tut-op" aria-label="multiplied by">&times;</span>
          <div className="tut-term">
            <small>Your workload</small>
            <b>Multipliers</b>
          </div>
          <span className="tut-op" aria-label="plus">+</span>
          <div className="tut-term">
            <small>Your expenses</small>
            <b>Add-ons</b>
          </div>
          <span className="tut-op" aria-label="equals">=</span>
          <div className="tut-term tut-term--result">
            <small>Your quote</small>
            <b>Final price</b>
          </div>
        </div>
      </Card>

      <ol className="tut-steps" aria-label="The five steps">
        {STEPS.map((s, i) => (
          <Card as="li" key={s.key} tone={s.tone} pad="lg" className="tut-step" style={{ "--i": i }}>
            <div className="tut-step-text">
              <div className="tut-step-top">
                <span className="tut-step-n">Step {i + 1}</span>
                <span className="tut-step-icon"><s.Icon size={22} /></span>
              </div>
              <h2 className="tut-step-title">{s.title}</h2>
              <p className="tut-step-body">{s.body}</p>
              <p className="tut-step-tip">{s.tip}</p>
            </div>
            <div className="tut-step-art"><s.Art /></div>
          </Card>
        ))}
      </ol>

      <SectionTitle aside={<span className="tut-aside">Every box in the calculator, in plain words</span>}>
        What each box <em>does</em>
      </SectionTitle>
      <Grid min={280} gap={14}>
        {FIELD_NOTES.map((n) => (
          <Card key={n.title} pad="md" className="tut-note">
            <span className="tut-note-icon"><n.Icon size={20} /></span>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
          </Card>
        ))}
      </Grid>

      <Card tone="lilac" pad="lg" className="tut-cta">
        <div>
          <h2>Ready to <em>try it?</em></h2>
          <p>Pick a role, answer a few boxes and your three prices appear in seconds.</p>
        </div>
        <PBtn color="var(--butter)" onClick={onBack}>
          <IconCalc size={18} /> Start quoting
        </PBtn>
      </Card>
    </Screen>
  );
}
