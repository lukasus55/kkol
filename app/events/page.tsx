'use client';

import React, { useEffect, useState } from 'react';
import { SeasonBanner } from '@/components/events/SeasonBanner';
import { EventsList } from '@/components/events/EventsList';
import { TournamentItem, PlayerData } from '@/components/events/EventListItem';
import PageFooter from '@/components/ui/PageFooter';

export default function EventsPage() {
  const [tournaments, setTournaments] = useState<TournamentItem[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerData>>({});
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

        const list = Object.values(tData || {}).map((t: any) => ({
          ...t,
          id: t.id || Math.random().toString()
        })) as TournamentItem[];

        setTournaments(list);
        setPlayers(pData || {});
      } catch (err) {
        console.error('Failed to load events data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadEventsData();
  }, []);

  const getSeasonWinner = (year: string) => {
    const tournament = tournaments.find(
      (t) =>
        t.page_url === year ||
        t.id === `kol${year}` ||
        t.displayed_name?.toLowerCase().includes(`sezon ${year}`) ||
        t.displayed_name?.toLowerCase().includes(`kol ${year}`)
    );

    if (tournament?.finished && tournament.standings && tournament.standings.length > 0) {
      const topPos = tournament.standings[0].position;
      const winnerStanding = tournament.standings.find((s) => s.position === topPos);
      if (winnerStanding) {
        const player = players[winnerStanding.id];
        return {
          name: player?.displayed_name || winnerStanding.displayed_name,
          pfpSrc: player?.pfp_base64
            ? `data:image/webp;base64,${player.pfp_base64}`
            : '/img/default_pfp.webp'
        };
      }
    }

    if (year === '2025') {
      const player = Object.values(players).find((p) => p.displayed_name?.toLowerCase() === 'kostyś');
      return {
        name: 'Kostyś',
        pfpSrc: player?.pfp_base64 ? `data:image/webp;base64,${player.pfp_base64}` : '/img/default_pfp.webp'
      };
    }

    if (year === '2024') {
      const player = Object.values(players).find(
        (p) => p.displayed_name?.toLowerCase().includes('harnas') || p.displayed_name?.toLowerCase().includes('harnold')
      );
      return {
        name: player?.displayed_name || 'Harnoldihno',
        pfpSrc: player?.pfp_base64 ? `data:image/webp;base64,${player.pfp_base64}` : '/img/default_pfp.webp'
      };
    }

    return null;
  };

  return (
    <>
      <main className="min-h-[calc(100vh-60px)] flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-4xl flex flex-col gap-6">
          {/* Page Header */}
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white">
              Rozgrywki
            </h1>
            <p className="text-xs sm:text-sm text-text-500">
              Przeglądaj pełną historię turniejów, wydarzeń oraz oficjalnych mistrzostw Karwińskiej Olimpiady.
            </p>
          </div>

          <SeasonBanner
            year="2026"
            url="/2026"
            image="/img/home/events/kol2026.webp"
            winner={getSeasonWinner('2026')}
            isCurrent
          />

          <EventsList
            tournaments={tournaments}
            players={players}
            loading={loading}
          />

          <div className="flex flex-col gap-4">
            <SeasonBanner
              year="2025"
              url="/2025"
              image="/img/home/events/kol2025.webp"
              winner={getSeasonWinner('2025')}
            />
            <SeasonBanner
              year="2024"
              url="/2024"
              image="/img/home/events/kol2024.webp"
              winner={getSeasonWinner('2024')}
            />
          </div>


        </div>
      </main>
      <PageFooter />
    </>
  );
}
