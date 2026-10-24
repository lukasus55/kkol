'use client';

import React from 'react';
import { BarChart2 } from 'lucide-react';
import { RankingRow, RankingPlayer } from './RankingRow';

interface RankingTableCardProps {
  leaderboard: RankingPlayer[];
  loading: boolean;
}

export function RankingTableCard({ leaderboard, loading }: RankingTableCardProps) {
  return (
    <div className="w-full bg-bg-200 rounded-md p-3 sm:p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="px-2 sm:px-3 pb-3 mb-1 border-b border-bg-300 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <BarChart2 className="w-5 h-5 text-white" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
            Klasyfikacja Generalna
          </h2>
        </div>
      </div>

      {/* Desktop Column Headers */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-4 px-2 sm:px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-500 border-b border-bg-300">
        <div className="md:col-span-6">Poz. & Gracz</div>
        <div className="md:col-span-2 text-center">S-Score</div>
        <div className="md:col-span-2 text-center">AB-Score</div>
        <div className="md:col-span-2 text-right">Punkty</div>
      </div>

      {/* Rows */}
      {loading ? (
        <div className="flex flex-col divide-y divide-bg-300">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="py-3 px-2 sm:px-3 flex items-center justify-between md:grid md:grid-cols-12 md:gap-4 animate-pulse"
            >
              <div className="md:col-span-6 flex items-center gap-3">
                <div className="w-6 h-4 bg-bg-300 rounded" />
                <div className="w-8 h-8 rounded-full bg-bg-300 shrink-0" />
                <div className="h-4 bg-bg-300 rounded w-28 sm:w-36" />
              </div>
              <div className="hidden md:block md:col-span-2 text-center">
                <div className="h-4 bg-bg-300 rounded w-12 mx-auto" />
              </div>
              <div className="hidden md:block md:col-span-2 text-center">
                <div className="h-4 bg-bg-300 rounded w-12 mx-auto" />
              </div>
              <div className="md:col-span-2 text-right">
                <div className="h-5 bg-bg-300 rounded w-14 ml-auto" />
              </div>
            </div>
          ))}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="py-12 text-center text-text-500 text-sm">
          Brak danych rankingu.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-bg-300">
          {leaderboard.map((player, index) => (
            <RankingRow
              key={player.id}
              player={player}
              position={index + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default RankingTableCard;
