'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

interface RankingPlayer {
  id: string;
  name: string;
  majorRanking: number;
  minorRanking: number;
  ranking: number;
  pfpSrc: string;
}

export default function RankingPage() {
  const [leaderboard, setLeaderboard] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRankingData() {
      try {
        const res = await fetch('/api/ranking');
        const data = await res.json();

        const sortedLeaderboard = Object.values(data)
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            majorRanking: Number(p.majorRanking) || 0,
            minorRanking: Number(p.minorRanking) || 0,
            ranking: Number(p.ranking) || 0,
            pfpSrc: p.pfpSrc || '/img/default_pfp.webp'
          }))
          .sort((a, b) => b.ranking - a.ranking);

        setLeaderboard(sortedLeaderboard);
      } catch (err) {
        console.error("Failed to load ranking data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadRankingData();
  }, []);

  return (
    <div className="min-h-[calc(100vh-60px)] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <h1 className="text-3xl md:text-4xl font-bold uppercase tracking-wider mb-10 text-text-900 text-center">
        Ranking KKOL
      </h1>

      <div className="w-full max-w-5xl">
        <div className="w-full overflow-hidden rounded-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-bg-100 min-w-[640px]">
              <thead>
                <tr className="bg-bg-300 text-text-900 border-b border-bg-400 uppercase text-xs md:text-sm tracking-wide">
                  <th className="py-4 px-4 sm:px-6 font-bold">Nazwa</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-center w-48">S-Score</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-center w-48">AB-Score</th>
                  <th className="py-4 px-4 sm:px-6 font-bold text-right w-36">Ranking</th>
                </tr>
              </thead>
              <tbody className="">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr
                      key={i}
                      className="animate-pulse even:bg-bg-200 odd:bg-bg-100"
                    >
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-bg-300 shrink-0" />
                          <div className="h-4 bg-bg-300 rounded w-28 sm:w-36" />
                        </div>
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="h-4 bg-bg-300 rounded w-12 mx-auto" />
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="h-4 bg-bg-300 rounded w-12 mx-auto" />
                      </td>
                      <td className="py-4 px-4 sm:px-6">
                        <div className="h-4 bg-bg-300 rounded w-14 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : (
                  leaderboard.map((player) => (
                    <tr
                      key={player.id}
                      className="hover:bg-bg-300 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100"
                    >
                      <td className="py-4 px-4 sm:px-6 text-sm font-medium text-text-900">
                        <Link
                          href={`/player/${player.id}`}
                          className="flex items-center gap-3 hover:bg-300 transition-colors font-bold group-hover:underline w-max"
                        >
                          <img
                            src={player.pfpSrc}
                            alt={player.name}
                            className="w-8 h-8 rounded-full object-cover border border-bg-300"
                          />
                          {player.name}
                        </Link>
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-sm font-semibold text-center text-text-700">
                        {player.majorRanking.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-sm font-semibold text-center text-text-700">
                        {player.minorRanking.toFixed(2)}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-sm font-bold text-right text-accent-600">
                        {player.ranking.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
                {!loading && leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-500">
                      Brak danych rankingu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Explainer section */}
        <div className="mt-8 p-6 bg-bg-200 rounded-md border border-bg-200 text-sm text-text-700 leading-relaxed max-w-4xl mx-auto">
          <p className="font-semibold mb-4 text-text-900">
            Wzór na ranking KKOL to suma następujących elementów:
          </p>
          <ul className="list-none space-y-3 mb-4">
            <li className="flex gap-2">
              <span className="text-accent-500 font-bold">-</span>
              <span>
                <strong>S-SCORE:</strong> Średnia z 2 ostatnich (w ujęciu globalnym) turniejów S-Tier (15pkt, 10pkt, 5pkt). Nieobecność na którymś z tych turniejów oznacza 0 punktów wliczanych do średniej (wynik zawsze dzielony przez 2).
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-accent-500 font-bold">-</span>
              <span>
                <strong>AB-SCORE:</strong> Średnia z 3 ostatnich (w ujęciu globalnym) turniejów A-Tier lub B-Tier (7pkt, 4pkt, 1pkt). Podobnie jak wyżej, nieobecność to 0 punktów wliczanych do średniej z 3 turniejów.
              </span>
            </li>
          </ul>
          <p className="text-text-500 italic mt-6">
            W przypadku remisu na danej pozycji w danym turnieju punkty rankingowe za miejsca zajęte ex aequo są sumowane, a następnie dzielone po równo. Kolejne miejsce w klasyfikacji zostaje pominięte o liczbę zawodników biorących udział w remisie.
          </p>
        </div>
      </div>
    </div>
  );
}
