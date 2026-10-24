'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export interface RankingPlayer {
  id: string;
  name: string;
  majorRanking: number;
  minorRanking: number;
  ranking: number;
  pfpSrc: string;
}

interface RankingRowProps {
  player: RankingPlayer;
  position: number;
}

export function RankingRow({ player, position }: RankingRowProps) {
  const isFirst = position === 1;
  const isSecond = position === 2;
  const isThird = position === 3;

  const positionColor = isFirst
    ? 'text-amber-400 font-extrabold'
    : isSecond
      ? 'text-slate-300 font-bold'
      : isThird
        ? 'text-amber-600 font-bold'
        : 'text-text-500 font-semibold';

  return (
    <div className="py-3 px-2 sm:px-3 flex flex-col md:grid md:grid-cols-12 md:gap-4 items-stretch md:items-center justify-between gap-2">
      {/* Mobile Top Row / Desktop Col 1: Position + Player */}
      <div className="flex md:contents items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 md:col-span-6">
          {/* Position Number */}
          <span className={`w-6 text-center text-sm sm:text-base shrink-0 ${positionColor}`}>
            #{position}
          </span>

          {/* Player Info & Link */}
          <Link
            href={`/player/${player.id}`}
            className="flex items-center gap-2.5 min-w-0 group/player"
          >
            <img
              src={player.pfpSrc}
              alt={player.name}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 border border-bg-300"
            />
            <span className="text-sm sm:text-base font-bold text-white group-hover/player:text-slate-200 group-hover/player:underline underline-offset-4 transition-colors truncate">
              {player.name}
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-text-500 group-hover/player:text-white transition-colors shrink-0 hidden sm:block" />
          </Link>
        </div>

        {/* Mobile Total Score on the right */}
        <div className="md:hidden shrink-0 text-right">
          <span className={`text-base font-extrabold ${isFirst ? 'text-amber-400' : 'text-white'}`}>
            {player.ranking.toFixed(2)}
          </span>
          <span className="text-xs text-text-500 ml-1">pkt</span>
        </div>
      </div>

      {/* Desktop Col 2 / Mobile Breakdown: S-Score */}
      <div className="md:col-span-2 text-left md:text-center shrink-0">
        <div className="flex md:inline-flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="md:hidden text-text-500 font-medium">S-Score:</span>
          <span className="font-semibold text-text-700">
            {player.majorRanking.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Desktop Col 3 / Mobile Breakdown: AB-Score */}
      <div className="md:col-span-2 text-left md:text-center shrink-0">
        <div className="flex md:inline-flex items-center gap-1.5 text-xs sm:text-sm">
          <span className="md:hidden text-text-500 font-medium">AB-Score:</span>
          <span className="font-semibold text-text-700">
            {player.minorRanking.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Desktop Col 4: Total Score */}
      <div className="hidden md:block md:col-span-2 text-right shrink-0">
        <span className={`text-base sm:text-lg font-extrabold ${isFirst ? 'text-amber-400' : 'text-white'}`}>
          {player.ranking.toFixed(2)}
        </span>
        <span className="text-xs text-text-500 font-medium ml-1">pkt</span>
      </div>
    </div>
  );
}

export default RankingRow;
