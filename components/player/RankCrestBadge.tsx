import React from 'react';

interface RankCrestBadgeProps {
  position: number | null;
}

interface CrestPalette {
  wingFill: string;
  wingStroke: string;
  outerPlate: string;
  outerStroke: string;
  innerPlate: string;
  innerHairline: string;
  gemColor: string;
  textClass: string;
}

const PALETTES: Record<'gold' | 'silver' | 'bronze' | 'steel', CrestPalette> = {
  gold: {
    wingFill: '#78350f',
    wingStroke: '#f59e0b',
    outerPlate: '#d97706',
    outerStroke: '#fde68a',
    innerPlate: '#17120a',
    innerHairline: '#f59e0b',
    gemColor: '#fde68a',
    textClass: 'text-amber-200',
  },
  silver: {
    wingFill: '#334155',
    wingStroke: '#cbd5e1',
    outerPlate: '#64748b',
    outerStroke: '#f1f5f9',
    innerPlate: '#12171f',
    innerHairline: '#94a3b8',
    gemColor: '#f1f5f9',
    textClass: 'text-slate-100',
  },
  bronze: {
    wingFill: '#451a03',
    wingStroke: '#d97706',
    outerPlate: '#92400e',
    outerStroke: '#fbbf24',
    innerPlate: '#17110b',
    innerHairline: '#b45309',
    gemColor: '#fcd34d',
    textClass: 'text-amber-300',
  },
  steel: {
    wingFill: '#1c232d',
    wingStroke: '#475569',
    outerPlate: '#2a3340',
    outerStroke: '#64748b',
    innerPlate: '#12161d',
    innerHairline: '#384454',
    gemColor: '#94a3b8',
    textClass: 'text-white',
  },
};

export function RankCrestBadge({ position }: RankCrestBadgeProps) {
  if (position === null) return null;

  const palette =
    position === 1
      ? PALETTES.gold
      : position === 2
      ? PALETTES.silver
      : position === 3
      ? PALETTES.bronze
      : PALETTES.steel;

  return (
    <div className="relative inline-flex items-center justify-center px-6 py-1.5 select-none">
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 40"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Left & Right Hextech Wing Fins */}
        <path
          d="M 3,19 L 14,9 L 25,9 L 19,29 L 10,29 Z M 197,19 L 186,9 L 175,9 L 181,29 L 190,29 Z"
          fill={palette.wingFill}
          stroke={palette.wingStroke}
          strokeWidth="1.2"
        />

        {/* Outer Metallic Shield Bevel */}
        <path
          d="M 21,4.5 L 179,4.5 L 190,19 L 179,32 L 100,37.5 L 21,32 L 10,19 Z"
          fill={palette.outerPlate}
          stroke={palette.outerStroke}
          strokeWidth="1.4"
        />

        {/* Inner Dark Obsidian Plate */}
        <path
          d="M 24,7 L 176,7 L 185.5,19 L 176,29.5 L 100,34.5 L 24,29.5 L 14.5,19 Z"
          fill={palette.innerPlate}
        />

        {/* Inner Filigree Hairline */}
        <path
          d="M 27.5,9.5 L 172.5,9.5 L 181,19 L 172.5,27.5 L 100,32 L 27.5,27.5 L 19,19 Z"
          stroke={palette.innerHairline}
          strokeWidth="0.9"
          strokeOpacity="0.65"
        />

        {/* Top Center Gleam Bar */}
        <path
          d="M 68,4.5 L 132,4.5"
          stroke={palette.gemColor}
          strokeWidth="2"
        />

        {/* Side Hextech Diamond Rivets */}
        <path
          d="M 25,16.5 L 27.8,19 L 25,21.5 L 22.2,19 Z M 175,16.5 L 177.8,19 L 175,21.5 L 172.2,19 Z"
          fill={palette.gemColor}
        />

        {/* Bottom Center Point Accent */}
        <path
          d="M 93,31.5 L 100,35 L 107,31.5"
          stroke={palette.gemColor}
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>

      <span
        className={`relative z-10 text-[11px] font-extrabold uppercase tracking-wider leading-none pb-[1px] ${palette.textClass}`}
      >
        #{position} W RANKINGU
      </span>
    </div>
  );
}

export default RankCrestBadge;
