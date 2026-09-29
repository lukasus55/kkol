'use client';

import React from 'react';
import { Trophy, Award, Flag } from 'lucide-react';
import { SummaryStats } from './types';

interface PlayerHeaderCardProps {
  user: any;
  rank: number | null;
  totalPoints: string | null;
  stats: SummaryStats;
}

export function PlayerHeaderCard({ user, rank, totalPoints, stats }: PlayerHeaderCardProps) {
  const pfpSrc = user?.pfp_base64
    ? `data:image/webp;base64,${user.pfp_base64}`
    : '/img/default_pfp.webp';

  const roleLabels: Record<string, string> = {
    admin: 'Administrator',
    organizer: 'Organizator',
    player: 'Gracz'
  };

  return (
    <div className="w-full bg-bg-200 rounded-md p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* User profile info */}
      <div className="flex items-center gap-3.5 min-w-0">
        <img
          src={pfpSrc}
          alt={user?.displayed_name || 'Gracz'}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover shrink-0 border border-bg-300"
        />
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg sm:text-xl font-bold text-white truncate max-w-full">
              {user?.displayed_name}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-bg-300 text-text-700 tracking-wide uppercase shrink-0">
              {roleLabels[user?.role] || user?.role || 'Gracz'}
            </span>
          </div>
          <span className="text-xs text-text-500 mt-0.5 truncate">
            @{user?.id}
          </span>
        </div>
      </div>

      {/* Quick stats pills */}
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-100 text-xs">
          <Award className="w-3.5 h-3.5 text-text-500 shrink-0" />
          <span className="text-text-500">Rank:</span>
          <span className="font-bold text-white">{rank ? `#${rank}` : '-'}</span>
          {totalPoints && <span className="text-text-500 font-medium">({totalPoints} pkt)</span>}
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-100 text-xs">
          <Trophy className="w-3.5 h-3.5 text-text-500 shrink-0" />
          <span className="text-text-500">Wygrane:</span>
          <span className="font-bold text-white">{stats.wins}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-bg-100 text-xs">
          <Flag className="w-3.5 h-3.5 text-text-500 shrink-0" />
          <span className="text-text-500">Rozegrane:</span>
          <span className="font-bold text-white">{stats.totalPlayed}</span>
        </div>
      </div>
    </div>
  );
}
