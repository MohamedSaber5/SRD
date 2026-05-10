import React, { useEffect, useRef, useMemo } from 'react';
import { useRamadan } from '../../contexts/RamadanContext';

/* ─── Lantern SVG ─────────────────────────────────────────────────── */
const LanternSVG = ({ color = '#d4af37', glowColor = '#ffdc73', size = 1 }) => (
  <svg
    width={48 * size}
    height={72 * size}
    viewBox="0 0 48 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 0 ${10 * size}px ${glowColor}aa)` }}
  >
    {/* Top cap */}
    <rect x="18" y="0" width="12" height="5" rx="2" fill={color} />
    {/* String */}
    <line x1="24" y1="5" x2="24" y2="12" stroke={color} strokeWidth="2" />
    {/* Top diamond ring */}
    <ellipse cx="24" cy="12" rx="9" ry="3" fill={color} />
    {/* Body top */}
    <path d="M12 14 Q24 10 36 14 L38 54 Q24 60 10 54 Z" fill={glowColor} opacity="0.2" />
    {/* Body ribs */}
    {[0, 1, 2, 3, 4].map(i => (
      <ellipse key={i} cx="24" cy={14 + i * 10} rx={12 - i * 0.3} ry="2.5" fill={color} opacity="0.8" />
    ))}
    {/* Body glass glow */}
    <path d="M14 16 Q24 12 34 16 L36 52 Q24 58 12 52 Z" fill={glowColor} opacity="0.55" />
    {/* Inner flame glow */}
    <ellipse cx="24" cy="34" rx="7" ry="10" fill="white" opacity="0.3" />
    {/* Bottom cap */}
    <ellipse cx="24" cy="54" rx="10" ry="3" fill={color} />
    {/* Tassels */}
    {[-6, -2, 2, 6].map((x, i) => (
      <line key={i} x1={24 + x} y1="57" x2={24 + x + (i % 2 === 0 ? -1 : 1)} y2={67 + (i % 2) * 4} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    ))}
    {[-6, -2, 2, 6].map((x, i) => (
      <circle key={i} cx={24 + x + (i % 2 === 0 ? -1 : 1)} cy={68 + (i % 2) * 4} r="1.5" fill={color} />
    ))}
  </svg>
);

/* ─── Round Lantern SVG ───────────────────────────────────────────── */
const RoundLanternSVG = ({ color = '#d4af37', glowColor = '#ffdc73', size = 1 }) => (
  <svg
    width={44 * size}
    height={60 * size}
    viewBox="0 0 44 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: `drop-shadow(0 0 ${12 * size}px ${glowColor}cc)` }}
  >
    {/* String */}
    <line x1="22" y1="0" x2="22" y2="8" stroke={color} strokeWidth="1.5" />
    {/* Top circle */}
    <circle cx="22" cy="12" r="5" fill={color} />
    {/* Body - Round / Pumpkin shape */}
    <path
      d="M10 20 C2 20 2 45 10 45 L34 45 C42 45 42 20 34 20 Z"
      fill={glowColor}
      opacity="0.3"
    />
    <ellipse cx="22" cy="32.5" rx="16" ry="14" fill={glowColor} opacity="0.6" />
    {/* Decorative Ribs */}
    <path d="M22 18 V47" stroke={color} strokeWidth="1.5" opacity="0.8" />
    <path d="M14 20 Q10 32 14 45" stroke={color} strokeWidth="1.2" fill="none" />
    <path d="M30 20 Q34 32 30 45" stroke={color} strokeWidth="1.2" fill="none" />
    {/* Middle decorative band */}
    <rect x="6" y="30" width="32" height="4" rx="2" fill={color} opacity="0.9" />
    {/* Bottom cap */}
    <path d="M15 45 L29 45 L26 50 L18 50 Z" fill={color} />
    {/* Small dangle */}
    <line x1="22" y1="50" x2="22" y2="58" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <circle cx="22" cy="59" r="2" fill={color} />
  </svg>
);

/* ─── Star SVG ─────────────────────────────────────────────────────── */
const StarSVG = ({ size = 1, color = '#fff9c4' }) => (
  <svg width={16 * size} height={16 * size} viewBox="0 0 16 16" fill="none">
    <polygon
      points="8,1 9.8,6.2 15.5,6.2 10.9,9.5 12.7,14.8 8,11.5 3.3,14.8 5.1,9.5 0.5,6.2 6.2,6.2"
      fill={color}
    />
  </svg>
);

/* ─── Crescent SVG ─────────────────────────────────────────────────── */
const CrescentSVG = ({ size = 1 }) => (
  <svg width={40 * size} height={50 * size} viewBox="0 0 40 50" fill="none">
    <path
      d="M28 5 C10 8 4 22 8 36 C12 50 26 54 36 48 C20 50 10 38 12 25 C14 12 22 6 28 5 Z"
      fill="#d4af37"
      style={{ filter: 'drop-shadow(0 0 8px #ffdc73)' }}
    />
  </svg>
);

/* ─── Garland rope at top ────────────────────────────────────────────── */
const GarlandRope = () => {
  const count = Math.ceil(window.innerWidth / 60) + 2;
  return (
    <svg
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '60px', zIndex: 100000, pointerEvents: 'none' }}
      viewBox={`0 0 ${window.innerWidth} 60`}
      preserveAspectRatio="none"
    >
      {/* Rope */}
      <path
        d={`M0,20 ${Array.from({ length: count }).map((_, i) => `Q${i * 60 + 30},40 ${(i + 1) * 60},20`).join(' ')}`}
        stroke="#8B6914"
        strokeWidth="2"
        fill="none"
        opacity="0.8"
      />
      {/* Small diamonds on rope */}
      {Array.from({ length: count }).map((_, i) => (
        <rect key={i} x={i * 60 + 27} y={24} width="6" height="6" rx="1" fill="#d4af37" transform={`rotate(45 ${i * 60 + 30} 27)`} opacity="0.9" />
      ))}
    </svg>
  );
};

/* ─── Single falling element ─────────────────────────────────────────── */
function FallingItem({ item }) {
  const style = {
    position: 'fixed',
    left: `${item.x}vw`,
    top: '-120px',
    zIndex: 9998,
    pointerEvents: 'none',
    userSelect: 'none',
    // Removed 'infinite' to make it fall only once
    animation: `ramadan-fall-${item.wobble} ${item.duration}s linear ${item.delay}s forwards`,
    opacity: item.opacity,
  };

  if (item.type === 'lantern') {
    return (
      <div style={style}>
        <div style={{ animation: `ramadan-sway ${item.swayDuration}s ease-in-out ${item.swayDelay}s infinite alternate` }}>
          <LanternSVG color={item.color} glowColor={item.glow} size={item.size} />
        </div>
      </div>
    );
  }

  if (item.type === 'round-lantern') {
    return (
      <div style={style}>
        <div style={{ animation: `ramadan-sway ${item.swayDuration}s ease-in-out ${item.swayDelay}s infinite alternate` }}>
          <RoundLanternSVG size={item.size} color={item.color} glowColor={item.glow} />
        </div>
      </div>
    );
  }

  if (item.type === 'star') {
    return (
      <div style={{ ...style, animation: `ramadan-fall-${item.wobble} ${item.duration}s linear ${item.delay}s forwards, ramadan-twinkle ${item.swayDuration}s ease-in-out ${item.swayDelay}s infinite` }}>
        <StarSVG size={item.size} color={item.color} />
      </div>
    );
  }

  if (item.type === 'crescent') {
    return (
      <div style={style}>
        <div style={{ animation: `ramadan-sway ${item.swayDuration}s ease-in-out ${item.swayDelay}s infinite alternate` }}>
          <CrescentSVG size={item.size} />
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Main Overlay ────────────────────────────────────────────────────── */
export default function RamadanOverlay() {
  const { ramadanMode } = useRamadan();
  const [visible, setVisible] = React.useState(false);
  const [animationKey, setAnimationKey] = React.useState(0);

  useEffect(() => {
    if (ramadanMode) {
      setAnimationKey(prev => prev + 1); // Restart animation when enabled
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [ramadanMode]);

  // Generate items once - a mix of lanterns, stars, crescents
  const items = useMemo(() => {
    const lanternColors = [
      { color: '#d4af37', glow: '#ffdc73' },
      { color: '#c0392b', glow: '#ff7c6e' },
      { color: '#1a7a4a', glow: '#4ecf87' },
      { color: '#7b5ea7', glow: '#c49dff' },
      { color: '#1a6b8a', glow: '#5bd8ff' },
      { color: '#e07b39', glow: '#ffb67a' },
    ];
    const starColors = ['#fff9c4', '#ffdc73', '#ffd700', '#fffde7', '#ffffff'];

    const result = [];

    // 12 lanterns
    for (let i = 0; i < 12; i++) {
      const c = lanternColors[i % lanternColors.length];
      result.push({
        id: `lantern-${i}`,
        type: 'lantern',
        x: 2 + (i / 12) * 96 + (Math.random() * 4 - 2),
        duration: 10 + Math.random() * 5,
        delay: Math.random() * 5, // Positive delay so they start one by one
        wobble: Math.random() > 0.5 ? 'left' : 'right',
        swayDuration: 2.5 + Math.random() * 2,
        swayDelay: Math.random() * 2,
        size: 0.6 + Math.random() * 0.6,
        opacity: 0.75 + Math.random() * 0.25,
        color: c.color,
        glow: c.glow,
      });
    }

    // 20 stars
    for (let i = 0; i < 20; i++) {
      result.push({
        id: `star-${i}`,
        type: 'star',
        x: Math.random() * 98,
        duration: 8 + Math.random() * 6,
        delay: Math.random() * 8,
        wobble: Math.random() > 0.5 ? 'left' : 'right',
        swayDuration: 1.5 + Math.random() * 2,
        swayDelay: Math.random() * 3,
        size: 0.5 + Math.random() * 1.2,
        opacity: 0.5 + Math.random() * 0.5,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      });
    }

    // 4 crescents
    for (let i = 0; i < 4; i++) {
      result.push({
        id: `crescent-${i}`,
        type: 'crescent',
        x: 10 + i * 25 + Math.random() * 10,
        duration: 12 + Math.random() * 4,
        delay: Math.random() * 10,
        wobble: Math.random() > 0.5 ? 'left' : 'right',
        swayDuration: 3 + Math.random() * 2,
        swayDelay: Math.random() * 2,
        size: 0.5 + Math.random() * 0.5,
        opacity: 0.6 + Math.random() * 0.3,
      });
    }

    // 6 Round Special Lanterns
    for (let i = 0; i < 6; i++) {
      const c = lanternColors[(i + 2) % lanternColors.length];
      result.push({
        id: `round-${i}`,
        type: 'round-lantern',
        x: 5 + (i / 6) * 90 + Math.random() * 5,
        duration: 11 + Math.random() * 3,
        delay: 2 + Math.random() * 4,
        wobble: Math.random() > 0.5 ? 'left' : 'right',
        swayDuration: 4 + Math.random() * 2,
        swayDelay: Math.random() * 2,
        size: 0.7 + Math.random() * 0.4,
        opacity: 0.9,
        color: c.color,
        glow: c.glow,
      });
    }

    return result;
  }, []);

  if (!ramadanMode && !visible) return null;

  return (
    <>
      {/* CSS keyframes injected once */}
      <style>{`
        @keyframes ramadan-fall-left {
          0%   { transform: translateY(-120px) translateX(0px); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(110vh)  translateX(0px); opacity: 1; }
        }
        @keyframes ramadan-fall-right {
          0%   { transform: translateY(-120px) translateX(0px); opacity: 0; }
          10%  { opacity: 1; }
          100% { transform: translateY(110vh)  translateX(0px); opacity: 1; }
        }
        @keyframes ramadan-sway {
          from { transform: rotate(-12deg); }
          to   { transform: rotate(12deg); }
        }
        @keyframes ramadan-twinkle {
          0%, 100% { opacity: 1;   transform: scale(1); }
          50%       { opacity: 0.3; transform: scale(0.6); }
        }
      `}</style>

      {/* Overlay wrapper - pointer-events: none so it doesn't block clicks */}
      <div
        key={animationKey}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          pointerEvents: 'none',
          overflow: 'hidden',
          opacity: visible ? 1 : 0,
          transition: 'opacity 1.2s ease',
        }}
      >
        {/* Subtle golden ambient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at top, rgba(212,175,55,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        {/* Garland rope at top */}
        <div style={{ zIndex: 100000, position: 'relative' }}>
          <GarlandRope />
        </div>

        {/* Falling items */}
        {items.map(item => (
          <FallingItem key={item.id} item={item} />
        ))}
      </div>
    </>
  );
}

