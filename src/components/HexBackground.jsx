import React, { useState, useEffect } from 'react';

export default function HexBackground({ 
  opacity = 0.06, 
  color = "#C8FF57",
  speed = 400 
}) {
  const [hexStream, setHexStream] = useState('');

  useEffect(() => {
    const hexChars = '0123456789ABCDEF';
    const generateHex = () => {
      let str = '';
      for(let i=0; i<10000; i++) {
        str += hexChars[Math.floor(Math.random()*16)];
        if (i%2 !== 0) str += ' ';
      }
      return str;
    };
    
    const hexInterval = setInterval(() => {
      setHexStream(generateHex());
    }, speed);
    
    return () => clearInterval(hexInterval);
  }, [speed]);

  return (
    <>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        fontFamily: "'DM Mono', monospace",
        fontSize: '14px',
        color: color,
        opacity: opacity,
        wordBreak: 'break-all',
        overflow: 'hidden',
        lineHeight: '1.4',
        textAlign: 'justify',
        zIndex: -1,
        pointerEvents: 'none',
        transition: 'color 0.5s ease'
      }}>
        {hexStream}
      </div>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.1))',
        backgroundSize: '100% 4px',
        pointerEvents: 'none',
        zIndex: -1,
        opacity: 0.5
      }}></div>
    </>
  );
}
