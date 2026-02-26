import React, { useId } from 'react';

interface SessionlyLogoProps {
  /** Icon size in pixels */
  size?: number;
  /** Show the "Sessionly" wordmark next to the icon */
  showWordmark?: boolean;
  /** Override wordmark font size in px (defaults to size * 0.58) */
  wordmarkSize?: number;
  /** Additional CSS classes for the outer container */
  className?: string;
  /** Additional CSS classes for the wordmark text */
  wordmarkClassName?: string;
}

export function SessionlyLogo({
  size = 32,
  showWordmark = false,
  wordmarkSize,
  className = '',
  wordmarkClassName = '',
}: SessionlyLogoProps) {
  const uid = useId();
  const bgId = `sl-bg${uid}`;
  const sId = `sl-s${uid}`;
  const shadowId = `sl-sh${uid}`;
  const computedWordmarkSize = wordmarkSize || Math.round(size * 0.58);

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        role="img"
        aria-label="Sessionly logo"
        className="flex-shrink-0"
      >
        <defs>
          {/* Warm terracotta gradient — top-left highlight to bottom-right depth */}
          <linearGradient
            id={bgId}
            x1="4"
            y1="4"
            x2="44"
            y2="44"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#D4926E" />
            <stop offset="0.5" stopColor="#C17A5A" />
            <stop offset="1" stopColor="#A3613F" />
          </linearGradient>

          {/* S stroke gradient — crisp white that warms into gold */}
          <linearGradient
            id={sId}
            x1="24"
            y1="8"
            x2="24"
            y2="42"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#FFFFFF" />
            <stop offset="0.55" stopColor="#F5F0E8" />
            <stop offset="1" stopColor="#D4A853" />
          </linearGradient>

          {/* Subtle drop shadow for the S */}
          <filter id={shadowId} x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#1A1814" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* ---- Base shape ---- */}
        <rect width="48" height="48" rx="12" fill={`url(#${bgId})`} />

        {/* Top-left inner highlight — premium glass effect */}
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="11"
          stroke="white"
          strokeOpacity="0.14"
          strokeWidth="0.75"
        />

        {/* ---- Subtle journal details ---- */}

        {/* Margin line — faint nod to ruled notebook */}
        <line
          x1="13"
          y1="9"
          x2="13"
          y2="39"
          stroke="white"
          strokeOpacity="0.07"
          strokeWidth="0.6"
        />

        {/* ---- The "S" letterform ---- */}
        {/*
          Two smooth cubic bezier arcs that form a flowing,
          calligraphic S — like a pen stroke on paper.
          Upper bowl opens right, lower bowl opens left.
        */}
        <path
          d="
            M 30.5 13.5
            C 26 8.5, 15.5 9.5, 15.5 15.5
            C 15.5 19.5, 19.5 22, 24 24
            C 28.5 26, 32.5 28.5, 32.5 33
            C 32.5 38.5, 22 39, 17.5 34.5
          "
          stroke={`url(#${sId})`}
          strokeWidth="3.4"
          strokeLinecap="round"
          fill="none"
          filter={`url(#${shadowId})`}
        />

        {/* Thin secondary echo stroke for calligraphic depth */}
        <path
          d="
            M 30.5 13.5
            C 26 8.5, 15.5 9.5, 15.5 15.5
            C 15.5 19.5, 19.5 22, 24 24
            C 28.5 26, 32.5 28.5, 32.5 33
            C 32.5 38.5, 22 39, 17.5 34.5
          "
          stroke="white"
          strokeWidth="0.6"
          strokeLinecap="round"
          strokeOpacity="0.3"
          fill="none"
        />

        {/* ---- Golden pen-nib accent ---- */}
        {/* 
          A small golden teardrop near the S origin —  
          like a drop of ink or a Moleskine-style foil stamp.
        */}
        <circle cx="33" cy="11" r="2" fill="#D4A853" opacity="0.85" />
        <circle cx="33" cy="11" r="0.8" fill="#EDD9A3" opacity="0.6" />
      </svg>

      {showWordmark && (
        <span
          className={`text-foreground ${wordmarkClassName}`}
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: `${computedWordmarkSize}px`,
            letterSpacing: '-0.01em',
          }}
        >
          Sessionly
        </span>
      )}
    </div>
  );
}
