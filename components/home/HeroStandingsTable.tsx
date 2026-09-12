'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronRight } from 'lucide-react';

interface Standing {
  id: string;
  displayed_name: string;
  position: number | string;
  total_points: number;
}

interface EventResultItem {
  event_id: number;
  event_name: string;
  is_major_event: boolean;
  results: {
    player_id: string;
    displayed_name: string;
    position: number | null;
    points: number | string | null;
  }[];
}

interface PlayerInfo {
  id: string;
  displayed_name: string;
  pfp_base64?: string;
}

export default function HeroStandingsTable() {
  const router = useRouter();
  const [standings, setStandings] = useState<Standing[]>([]);
  const [events, setEvents] = useState<EventResultItem[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerInfo>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [tRes, eRes, pRes, meRes] = await Promise.all([
          fetch('/api/tournaments?id=kol2026'),
          fetch('/api/event_results?tournament=kol2026&major=true'),
          fetch('/api/players'),
          fetch('/api/me').catch(() => null)
        ]);

        const tData = await tRes.json();
        const eData = await eRes.json();
        const pData = await pRes.json();
        if (meRes && meRes.ok) {
          const meData = await meRes.json();
          if (meData?.user?.id) {
            setCurrentUserId(meData.user.id);
          }
        }

        const tournament = tData['kol2026'];
        if (tournament?.standings) {
          setStandings(tournament.standings);
        }
        if (Array.isArray(eData)) {
          setEvents(eData);
        }
        setPlayers(pData || {});
      } catch (err) {
        console.error('Failed to load hero standings data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return (
    <div className="w-full bg-bg-200 rounded-md p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-bg-300">
          <div className="flex items-center gap-2.5">
            <img src="/img/season_icon.webp" alt="Sezon 2026" className="w-5 h-5 object-contain" />
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
              Sezon 2026
            </h2>
          </div>

          <Link
            href="/2026"
            className="flex items-center gap-1 text-xs font-semibold text-text-500 hover:text-white transition-colors group"
          >
            <span>Szczegóły</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-text-500 animate-spin" />
          </div>
        ) : standings.length === 0 ? (
          <div className="py-8 text-center text-text-500 text-sm">
            Brak danych tabeli dla sezonu 2026.
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left text-sm border-collapse table-fixed">
              <thead>
                <tr className="text-xs text-text-500 uppercase tracking-wider border-b border-bg-300 pb-2">
                  <th className="py-2 px-1 text-center w-7 sm:w-8">#</th>
                  <th className="py-2 px-2 sm:px-3 font-semibold text-text-700">Gracz</th>
                  {events.map((ev, i) => (
                    <th key={ev.event_id} className="py-2 px-2 text-center font-semibold text-text-700 hidden sm:table-cell w-10" title={ev.event_name}>
                      G{i + 1}
                    </th>
                  ))}
                  <th className="py-2 px-1 sm:px-3 text-right font-semibold text-text-700 w-12 sm:w-16">Pkt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-300">
                {standings.map((player) => {
                  const pData = players[player.id];
                  const pfpSrc = pData?.pfp_base64
                    ? `data:image/webp;base64,${pData.pfp_base64}`
                    : '/img/default_pfp.webp';
                  const isCurrentLoggedInUser = currentUserId === player.id;

                  return (
                    <tr
                      key={player.id}
                      onClick={() => router.push(`/player/${player.id}`)}
                      className={`transition-colors cursor-pointer group ${isCurrentLoggedInUser
                          ? 'bg-bg-300/60 hover:bg-bg-300/90 font-semibold text-white'
                          : 'hover:bg-bg-300/40 text-text-900'
                        }`}
                    >
                      {/* Position */}
                      <td className={`py-2 px-1 text-center font-bold text-xs ${isCurrentLoggedInUser ? 'text-white' : 'text-text-500'
                        }`}>
                        {player.position}
                      </td>

                      {/* Player info */}
                      <td className="py-2 px-2 sm:px-3 overflow-hidden">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={pfpSrc}
                            alt={player.displayed_name}
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shrink-0"
                          />
                          <span className={`transition-colors truncate block flex-1 text-xs sm:text-sm ${isCurrentLoggedInUser
                              ? 'text-white font-bold underline decoration-white/40 underline-offset-2 group-hover:text-slate-100'
                              : 'text-white group-hover:text-text-500'
                            }`}>
                            {player.displayed_name}
                          </span>
                        </div>
                      </td>

                      {/* Event points */}
                      {events.map((ev) => {
                        const pEv = ev.results?.find((r) => r.player_id === player.id);
                        const points = (pEv?.points === null || pEv?.points === undefined)
                          ? '-'
                          : Number.parseFloat(String(pEv.points)).toFixed(0);

                        return (
                          <td
                            key={ev.event_id}
                            className={`py-2 px-2 text-center text-xs hidden sm:table-cell ${isCurrentLoggedInUser ? 'text-text-800' : 'text-text-500'
                              }`}
                          >
                            {points}
                          </td>
                        );
                      })}

                      {/* Total points */}
                      <td className="py-2 px-1 sm:px-3 text-right font-bold text-white text-xs sm:text-sm">
                        {player.total_points}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
