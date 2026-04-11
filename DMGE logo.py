import React, { useState, useEffect } from 'react';

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&family=Press+Start+2P&display=swap');

  /* Base App Styles */
  .dmge-bg { 
    background-color: #0A0A0A; 
    color: #fff; 
    font-family: 'Syne', sans-serif; 
    min-height: 100vh; 
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  /* Presentation Card */
  .master-card {
    position: relative;
    width: 100%;
    max-width: 800px;
    height: 450px;
    background: #0A0A0A;
    border: 1px solid #2A2A2A;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  }

  /* Scanline Overlay */
  .scanlines {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.4));
    background-size: 100% 4px; 
    pointer-events: none; 
    z-index: 10;
  }

  /* Terminal Hex-Dump Background */
  .hex-bg {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    font-family: 'DM Mono', monospace; font-size: 14px; color: rgba(200, 255, 87, 0.06);
    word-break: break-all; overflow: hidden; line-height: 1.4; text-align: justify; z-index: 0;
    transition: color 0.5s ease;
  }

  /* =========================================
     THE ULTIMATE GLITCH TEXT COMBINATION
     ========================================= */
  .ultimate-wrapper {
    position: relative;
    display: inline-block;
    font-family: 'Press Start 2P', monospace;
    font-size: 100px; /* Increased from 64px to 100px */
    font-weight: bold;
    color: transparent; 
    margin-bottom: 20px; /* Decreased from 60px to move the bar up */
    z-index: 5;
  }

  /* Layer 1: Solid Base Text */
  .base-text {
    position: relative;
    color: #C8FF57;
    z-index: 2;
    transition: color 0.5s ease, text-shadow 0.5s ease;
  }

  /* Layer 2: Chromatic RGB Split */
  .rgb-glitch {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 1;
    transition: opacity 0.5s ease;
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
    /* Slowed down from 2.5s to 5s */
    animation: glitch-anim-1 5s infinite linear alternate-reverse;
  }
  .rgb-glitch::after {
    left: -4px; 
    text-shadow: 4px 0 rgba(255, 0, 255, 0.7);
    clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
    /* Slowed down from 3s to 6s */
    animation: glitch-anim-2 6s infinite linear alternate-reverse;
  }

  /* Layer 3: Scanline Slicer Cuts */
  .ultimate-wrapper::before, .ultimate-wrapper::after {
    content: attr(data-text);
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    color: #C8FF57;
    background: #0A0A0A; 
    z-index: 3;
    transition: opacity 0.5s ease;
  }
  .ultimate-wrapper::before {
    /* Slowed down from 3s to 7s */
    animation: slice-anim-1 7s infinite linear;
    clip-path: polygon(0 40%, 100% 40%, 100% 45%, 0 45%);
  }
  .ultimate-wrapper::after {
    /* Slowed down from 2s to 5s */
    animation: slice-anim-2 5s infinite linear;
    clip-path: polygon(0 75%, 100% 75%, 100% 85%, 0 85%);
  }

  /* KEYFRAMES */
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
    /* Reduced translation jumps significantly */
    5% { transform: translateX(6px); clip-path: polygon(0 40%, 100% 40%, 100% 50%, 0 50%); opacity: 0.95; }
    6% { transform: translateX(-4px); color: #FFF; }
  }
  @keyframes slice-anim-2 {
    0%, 15%, 100% { transform: translateX(0); clip-path: polygon(0 0, 0 0, 0 0, 0 0); }
    /* Reduced translation jumps significantly */
    10% { transform: translateX(-6px); clip-path: polygon(0 70%, 100% 70%, 100% 80%, 0 80%); }
  }

  /* =========================================
     LOADING BAR
     ========================================= */
  .master-bar-container {
    position: relative; 
    z-index: 5; 
    width: 100%; 
    max-width: 400px; /* Matched exactly to the 400px width of the 100px 8-bit DMGE text */
    height: 36px;     /* Increased from 24px */
    border: 4px solid #C8FF57; /* Made the border thicker to match the larger size */
    background: rgba(10, 10, 10, 0.8);
    padding: 4px;
    box-shadow: 0 0 15px rgba(200, 255, 87, 0.2);
    transition: border-color 0.5s ease, box-shadow 0.5s ease;
  }
  .master-bar-fill {
    height: 100%; 
    background: #C8FF57; 
    transition: width 0.1s linear, background 0.5s ease, box-shadow 0.5s ease;
  }

  /* =========================================
     LOADED STATE (100%)
     ========================================= */
  .dmge-bg.loaded .base-text {
    color: #FFB347; /* Warm Orange Base */
    /* Stacked shadows create a solid 8-bit 3D extrusion */
    text-shadow: 1px 1px 0 #E91E63, 2px 2px 0 #E91E63, 3px 3px 0 #E91E63, 
                 4px 4px 0 #E91E63, 5px 5px 0 #E91E63, 6px 6px 0 #E91E63, 
                 7px 7px 0 #E91E63, 8px 8px 0 #E91E63;
  }
  .dmge-bg.loaded .rgb-glitch,
  .dmge-bg.loaded .ultimate-wrapper::before,
  .dmge-bg.loaded .ultimate-wrapper::after {
    opacity: 0; /* Fade out the glitches to reveal the clean solid logo */
  }
  .dmge-bg.loaded .master-bar-container {
    border-color: #FFB347;
    /* Dual glow: Orange primary glow with a wider Pink ambient glow */
    box-shadow: 0 0 20px rgba(255, 179, 71, 0.6), 0 0 40px rgba(233, 30, 99, 0.4);
  }
  .dmge-bg.loaded .master-bar-fill {
    background: #FFB347;
    box-shadow: 0 0 15px rgba(255, 179, 71, 0.8);
  }
  .dmge-bg.loaded .hex-bg {
    color: rgba(255, 179, 71, 0.06);
  }
  .header-title {
    font-size: 24px; 
    font-weight: 800; 
    color: #C8FF57;
    transition: color 0.5s ease;
  }
  .dmge-bg.loaded .header-title {
    color: #FFB347;
  }
`;

export default function App() {
  const [progress, setProgress] = useState(0);
  const [hexStream, setHexStream] = useState('');

  // Master Progress Loop
  useEffect(() => {
    const pInterval = setInterval(() => {
      setProgress(p => {
        // Stop the loop at 100%
        if (p >= 100) {
          clearInterval(pInterval);
          return 100;
        }
        return p + 1;
      });
    }, 60); // Sped up progress increment (decreased from 150ms to 60ms)
    return () => clearInterval(pInterval);
  }, []);

  // Effect: Hex Dump Background generator (Slower and smoother)
  useEffect(() => {
    const hexChars = '0123456789ABCDEF';
    const generateHex = () => {
      let str = '';
      // Increased from 300 to 2500 to completely fill the background container
      for(let i=0; i<2500; i++) {
        str += hexChars[Math.floor(Math.random()*16)];
        if (i%2 !== 0) str += ' ';
      }
      return str;
    };
    
    const hexInterval = setInterval(() => {
      setHexStream(generateHex());
    }, 400); // Slowed down from 80ms to 400ms for less frantic background
    
    return () => clearInterval(hexInterval);
  }, []);

  return (
    <div className={`dmge-bg ${progress >= 100 ? 'loaded' : ''}`}>
      <style>{FONTS}</style>
      
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 className="header-title">DMGE</h1>
        <p style={{ fontFamily: "'DM Mono', monospace", color: '#888', fontSize: '12px', marginTop: '4px', letterSpacing: '2px' }}>
          SYSTEM BOOT SEQUENCE
        </p>
      </div>

      <div className="master-card">
        {/* Layer 0: Scanlines and Hex Background */}
        <div className="scanlines"></div>
        <div className="hex-bg">{hexStream}</div>

        {/* Combined Text Glitch Logo */}
        <div className="ultimate-wrapper" data-text="DMGE">
          {/* Cyan/Magenta RGB Aura */}
          <div className="rgb-glitch" data-text="DMGE"></div>
          {/* Core Green Text */}
          <div className="base-text">DMGE</div>
        </div>

        {/* Hex Data Loading Bar (Numbers removed) */}
        <div className="master-bar-container">
          <div className="master-bar-fill" style={{ width: `${progress}%` }}></div>
        </div>

      </div>
    </div>
  );
}