'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, ArrowUpRight, X } from 'lucide-react';
import { TierBadge } from '@/components/ui/TierBadge';
import { Pagination } from '@/components/ui/Pagination';

export interface PlayerTournamentItem {
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
  standings?: {
    id: string;
    position: number | string;
    total_points?: number;
  }[];
}

interface PlayerTournamentsHistoryProps {
  tournaments: PlayerTournamentItem[];
  playerId: string;
  selectedTierFilter: string | null;
  onClearFilter: () => void;
}

const ITEMS_PER_PAGE = 10;

export function PlayerTournamentsHistory({
  tournaments,
  playerId,
  selectedTierFilter,
  onClearFilter,
}: PlayerTournamentsHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTierFilter]);

  // Filter tournaments if a tier is selected (only won tournaments for that tier)
  const filteredTournaments = tournaments.filter((t) => {
    if (!selectedTierFilter) return true;
    const tierMatch = t.details?.tier?.toLowerCase() === selectedTierFilter.toLowerCase();
    const myStanding = t.standings?.find((s) => s.id === playerId);
    return tierMatch && myStanding?.position === 1 && t.finished;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTournaments.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const paginatedTournaments = filteredTournaments.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="w-full bg-bg-200 rounded-md p-3 sm:p-5 flex flex-col justify-between min-h-[780px] md:min-h-[670px] border border-bg-300">
      <div>
        {/* Header */}
        <div className="px-2 sm:px-3 pb-3 mb-1 border-b border-bg-300 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-white" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
              Historia Rozgrywek
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {selectedTierFilter && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-300 text-white font-semibold">
                <span>Filtr: Wygrane {selectedTierFilter.toUpperCase()}-Tier</span>
                <button
                  type="button"
                  onClick={onClearFilter}
                  className="hover:text-red-400 transition-colors"
                  aria-label="Wyczyść filtr"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Column Header */}
        <div className="hidden md:grid md:grid-cols-12 md:gap-4 px-2 sm:px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-500 border-b border-bg-300">
          <div className="md:col-span-6">Turniej</div>
          <div className="md:col-span-3 text-center">Miejsce</div>
          <div className="md:col-span-3 text-right">Data</div>
        </div>

        {/* Tournaments List with min-height to prevent layout shift */}
        {filteredTournaments.length === 0 ? (
          <div className="py-20 text-center text-text-500 text-sm flex items-center justify-center min-h-[420px]">
            Brak turniejów dla wybranego kryterium.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-bg-300 min-h-[440px]">
            {paginatedTournaments.map((t, idx) => {
              const myStanding = t.standings?.find((s) => s.id === playerId);
              const position = myStanding?.position;
              const pageHref = t.page_exists && t.page_url ? `/${t.page_url}` : null;

              return (
                <div
                  key={t.id || idx}
                  className="py-3 px-2 sm:px-3 flex flex-col md:grid md:grid-cols-12 md:gap-4 items-stretch md:items-center justify-between gap-2"
                >
                  {/* Col 1: Tournament Name & Tier */}
                  <div className="flex items-center justify-between md:col-span-6 gap-2 min-w-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {pageHref ? (
                        <Link
                          href={pageHref}
                          className="text-sm font-bold text-white hover:text-accent-500 transition-colors truncate inline-flex items-center gap-1 hover:underline underline-offset-4 group/link"
                        >
                          <span className="truncate">{t.displayed_name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-text-500 group-hover/link:text-white transition-colors shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-sm font-bold text-white truncate">
                          {t.displayed_name}
                        </span>
                      )}
                      <TierBadge tier={t.details?.tier} />
                    </div>

                    {/* Mobile Date */}
                    <span className="md:hidden text-xs text-text-500 shrink-0">
                      {t.details?.displayed_date || 'TBD'}
                    </span>
                  </div>

                  {/* Col 2: Player's Position */}
                  <div className="flex items-center justify-between md:justify-center md:col-span-3 shrink-0">
                    <span className="md:hidden text-xs text-text-500 font-medium">Miejsce:</span>
                    {t.finished && position ? (
                      <span className="text-sm font-semibold text-white">
                        #{position}
                      </span>
                    ) : (
                      <span className="text-xs text-text-500 italic">
                        {t.finished ? '—' : 'W trakcie'}
                      </span>
                    )}
                  </div>

                  {/* Col 3: Date on desktop */}
                  <div className="hidden md:block md:col-span-3 text-right shrink-0">
                    <span className="text-xs sm:text-sm text-text-500 font-medium">
                      {t.details?.displayed_date || 'TBD'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination - pinned at the bottom */}
      {filteredTournaments.length > 0 && (
        <Pagination
          currentPage={safePage}
          totalPages={totalPages}
          totalItems={filteredTournaments.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          className="px-2 sm:px-3 pt-3 mt-2 border-t border-bg-300"
        />
      )}
    </div>
  );
}

export default PlayerTournamentsHistory;
