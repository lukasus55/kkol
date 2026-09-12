'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Trophy, ChevronRight, Loader2 } from 'lucide-react';

interface Standing {
  id: string;
  displayed_name: string;
  position: number | string;
}

interface Tournament {
  id: string;
  displayed_name: string;
  page_exists: boolean;
  page_url?: string | null;
  finished: boolean;
  details: {
    end_date?: string | null;
    displayed_date?: string | null;
    tier?: string | null;
  };
  standings?: Standing[];
}

interface Player {
  id: string;
  displayed_name: string;
  pfp_base64?: string;
}

export default function HeroEventsWidget() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tRes, pRes] = await Promise.all([
          fetch('/api/tournaments?limit=20'),
          fetch('/api/players')
        ]);
        const tData = await tRes.json();
        const pData = await pRes.json();

        const list = Object.values(tData) as Tournament[];
        setTournaments(list.slice(0, 5));
        setPlayers(pData || {});
      } catch (err) {
        console.error('Failed to load tournaments for hero widget:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const getTierBadge = (tierRaw?: string | null) => {
    if (!tierRaw) return null;
    const tier = tierRaw.toUpperCase();

    switch (tier) {
      case 'S':
        return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
      case 'A':
        return 'bg-purple-500/15 text-purple-300 border border-purple-500/30';
      case 'B':
        return 'bg-sky-500/15 text-sky-300 border border-sky-500/30';
      case 'C':
        return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
      default:
        return 'bg-bg-300 text-text-700';
    }
  };

  return (
    <div className="w-full bg-bg-200 rounded-md p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header: without secondary subtitle */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-bg-300">
          <div className="flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-white" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
              Rozgrywki
            </h2>
          </div>

          <Link
            href="/events"
            className="flex items-center gap-1 text-xs font-semibold text-text-500 hover:text-white transition-colors group"
          >
            <span>Wszystkie</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Tournaments List */}
        {loading ? (
          <div className="flex flex-col divide-y divide-bg-300">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="py-3 px-3 -mx-3 flex items-center justify-between gap-3 animate-pulse"
              >
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-bg-300 rounded w-28 sm:w-36" />
                    <div className="h-4 bg-bg-300 rounded w-12" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-4 h-4 rounded-full bg-bg-300 shrink-0" />
                    <div className="h-3 bg-bg-300 rounded w-20" />
                  </div>
                </div>
                <div className="h-3.5 bg-bg-300 rounded w-16 shrink-0" />
              </div>
            ))}
          </div>
        ) : tournaments.length === 0 ? (
          <div className="py-8 text-center text-text-500 text-sm">
            Brak zarejestrowanych rozgrywek.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-bg-300">
            {tournaments.map((t) => {
              const isFinished = t.finished;
              let winner: Standing | null = null;
              if (isFinished && t.standings && t.standings.length > 0) {
                const topPos = t.standings[0].position;
                winner = t.standings.find((s) => s.position === topPos) || t.standings[0];
              }

              const winnerPlayer = winner ? players[winner.id] : null;
              const winnerPfp = winnerPlayer?.pfp_base64
                ? `data:image/webp;base64,${winnerPlayer.pfp_base64}`
                : '/img/default_pfp.webp';

              const tournamentHref = t.page_exists && t.page_url ? `/${t.page_url}` : '/events';
              const tierClass = getTierBadge(t.details?.tier);

              return (
                <Link
                  key={t.id}
                  href={tournamentHref}
                  className="py-3 px-3 -mx-3 rounded-md hover:bg-bg-300 transition-colors duration-150 flex items-center justify-between gap-3 group cursor-pointer"
                >
                  {/* Left: Tournament name + Tier, and Winner underneath */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white group-hover:text-slate-100 transition-colors truncate">
                        {t.displayed_name}
                      </span>
                      {t.details?.tier && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 transition-colors ${tierClass}`}>
                          {t.details.tier}-Tier
                        </span>
                      )}
                    </div>

                    {/* Winner underneath name */}
                    <div className="mt-0.5">
                      {isFinished && winner ? (
                        <div className="flex items-center gap-1.5">
                          <img
                            src={winnerPfp}
                            alt={winner.displayed_name}
                            className="w-4 h-4 rounded-full object-cover"
                          />
                          <span className="text-xs text-text-700 truncate max-w-[130px] sm:max-w-[160px]">
                            {winner.displayed_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-text-500 italic">
                          Brak zwycięzcy
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Date or TBD status */}
                  <div className="flex items-center gap-2 shrink-0 text-right">
                    {t.details?.displayed_date ? (
                      <span className="text-xs text-text-500">
                        {t.details.displayed_date}
                      </span>
                    ) : (
                      <span className="text-xs text-text-500 font-medium tracking-wide">
                        TBD
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
