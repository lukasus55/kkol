'use client';

import React from 'react';
import { TierBadge } from '@/components/ui/TierBadge';
import { RankCrestBadge } from './RankCrestBadge';
import { PlayerAvatarCrest } from './PlayerAvatarCrest';

export interface PlayerStats {
  id: string;
  displayed_name: string;
  pfp_base64?: string;
}

export interface PlayerRanking {
  majorRanking: number | string;
  minorRanking: number | string;
  ranking: number | string;
}

interface PlayerSidebarProps {
  player: PlayerStats;
  ranking: PlayerRanking;
  globalRankPosition: number | null;
  lastSTierPosition: number | null;
  wonTournamentsByTier: { s: string[]; a: string[]; b: string[]; c: string[] };
  selectedTierFilter: string | null;
  onSelectTierFilter: (tier: string | null) => void;
}

const BANNER_CLIP_PATH =
  'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 36px), 50% 100%, 0 calc(100% - 36px), 0 8px)';

function formatTitlesCount(count: number): string {
  if (count === 1) return '1 tytuł';
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} tytuły`;
  }
  return `${count} tytułów`;
}

export function PlayerSidebar({
  player,
  ranking,
  globalRankPosition,
  lastSTierPosition,
  wonTournamentsByTier,
  selectedTierFilter,
  onSelectTierFilter,
}: PlayerSidebarProps) {
  const pfpSrc = player.pfp_base64
    ? player.pfp_base64.startsWith('data:image')
      ? player.pfp_base64
      : `data:image/webp;base64,${player.pfp_base64}`
    : '/img/default_pfp.webp';

  const isSTierChampion = lastSTierPosition === 1;
  const isSTierSecond = lastSTierPosition === 2;
  const isSTierThird = lastSTierPosition === 3;

  const tiers = ['s', 'a', 'b', 'c'] as const;

  return (
    /* Outer 1px clipped wrapper so the border follows the diagonal banner edges */
    <div
      className="relative w-full p-[1px] bg-gradient-to-b from-bg-300 via-bg-300 to-bg-400"
      style={{ clipPath: BANNER_CLIP_PATH }}
    >
      <div
        className="relative w-full bg-bg-200 px-6 pt-6 pb-11 flex flex-col items-center overflow-hidden"
        style={{ clipPath: BANNER_CLIP_PATH }}
      >
        {/* Top Hextech Filigree Notch */}
        <div className="w-16 h-[2px] bg-gradient-to-r from-transparent via-bg-400 to-transparent mb-4" />

        {/* Custom Hexagonal SVG Avatar Crest + Overlapping Rank Badge */}
        <div className="relative flex flex-col items-center">
          <PlayerAvatarCrest
            pfpSrc={pfpSrc}
            playerName={player.displayed_name}
            lastSTierPosition={lastSTierPosition}
          />

          {/* Overlapping SVG Ranking Crest Badge (Ad. 4) */}
          <div className="mt-[-12px] relative z-10">
            <RankCrestBadge position={globalRankPosition} />
          </div>
        </div>

        {/* Player Display Name */}
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-3 text-center">
          {player.displayed_name}
        </h1>

        {/* Status note based on last S-Tier */}
        <p className="text-[11px] font-semibold text-text-500 uppercase tracking-wider text-center mt-1">
          {isSTierChampion
            ? 'Mistrz Ostatniego S-Tieru'
            : isSTierSecond
            ? 'Wicemistrz Ostatniego S-Tieru'
            : isSTierThird
            ? 'Podium Ostatniego S-Tieru'
            : 'Uczestnik Rozgrywek KKOL'}
        </p>

        {/* Divider */}
        <div className="w-full h-px bg-bg-300 my-5" />

        {/* Won Tournaments (Titles) - Raw 2x2 layout, full TierBadge + single-line count */}
        <div className="w-full flex flex-col gap-2.5">
          <span className="text-[11px] font-semibold text-text-500 uppercase tracking-wider text-center">
            Wygrane turnieje (tytuły)
          </span>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 mt-0.5">
            {tiers.map((tier) => {
              const count = wonTournamentsByTier[tier]?.length || 0;
              const isSelected = selectedTierFilter === tier;

              return (
                <button
                  key={tier}
                  type="button"
                  onClick={() => onSelectTierFilter(isSelected ? null : tier)}
                  title={`Filtruj wygrane ${tier.toUpperCase()}-Tier`}
                  className={`flex items-center justify-between py-0.5 transition-opacity text-left group ${
                    selectedTierFilter && !isSelected
                      ? 'opacity-45 hover:opacity-85'
                      : 'opacity-100'
                  }`}
                >
                  <TierBadge tier={tier.toUpperCase()} size="sm" />
                  <span
                    className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                      isSelected
                        ? 'text-white underline underline-offset-4'
                        : count > 0
                        ? 'text-white group-hover:text-text-700'
                        : 'text-text-500 group-hover:text-text-700'
                    }`}
                  >
                    {formatTitlesCount(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-bg-300 my-4" />

        {/* Ranking Breakdown (raw on background, white/gray text) */}
        <div className="w-full flex flex-col gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-text-500 font-medium">Ranking KKOL</span>
            <span className="font-bold text-white text-sm">
              {Number(ranking.ranking || 0).toFixed(2)} pkt
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-500 font-medium">S-Score</span>
            <span className="font-semibold text-white">
              {Number(ranking.majorRanking || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-500 font-medium">AB-Score</span>
            <span className="font-semibold text-white">
              {Number(ranking.minorRanking || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Bottom Pennant Tip Ornament */}
        <svg
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-5 pointer-events-none text-bg-400"
          viewBox="0 0 96 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M 8,2 L 48,17 L 88,2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path d="M 48,9 L 51,12 L 48,15 L 45,12 Z" fill="currentColor" />
        </svg>
      </div>
    </div>
  );
}

export default PlayerSidebar;
