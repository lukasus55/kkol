'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, ChevronRight } from 'lucide-react';
import { SummaryTournament, getTierBadgeClass } from './types';

interface RecentTournamentsCardProps {
  currentUserId: string;
  tournaments: SummaryTournament[];
}

export function RecentTournamentsCard({ currentUserId, tournaments }: RecentTournamentsCardProps) {
  return (
    <div className="w-full bg-bg-200 rounded-md p-5 sm:p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-bg-300">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-white" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
            Moje Rozgrywki
          </h2>
        </div>

        <Link
          href="/dashboard/tournaments"
          className="flex items-center gap-1 text-xs font-semibold text-text-500 hover:text-white transition-colors group"
        >
          <span>Wszystkie</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* List */}
      {tournaments.length === 0 ? (
        <div className="py-8 text-center text-text-500 text-xs sm:text-sm">
          Brak rozegranych turniejów.
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-bg-300">
          {tournaments.slice(0, 5).map((t) => {
            const standings = t.standings || [];
            const userStanding = standings.find(s => s.id === currentUserId);
            const rawPosition = userStanding?.position;
            const hasPosition = rawPosition && rawPosition !== '-' && !isNaN(Number(rawPosition)) && Number(rawPosition) > 0;
            const position = hasPosition ? Number(rawPosition) : null;
            const points = userStanding?.total_points ?? 0;
            const isFirst = position === 1;

            const tierClass = getTierBadgeClass(t.details?.tier);
            const href = t.page_exists && t.page_url ? `/${t.page_url}` : '/dashboard/tournaments';

            return (
              <Link
                key={t.id}
                href={href}
                className="py-2.5 px-2 -mx-2 rounded-md hover:bg-bg-300 transition-colors flex items-center justify-between gap-3 group"
              >
                {/* Left: Name + Tier */}
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-white group-hover:underline truncate">
                      {t.displayed_name}
                    </span>
                    {t.details?.tier && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${tierClass}`}>
                        {t.details.tier}-Tier
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-500 mt-0.5">
                    {t.details?.displayed_date || 'Data nieokreślona'}
                  </span>
                </div>

                {/* Right: User's position & points */}
                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div className="flex flex-col items-end">
                    {position !== null ? (
                      <span className={`text-xs sm:text-sm font-bold ${isFirst ? 'text-amber-400' : 'text-white'}`}>
                        #{position}
                      </span>
                    ) : (
                      <span className="text-xs sm:text-sm font-semibold text-text-500">
                        —
                      </span>
                    )}
                    <span className="text-[11px] text-text-500 font-medium">
                      {t.finished ? `${points} pkt` : 'W trakcie'}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
