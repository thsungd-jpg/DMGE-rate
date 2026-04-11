import React, { useEffect } from "react";
import { PBox, PBtn, PLbl } from "./ui";
import { IconArrowLeft, IconHelp, IconTech, IconBiz, IconMoney, IconStar, IconCheck } from "../icons";
import GlitchLogo from "./GlitchLogo";

export default function TutorialPage({ onBack }) {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const THEME = {
    orange: "#FFB347",
    pink: "#E91E63",
    black: "#0A0A0A",
    surface: "#1A1A1A",
    textMuted: "#FFB347AA"
  };

  const Badge = ({ text, color }) => (
    <div style={{
      display: "inline-block",
      background: color || THEME.pink,
      color: THEME.black,
      fontSize: "0.65rem",
      padding: "0.25rem 0.6rem",
      fontFamily: "'Press Start 2P'",
      marginBottom: "0.75rem",
      border: `0.125rem solid ${THEME.orange}`,
      boxShadow: `2px 2px 0 ${THEME.black}`
    }}>
      {text}
    </div>
  );

  const TutorialCard = ({ title, icon: Icon, badge, badgeColor, children }) => (
    <PBox bg={THEME.surface} shadowColor={THEME.pink} style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ padding: "0.5rem", border: `0.25rem solid ${THEME.orange}`, background: THEME.black }}>
          <Icon size={24} color={THEME.orange} />
        </div>
        <div>
          {badge && <Badge text={badge} color={badgeColor} />}
          <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: "1rem", margin: "0 0 0.5rem 0", lineHeight: 1.4, color: THEME.orange }}>{title}</h2>
          <div style={{ height: "4px", width: "40px", background: THEME.orange }}></div>
        </div>
      </div>
      <div style={{ fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.6, color: "#FFFFFF" }}>
        {children}
      </div>
    </PBox>
  );

  return (
    <div className="tutorial-page fade-in" style={{ paddingBottom: "4rem", maxWidth: "900px", margin: "0 auto" }}>
      
      {/* HEADER ROW */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "2.5rem", borderBottom: `4px solid ${THEME.orange}`, paddingBottom: "1.5rem", minHeight: "80px" }}>
        <PBtn small color={THEME.orange} onClick={onBack} style={{ position: "absolute", left: 0, display: "flex", alignItems: "center", gap: "0.5rem", color: THEME.black }}>
          <IconArrowLeft size={18} color={THEME.black} /> CALC
        </PBtn>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", alignItems: "center" }}>
          <GlitchLogo text="HOW IT WORKS" fontSize="clamp(1.8rem, 6vw, 3rem)" primaryColor={THEME.orange} secondaryColor={THEME.pink} />
        </div>
      </div>

      {/* FORMULA SECTION */}
      <div style={{ marginBottom: "4rem", background: THEME.surface, border: `4px solid ${THEME.orange}`, padding: "1.5rem", boxShadow: `8px 8px 0 ${THEME.pink}` }}>
        <div style={{ fontFamily: "'Press Start 2P'", fontSize: "0.75rem", color: THEME.orange, marginBottom: "1.5rem", textAlign: "center" }}>THE DMGE FORMULA</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", flexWrap: "wrap", textAlign: "center" }}>
          <div style={{ padding: "1rem", background: THEME.black, border: `2px solid ${THEME.orange}` }}>
            <div style={{ fontSize: "0.7rem", color: THEME.textMuted, marginBottom: "0.5rem", fontFamily: "'Press Start 2P'" }}>RATE</div>
            <div style={{ fontWeight: "700", color: "#FFF", fontFamily: "'Press Start 2P'", fontSize: "0.8rem" }}>BASE</div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: THEME.orange }}>&times;</div>
          <div style={{ padding: "1rem", background: THEME.black, border: `2px solid ${THEME.orange}` }}>
            <div style={{ fontSize: "0.7rem", color: THEME.textMuted, marginBottom: "0.5rem", fontFamily: "'Press Start 2P'" }}>WORKLOAD</div>
            <div style={{ fontWeight: "700", color: "#FFF", fontFamily: "'Press Start 2P'", fontSize: "0.8rem" }}>MULTI</div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: THEME.orange }}>+</div>
          <div style={{ padding: "1rem", background: THEME.black, border: `2px solid ${THEME.orange}` }}>
            <div style={{ fontSize: "0.7rem", color: THEME.textMuted, marginBottom: "0.5rem", fontFamily: "'Press Start 2P'" }}>EXPENSES</div>
            <div style={{ fontWeight: "700", color: "#FFF", fontFamily: "'Press Start 2P'", fontSize: "0.8rem" }}>ADD-ONS</div>
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: THEME.orange }}>=</div>
          <div style={{ padding: "1.25rem", background: THEME.black, border: `4px solid ${THEME.pink}` }}>
            <div style={{ fontSize: "0.7rem", color: THEME.pink, marginBottom: "0.5rem", fontFamily: "'Press Start 2P'" }}>FINAL QUOTE</div>
            <div style={{ fontWeight: "700", fontSize: "1.25rem", color: THEME.orange, fontFamily: "'Press Start 2P'" }}>PROFIT</div>
          </div>
        </div>
      </div>

      <p style={{ lineHeight: 1.8, marginBottom: "3rem", color: "#FFFFFF", fontFamily: "'Press Start 2P'", textAlign: "center", fontSize: "0.7rem" }}>
        Welcome to the DMGE framework! This guide explains exactly how each variable influences your final quote. We use a modular calculation engine to ensure you are paid fairly for your time, expertise, and expenses.
      </p>

      {/* TUTORIAL CARDS - LIST LAYOUT */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        <TutorialCard title="DISCIPLINE & ROLE" icon={IconStar} badge="FOUNDATION" badgeColor={THEME.orange}>
          <p><strong>What it does:</strong> Sets your starting price.</p>
          <p>Every role has an average market rate. We use this as your foundation. All other percentages build off this starting number.</p>
        </TutorialCard>

        <TutorialCard title="QTY (UNITS)" icon={IconTech} badge="SCALE" badgeColor={THEME.orange}>
          <p><strong>What it does:</strong> Multiplies your starting price.</p>
          <p>If you charge by the hour, day, or item, you just enter how many you're doing. (Example: $50/hr &times; 3 hours = $150).</p>
        </TutorialCard>

        <TutorialCard title="COMPLEXITY" icon={IconHelp} badge="PROFIT BOOST" badgeColor={THEME.pink}>
          <p><strong>What it does:</strong> Adjusts price by job difficulty.</p>
          <p>An easy job might lower the price slightly, while a tough "Masterpiece" bumps it up. This ensures you are compensated.</p>
        </TutorialCard>

        <TutorialCard title="USAGE RIGHTS" icon={IconCheck} badge="ESSENTIAL" badgeColor={THEME.pink}>
          <p><strong>What it does:</strong> Charges for where the work is shown.</p>
          <p>A quick local flyer stays cheap. If the client is putting it on a national TV ad, this bumps up the price to reflect value.</p>
        </TutorialCard>

        <TutorialCard title="CLIENT TYPE" icon={IconBiz} badge="STRATEGY" badgeColor={THEME.orange}>
          <p><strong>What it does:</strong> Adjusts price based on client size.</p>
          <p>Corporations have higher budgets and usually need more management. Individuals get a friendlier, accessible price.</p>
        </TutorialCard>

        <TutorialCard title="REVISIONS" icon={IconMoney} badge="FAIRNESS" badgeColor={THEME.pink}>
          <p><strong>What it does:</strong> Protects your time from "Scope Creep."</p>
          <p>The first edits are usually free. But if a client keeps asking for changes, the price goes up to cover the extra work hours.</p>
        </TutorialCard>

        <TutorialCard title="COMMUTE COST" icon={IconMoney} badge="REIMBURSEMENT" badgeColor={THEME.orange}>
          <p><strong>What it does:</strong> Adds a flat fee for travel.</p>
          <p>Travel is an out-of-pocket cost. Whether it's gas or a train ticket, this adds that exact amount to the total.</p>
        </TutorialCard>

        <TutorialCard title="MATERIALS / SUPPLIES" icon={IconTech} badge="EXPENSES" badgeColor={THEME.orange}>
          <p><strong>What it does:</strong> Adds flat fees for physical items.</p>
          <p>If you need to buy props, software licenses, or specialized tools, enter the cost here to pass it directly to the client.</p>
        </TutorialCard>

        <TutorialCard title="RUSH DIV & PLATFORM" icon={IconBiz} badge="SURCHARGE" badgeColor={THEME.pink}>
          <p><strong>What it does:</strong> The final adjustments.</p>
          <p><strong>RUSH DIV</strong> adds 30% for fast turnaround. <strong>PLATFORM</strong> adds a percentage to cover credit card processing fees.</p>
        </TutorialCard>

      </div>
    </div>
  );
}
