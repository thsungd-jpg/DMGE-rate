import React, { useEffect } from "react";

// 5-second pixel money splash. Black background, glowing $ in Press Start 2P.
// Calls onDone() once the timer fires. Caller is responsible for unmounting.
export default function SplashScreen({ onDone, durationMs = 5000 }) {
  useEffect(() => {
    const id = setTimeout(() => { onDone?.(); }, durationMs);
    return () => clearTimeout(id);
  }, [onDone, durationMs]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* CRT scanlines */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.04) 0 2px, transparent 2px 4px)",
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      <div
        className="dmge-splash-pulse"
        style={{
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "clamp(7rem, 22vw, 14rem)",
          color: "#FFB347",
          textShadow:
            "0 0 8px #FFB347, 0 0 18px #FFB347, 0 0 32px #E91E63, 6px 6px 0 #E91E63",
          lineHeight: 1,
          letterSpacing: "0.05em",
        }}
      >
        $
      </div>

      <div
        style={{
          marginTop: "clamp(1.5rem, 5vw, 3rem)",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "clamp(0.9rem, 3vw, 1.4rem)",
          color: "#E91E63",
          textShadow: "0 0 8px #E91E63",
          letterSpacing: "0.18em",
        }}
      >
        DMGE
      </div>

      <div
        style={{
          marginTop: "1rem",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "0.55rem",
          color: "#FFB34788",
          letterSpacing: "0.12em",
        }}
      >
        LOADING...
      </div>
    </div>
  );
}
