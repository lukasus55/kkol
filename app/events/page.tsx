'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, ExternalLink } from 'lucide-react';

interface Standing {
  id: string;
  displayed_name: string;
  position: number;
}

interface Tournament {
  id: string;
  displayed_name: string;
  finished: boolean;
  page_exists: boolean;
  page_url?: string;
  details: {
    timestamp: number;
    displayed_date: string;
    tier: string;
  };
  standings?: Standing[];
}

interface Player {
  id: string;
  displayed_name: string;
  pfp_base64?: string;
}

export default function EventsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEventsData() {
      try {
        const [tRes, pRes] = await Promise.all([
          fetch('/api/tournaments'),
          fetch('/api/players')
        ]);

        const tData = await tRes.json();
        const pData = await pRes.json();

        // Convert to array and sort by timestamp descending
        const sortedTournaments = Object.values(tData)
          .map((t: any) => ({
            ...t,
            id: t.id || Math.random().toString(), // fallback if id is missing
          }))
          .sort((a, b) => b.details.timestamp - a.details.timestamp);

        setTournaments(sortedTournaments as Tournament[]);
        setPlayers(pData);
      } catch (err) {
        console.error("Failed to load events data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadEventsData();
  }, []);

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-10 text-text-900 text-center">
        Rozgrywki
      </h1>

      <div className="w-full max-w-5xl">
        <div className="w-full overflow-hidden rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-bg-100 min-w-[580px]">
              <thead>
                <tr className="bg-bg-300 text-text-900 border-b border-bg-400 uppercase text-xs md:text-sm tracking-wide">
                  <th className="py-4 px-4 sm:px-6 font-bold">Nazwa</th>
                  <th className="py-4 px-4 sm:px-6 font-bold w-28">Tier</th>
                  <th className="py-4 px-4 sm:px-6 font-bold w-32">Data</th>
                  <th className="py-4 px-4 sm:px-6 font-bold w-44">Zwycięzca/y</th>
                </tr>
              </thead>
              <tbody className="">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse border-b border-bg-300/40 even:bg-bg-200 odd:bg-bg-100"
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="h-4 bg-bg-300 rounded w-36 sm:w-48" />
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="h-5 bg-bg-300 rounded w-14" />
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="h-4 bg-bg-300 rounded w-20" />
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-bg-300 shrink-0" />
                          <div className="h-4 bg-bg-300 rounded w-24" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  tournaments.map((tournament) => {
                    const isFinished = tournament.finished;
                    let winners: Standing[] = [];

                    if (isFinished && tournament.standings && tournament.standings.length > 0) {
                      const topPosition = tournament.standings[0].position;
                      winners = tournament.standings.filter(s => s.position === topPosition);
                    }

                    return (
                      <tr
                        key={tournament.id || tournament.displayed_name}
                        className="hover:bg-bg-300 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100"
                      >
                        <td className="py-4 px-4 sm:px-6 text-sm font-medium text-text-900">
                          {tournament.page_exists && tournament.page_url ? (
                            <Link
                              href={`/${tournament.page_url}`}
                              className="hover:text-accent-600 transition-colors font-bold flex items-center gap-2 group-hover:underline"
                            >
                              {tournament.displayed_name}
                              <ExternalLink className="w-4 h-4 text-accent-500 opacity-70 group-hover:opacity-100" />
                            </Link>
                          ) : (
                            <span className="font-bold">{tournament.displayed_name || '-'}</span>
                          )}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-sm text-text-700 font-semibold">
                          {tournament.details.tier ? `${tournament.details.tier}-Tier` : '-'}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-sm text-text-500 font-medium">
                          {tournament.details.displayed_date || '-'}
                        </td>

                        <td className="py-4 px-4 sm:px-6 text-sm text-text-900">
                          {!isFinished ? (
                            <span className="text-text-500 italic font-medium">TBD</span>
                          ) : winners.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {winners.map(winner => {
                                const player = players[winner.id];
                                const pfpSrc = player?.pfp_base64
                                  ? `data:image/webp;base64,${player.pfp_base64}`
                                  : '/img/default_pfp.webp';
                                const displayName = player?.displayed_name || winner.displayed_name;

                                return (
                                  <Link
                                    key={winner.id}
                                    href={`/player/${winner.id}`}
                                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                  >
                                    <img
                                      src={pfpSrc}
                                      alt={displayName}
                                      className="w-6 h-6 rounded-full object-cover border border-bg-300"
                                    />
                                    <span className="font-semibold text-text-900 group-hover:text-accent-600 transition-colors">
                                      {displayName}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-text-500">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
                {!loading && tournaments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-500">
                      Brak dostępnych wydarzeń.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
