import React from 'react';

export type TournamentTier = 'S' | 'A' | 'B' | 'C' | 'D' | string;

export interface TierBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tier?: TournamentTier | null;
  size?: 'sm' | 'md';
  showSuffix?: boolean;
}

interface TierVisualTheme {
  textClass: string;
  fill: string;
  stroke: string;
  highlight: string;
  legacyClass: string;
}

const TIER_THEMES: Record<string, TierVisualTheme> = {
  S: {
    textClass: 'text-amber-300',
    fill: '#271b09',
    stroke: '#d97706',
    highlight: '#fde68a',
    legacyClass: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  },
  A: {
    textClass: 'text-purple-300',
    fill: '#20112e',
    stroke: '#9333ea',
    highlight: '#e9d5ff',
    legacyClass: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
  },
  B: {
    textClass: 'text-sky-300',
    fill: '#0c2130',
    stroke: '#0284c7',
    highlight: '#bae6fd',
    legacyClass: 'bg-sky-500/15 text-sky-300 border border-sky-500/30',
  },
  C: {
    textClass: 'text-emerald-300',
    fill: '#0a251d',
    stroke: '#059669',
    highlight: '#a7f3d0',
    legacyClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  },
  D: {
    textClass: 'text-slate-300',
    fill: '#181e26',
    stroke: '#475569',
    highlight: '#cbd5e1',
    legacyClass: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
  },
};

const DEFAULT_THEME: TierVisualTheme = {
  textClass: 'text-text-700',
  fill: '#1c222b',
  stroke: '#2e3744',
  highlight: '#64748b',
  legacyClass: 'bg-bg-300 text-text-700 border border-bg-400',
};

export const getTierBadgeClass = (tierRaw?: string | null): string => {
  if (!tierRaw) return DEFAULT_THEME.legacyClass;
  const tier = tierRaw.toUpperCase().trim();
  return (TIER_THEMES[tier] || DEFAULT_THEME).legacyClass;
};

export function TierBadge({
  tier,
  size = 'sm',
  showSuffix = true,
  className = '',
  ...props
}: TierBadgeProps) {
  if (!tier) return null;

  const cleanTier = tier.toUpperCase().trim();
  const theme = TIER_THEMES[cleanTier] || DEFAULT_THEME;

  const sizeClass =
    size === 'md'
      ? 'text-xs px-3 py-1 min-w-[58px]'
      : 'text-[10px] px-2.5 py-[3px] min-w-[50px]';

  return (
    <span
      className={`relative inline-flex items-center justify-center font-extrabold uppercase tracking-wider shrink-0 select-none ${theme.textClass} ${sizeClass} ${className}`}
      {...props}
    >
      {/* Hextech / Esports SVG Frame */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 80 24"
        fill="none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {/* Main Hexagonal Plate */}
        <path
          d="M 6.5,1.5 L 73.5,1.5 L 78.5,12 L 73.5,22.5 L 6.5,22.5 L 1.5,12 Z"
          fill={theme.fill}
          stroke={theme.stroke}
          strokeWidth="1.25"
          vectorEffect="non-scaling-stroke"
        />

        {/* Top Edge Gleam Highlight */}
        <path
          d="M 18,1.5 L 62,1.5"
          stroke={theme.highlight}
          strokeWidth="1.25"
          strokeOpacity="0.75"
          vectorEffect="non-scaling-stroke"
        />

        {/* Left & Right Inner Hextech Chevrons */}
        <path
          d="M 8.5,6.5 L 5,12 L 8.5,17.5 M 71.5,6.5 L 75,12 L 71.5,17.5"
          stroke={theme.highlight}
          strokeWidth="1"
          strokeOpacity="0.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span className="relative z-10 leading-none">
        {cleanTier}
        {showSuffix ? '-Tier' : ''}
      </span>
    </span>
  );
}

export default TierBadge;
