'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { TierBadge } from '@/components/ui/TierBadge';

export interface Standing {
  id: string;
  displayed_name: string;
  position: number | string;
}

export interface TournamentItem {
  id: string;
  displayed_name: string;
  page_exists: boolean;
  page_url?: string | null;
  finished: boolean;
  details?: {
    end_date?: string | null;
    displayed_date?: string | null;
    tier?: string | null;
  };
  standings?: Standing[];
}

export interface PlayerData {
  id: string;
  displayed_name: string;
  pfp_base64?: string;
}

interface EventListItemProps {
  tournament: TournamentItem;
  players: Record<string, PlayerData>;
}

export function EventListItem({ tournament, players }: EventListItemProps) {
  const isFinished = tournament.finished;
  const pageExists = tournament.page_exists && Boolean(tournament.page_url);
  const pageHref = pageExists ? `/${tournament.page_url}` : undefined;

  let winners: Standing[] = [];
  if (isFinished && tournament.standings && tournament.standings.length > 0) {
    const topPos = tournament.standings[0].position;
    winners = tournament.standings.filter((s) => s.position === topPos);
  }

  return (
    <div className="py-2.5 px-2 sm:px-3 flex flex-col md:grid md:grid-cols-12 md:gap-4 items-stretch md:items-center justify-between">
      {/* Mobile Top Row / Desktop Col 1: Tournament Name, TierBadge & Link indicator */}
      <div className="flex md:contents items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 md:col-span-5 flex-wrap sm:flex-nowrap">
          {pageHref ? (
            <Link
              href={pageHref}
              className="text-sm font-bold text-white hover:text-accent-500 transition-colors truncate inline-flex items-center gap-1 hover:underline underline-offset-4 group/link"
            >
              <span className="truncate">{tournament.displayed_name}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-text-500 group-hover/link:text-white transition-colors shrink-0" />
            </Link>
          ) : (
            <span className="text-sm font-bold text-white truncate">
              {tournament.displayed_name}
            </span>
          )}
          <TierBadge tier={tournament.details?.tier} />
        </div>

        {/* Mobile-only Date on top right */}
        <div className="md:hidden shrink-0 text-right">
          <span className="text-xs text-text-500 font-medium">
            {tournament.details?.displayed_date || 'TBD'}
          </span>
        </div>
      </div>

      {/* Desktop Col 2 / Mobile Bottom: Winner(s) */}
      <div className="mt-1 md:mt-0 md:col-span-4 flex items-center gap-2 flex-wrap min-w-0">
        {isFinished && winners.length > 0 ? (
          winners.map((winner) => {
            const player = players[winner.id];
            const pfpSrc = player?.pfp_base64
              ? `data:image/webp;base64,${player.pfp_base64}`
              : '/img/default_pfp.webp';
            const displayName = player?.displayed_name || winner.displayed_name;

            return (
              <Link
                key={winner.id}
                href={`/player/${winner.id}`}
                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity"
              >
                <img
                  src={pfpSrc}
                  alt={displayName}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
                <span className="text-xs text-text-700 hover:text-white truncate max-w-[130px] sm:max-w-[180px]">
                  {displayName}
                </span>
              </Link>
            );
          })
        ) : (
          <span className="text-xs text-text-500 italic">
            Brak zwycięzcy
          </span>
        )}
      </div>

      {/* Desktop Col 3: Date */}
      <div className="hidden md:block md:col-span-3 text-right shrink-0">
        <span className="text-xs sm:text-sm text-text-500 font-medium">
          {tournament.details?.displayed_date || 'TBD'}
        </span>
      </div>
    </div>
  );
}

export default EventListItem;
