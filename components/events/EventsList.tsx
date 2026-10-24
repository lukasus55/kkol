'use client';

import React, { useState } from 'react';
import { Trophy } from 'lucide-react';
import { EventListItem, TournamentItem, PlayerData } from './EventListItem';
import { Pagination } from '@/components/ui/Pagination';

interface EventsListProps {
  tournaments: TournamentItem[];
  players: Record<string, PlayerData>;
  loading: boolean;
}

const ITEMS_PER_PAGE = 10;

export function EventsList({ tournaments, players, loading }: EventsListProps) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(tournaments.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedTournaments = tournaments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="w-full bg-bg-200 rounded-md p-3 sm:p-5 flex flex-col justify-between min-h-[780px] md:min-h-[630px]">
      <div>
        {/* Header */}
        <div className="px-2 sm:px-3 pb-3 mb-1 border-b border-bg-300 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-white" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
              Wszystkie Rozgrywki
            </h2>
          </div>
        </div>

        {/* Column Headers on Desktop */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-4 px-2 sm:px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-500 border-b border-bg-300">
          <div className="md:col-span-5">Turniej</div>
          <div className="md:col-span-4">Zwycięzca</div>
          <div className="md:col-span-3 text-right">Data</div>
        </div>

        {/* Content with fixed minimum height to prevent layout shifts */}
        {loading ? (
          <div className="flex flex-col divide-y divide-bg-300 min-h-[520px] md:min-h-[420px]">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="py-2.5 px-2 sm:px-3 flex flex-col md:grid md:grid-cols-12 md:gap-4 items-stretch md:items-center justify-between gap-2 animate-pulse"
              >
                <div className="md:col-span-5 flex items-center gap-2">
                  <div className="h-4 bg-bg-300 rounded w-32 sm:w-44" />
                  <div className="h-4 bg-bg-300 rounded w-12" />
                </div>
                <div className="md:col-span-4 flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-bg-300 shrink-0" />
                  <div className="h-3.5 bg-bg-300 rounded w-24" />
                </div>
                <div className="hidden md:block md:col-span-3 text-right">
                  <div className="h-3.5 bg-bg-300 rounded w-16 ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="py-16 text-center text-text-500 text-sm min-h-[520px] md:min-h-[420px] flex items-center justify-center">
            Brak zarejestrowanych rozgrywek.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-bg-300 min-h-[520px] md:min-h-[420px]">
            {paginatedTournaments.map((tournament) => (
              <EventListItem
                key={tournament.id}
                tournament={tournament}
                players={players}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination - pinned at the bottom */}
      {!loading && tournaments.length > 0 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={tournaments.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={handlePageChange}
          className="px-2 sm:px-3 pt-3 mt-2 border-t border-bg-300"
        />
      )}
    </div>
  );
}

export default EventsList;
