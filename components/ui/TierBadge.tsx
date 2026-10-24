import React from 'react';

export type TournamentTier = 'S' | 'A' | 'B' | 'C' | 'D' | string;

export interface TierBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tier?: TournamentTier | null;
  size?: 'sm' | 'md';
  showSuffix?: boolean;
}

export const getTierBadgeClass = (tierRaw?: string | null): string => {
  if (!tierRaw) return 'bg-bg-300 text-text-700 border border-bg-400';
  const tier = tierRaw.toUpperCase().trim();

  switch (tier) {
    case 'S':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    case 'A':
      return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
    case 'B':
      return 'bg-sky-500/15 text-sky-300 border border-sky-500/30';
    case 'C':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    case 'D':
      return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
    default:
      return 'bg-bg-300 text-text-700 border border-bg-400';
  }
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
  const colorClass = getTierBadgeClass(cleanTier);
  const sizeClass = size === 'md'
    ? 'text-xs px-2 py-0.5'
    : 'text-[10px] px-1.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center justify-center font-bold uppercase tracking-wider rounded shrink-0 select-none transition-colors ${colorClass} ${sizeClass} ${className}`}
      {...props}
    >
      {cleanTier}{showSuffix ? '-Tier' : ''}
    </span>
  );
}

export default TierBadge;
