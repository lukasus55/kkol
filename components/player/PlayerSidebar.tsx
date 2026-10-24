'use client';

import React from 'react';
import { Crown, Trophy } from 'lucide-react';
import { TierBadge } from '@/components/ui/TierBadge';

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

  // Frame ring based on last finished S-Tier placement
  const frameRingClass = isSTierChampion
    ? 'p-[3px] bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-500'
    : isSTierSecond
    ? 'p-[3px] bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-300'
    : isSTierThird
    ? 'p-[3px] bg-gradient-to-tr from-amber-800 via-amber-600 to-amber-700'
    : 'p-[2px] bg-bg-400 border border-bg-300';

  const rankBadge = globalRankPosition !== null ? (
    globalRankPosition === 1 ? (
      <div className="inline-flex items-center px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-bg-100 font-extrabold text-xs border border-yellow-200 uppercase tracking-wider">
        <span>#1 W RANKINGU</span>
      </div>
    ) : (
      <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-bg-300 text-white font-bold text-xs border border-bg-400">
        <span>#{globalRankPosition} W RANKINGU</span>
      </div>
    )
  ) : null;

  const tiers = ['s', 'a', 'b', 'c'] as const;
  const totalTitles = tiers.reduce(
    (acc, t) => acc + (wonTournamentsByTier[t]?.length || 0),
    0
  );

  return (
    <div className="relative w-full bg-bg-200 rounded-md p-6 flex flex-col items-center overflow-hidden border border-bg-300">
      {/* Subtle ambient lighting behind avatar */}
      <div
        className={`absolute -top-16 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 ${
          isSTierChampion
            ? 'bg-amber-400'
            : isSTierSecond
            ? 'bg-slate-200'
            : isSTierThird
            ? 'bg-amber-700'
            : 'bg-sky-500'
        }`}
      />

      {/* Top filigree decorative bar */}
      <div className="w-12 h-1 bg-gradient-to-r from-transparent via-bg-400 to-transparent mb-5" />

      {/* Avatar Container with S-Tier Placement Frame */}
      <div className="relative flex flex-col items-center">
        {isSTierChampion && (
          <div className="absolute -top-4 z-20 text-amber-400 drop-shadow-md animate-bounce">
            <Crown className="w-6 h-6 fill-amber-400" />
          </div>
        )}

        <div className={`rounded-full relative ${frameRingClass}`}>
          <img
            src={pfpSrc}
            alt={player.displayed_name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover"
          />
        </div>

        {/* Overlapping Ranking Position Badge */}
        <div className="mt-[-12px] relative z-10">{rankBadge}</div>
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

      {/* Won Tournaments (Titles) Summary */}
      <div className="w-full flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs px-0.5">
          <span className="text-[11px] font-semibold text-text-500 uppercase tracking-wider">
            Wygrane turnieje
          </span>
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {totalTitles} {totalTitles === 1 ? 'tytuł' : totalTitles < 5 && totalTitles > 1 ? 'tytuły' : 'tytułów'}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mt-0.5">
          {tiers.map((tier) => {
            const count = wonTournamentsByTier[tier]?.length || 0;
            const isSelected = selectedTierFilter === tier;

            return (
              <button
                key={tier}
                type="button"
                onClick={() => onSelectTierFilter(isSelected ? null : tier)}
                title={`Filtruj wygrane ${tier.toUpperCase()}-Tier`}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-md transition-colors border ${
                  isSelected
                    ? 'bg-bg-300 border-white text-white'
                    : count > 0
                    ? 'bg-bg-150 border-bg-300 hover:border-bg-400 text-white'
                    : 'bg-bg-100 border-transparent opacity-60 hover:opacity-100 hover:bg-bg-150'
                }`}
              >
                <TierBadge
                  tier={tier.toUpperCase()}
                  size="sm"
                  showSuffix={false}
                  className="w-5 h-5 flex items-center justify-center p-0 text-[11px] font-black"
                />
                <span className={`text-sm font-bold mt-1 ${count > 0 ? 'text-white' : 'text-text-500'}`}>
                  {count}
                </span>
                <span className="text-[9px] text-text-500 uppercase font-semibold">
                  {count === 1 ? 'Tytuł' : 'Tytuły'}
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
    </div>
  );
}

export default PlayerSidebar;
