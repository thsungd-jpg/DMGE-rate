import React, { useState, useEffect } from 'react';

export default function LoadingBar({ 
  primaryColor = "#C8FF57", 
  secondaryColor = "#FFB347",
  duration = 6000, 
  onComplete,
  style = {}
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (progress >= 100) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const nextProgress = Math.min(100, (elapsed / duration) * 100);
      setProgress(nextProgress);
      
      if (nextProgress >= 100) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onComplete]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '400px',
      margin: '20px auto',
      padding: '4px',
      border: `4px solid ${progress >= 100 ? secondaryColor : primaryColor}`,
      background: 'rgba(26, 26, 26, 0.8)',
      boxShadow: progress >= 100 ? `0 0 20px ${secondaryColor}66` : `0 0 15px ${primaryColor}33`,
      transition: 'border-color 0.5s ease, box-shadow 0.5s ease',
      boxSizing: 'border-box',
      ...style
    }}>
      <div style={{
        height: '24px',
        width: `${progress}%`,
        background: progress >= 100 ? secondaryColor : primaryColor,
        transition: 'width 0.1s linear, background 0.5s ease, box-shadow 0.5s ease',
        boxShadow: progress >= 100 ? `0 0 15px ${secondaryColor}` : 'none'
      }} />
    </div>
  );
}
