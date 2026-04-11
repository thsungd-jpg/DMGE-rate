import React from 'react';

export default function GlitchLogo({ 
  text = "DMGE", 
  fontSize = "100px", 
  primaryColor = "#FFB347", 
  secondaryColor = "#E91E63",
  isLoaded = true,
  style = {}
}) {
  const glitchStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

    .glitch-wrapper {
      position: relative;
      display: inline-block;
      font-family: 'Press Start 2P', monospace;
      font-size: ${fontSize};
      font-weight: bold;
      color: transparent; 
      z-index: 5;
      user-select: none;
    }

    /* Layer 1: Solid Base Text */
    .base-text {
      position: relative;
      color: ${primaryColor};
      z-index: 2;
      transition: color 0.5s ease, text-shadow 0.5s ease;
    }

    /* Layer 2: Chromatic RGB Split */
    .rgb-glitch {
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      z-index: 1;
      transition: opacity 0.5s ease;
      opacity: ${isLoaded ? 0 : 1};
    }
    .rgb-glitch::before, .rgb-glitch::after {
      content: attr(data-text);
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      color: transparent;
    }
    .rgb-glitch::before {
      left: 4px; 
      text-shadow: -4px 0 rgba(0, 255, 255, 0.7);
      clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
      animation: glitch-anim-1 5s infinite linear alternate-reverse;
    }
    .rgb-glitch::after {
      left: -4px; 
      text-shadow: 4px 0 rgba(255, 0, 255, 0.7);
      clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
      animation: glitch-anim-2 6s infinite linear alternate-reverse;
    }

    /* Layer 3: Scanline Slicer Cuts */
    .glitch-wrapper::before, .glitch-wrapper::after {
      content: attr(data-text);
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      color: ${primaryColor};
      background: transparent; 
      z-index: 3;
      transition: opacity 0.5s ease;
      opacity: ${isLoaded ? 0 : 1};
    }
    .glitch-wrapper::before {
      animation: slice-anim-1 7s infinite linear;
      clip-path: polygon(0 40%, 100% 40%, 100% 45%, 0 45%);
    }
    .glitch-wrapper::after {
      animation: slice-anim-2 5s infinite linear;
      clip-path: polygon(0 75%, 100% 75%, 100% 85%, 0 85%);
    }

    /* Scanlines in Loaded State */
    .glitch-wrapper.is-loaded::after {
      content: attr(data-text);
      position: absolute; top: 0; left: 0; width: 100%; height: 100%;
      color: transparent;
      background: linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.5) 50%, transparent 50%, transparent);
      background-size: 100% 4px;
      -webkit-background-clip: text;
      z-index: 4;
      pointer-events: none;
      opacity: 1;
      animation: none;
      clip-path: none;
    }

    /* Loaded State Extrusion */
    .glitch-wrapper.is-loaded .base-text {
      color: ${primaryColor};
      text-shadow: 1px 1px 0 ${secondaryColor}, 2px 2px 0 ${secondaryColor}, 3px 3px 0 ${secondaryColor}, 
                   4px 4px 0 ${secondaryColor};
    }

    @keyframes glitch-anim-1 {
      0%   { clip-path: polygon(0 20%, 100% 20%, 100% 21%, 0 21%); }
      20%  { clip-path: polygon(0 33%, 100% 33%, 100% 33%, 0 33%); }
      40%  { clip-path: polygon(0 44%, 100% 44%, 100% 44%, 0 44%); }
      60%  { clip-path: polygon(0 50%, 100% 50%, 100% 20%, 0 20%); }
      80%  { clip-path: polygon(0 70%, 100% 70%, 100% 70%, 0 70%); }
      100% { clip-path: polygon(0 80%, 100% 80%, 100% 80%, 0 80%); }
    }
    @keyframes glitch-anim-2 {
      0%   { clip-path: polygon(0 25%, 100% 25%, 100% 30%, 0 30%); }
      15%  { clip-path: polygon(0 3%, 100% 3%, 100% 3%, 0 3%); }
      50%  { clip-path: polygon(0 5%, 100% 5%, 100% 20%, 0 20%); }
      65%  { clip-path: polygon(0 20%, 100% 20%, 100% 20%, 0 20%); }
      80%  { clip-path: polygon(0 40%, 100% 40%, 100% 40%, 0 40%); }
      100% { clip-path: polygon(0 43%, 100% 43%, 100% 43%, 0 43%); }
    }
    @keyframes slice-anim-1 {
      0%, 10%, 100% { transform: translateX(0); clip-path: polygon(0 0, 0 0, 0 0, 0 0); opacity: 1; }
      5% { transform: translateX(6px); clip-path: polygon(0 40%, 100% 40%, 100% 50%, 0 50%); opacity: 0.95; }
      6% { transform: translateX(-4px); color: #FFF; }
    }
    @keyframes slice-anim-2 {
      0%, 15%, 100% { transform: translateX(0); clip-path: polygon(0 0, 0 0, 0 0, 0 0); }
      10% { transform: translateX(-6px); clip-path: polygon(0 70%, 100% 70%, 100% 80%, 0 80%); }
    }
  `;

  return (
    <div className={`glitch-wrapper ${isLoaded ? 'is-loaded' : ''}`} data-text={text} style={style}>
      <style>{glitchStyles}</style>
      <div className="rgb-glitch" data-text={text}></div>
      <div className="base-text">{text}</div>
    </div>
  );
}
