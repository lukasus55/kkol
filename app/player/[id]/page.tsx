import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { PlayerProfileClient } from './PlayerProfileClient';

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    const [playersRes, tournamentsRes, rankingRes] = await Promise.all([
      fetch(`${baseUrl}/api/players?id=${id}`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/tournaments?player=${id}`, { cache: 'no-store' }),
      fetch(`${baseUrl}/api/ranking?id=${id}`, { cache: 'no-store' })
    ]);

    if (!playersRes.ok || !tournamentsRes.ok || !rankingRes.ok) {
      throw new Error('Failed to fetch data');
    }

    const playerData = await playersRes.json();
    const tournamentsData = await tournamentsRes.json();
    const rankingData = await rankingRes.json();

    const player = playerData[id];

    if (!player) {
      notFound();
    }

    const tournaments = Object.keys(tournamentsData).map(key => tournamentsData[key]);

    // Sort tournaments descending
    tournaments.sort((a, b) => b.details.timestamp - a.details.timestamp);

    const wonTournamentsByTier = { s: [] as string[], a: [] as string[], b: [] as string[], c: [] as string[] };

    tournaments.forEach(t => {
      const standings = t.standings || [];
      const tier = (t.details.tier || '').toLowerCase() as keyof typeof wonTournamentsByTier;

      standings.forEach((standing: any) => {
        if (standing.position === 1 && standing.id === id && t.finished) {
          if (wonTournamentsByTier[tier]) {
            wonTournamentsByTier[tier].push(t.displayed_name);
          }
        }
      });
    });

    const playerRanking = rankingData[0] || { majorRanking: 0, minorRanking: 0, ranking: 0 };

    return (
      <PlayerProfileClient
        player={player}
        tournaments={tournaments}
        ranking={playerRanking}
        wonTournamentsByTier={wonTournamentsByTier}
      />
    );
  } catch (error) {
    console.error(error);
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <div className="text-xl text-red-500 font-bold">Wystąpił błąd podczas ładowania profilu gracza.</div>
      </div>
    );
  }
}
