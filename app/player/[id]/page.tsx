import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import type { Metadata, ResolvingMetadata } from 'next';
import { PlayerProfileClient } from './PlayerProfileClient';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    const res = await fetch(`${baseUrl}/api/players?id=${id}`, { cache: 'no-store' });
    const data = await res.json();
    const player = data[id];
    if (player && player.displayed_name) {
      return {
        title: `${player.displayed_name} - Profil Gracza - Karwińska Olimpiada`,
        description: `Sprawdź profil, statystyki i wygrane turnieje gracza ${player.displayed_name} w Karwińskiej Olimpiadzie.`,
      };
    }
  } catch (error) {}

  return {
    title: 'Profil Gracza - Karwińska Olimpiada',
    description: 'Profil zawodnika Karwińskiej Olimpiady.',
  };
}

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
      fetch(`${baseUrl}/api/ranking`, { cache: 'no-store' })
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

    const tournaments = Object.keys(tournamentsData).map((key) => tournamentsData[key]);

    // Sort tournaments descending
    tournaments.sort((a, b) => {
      const timeA = a.details?.end_date ? new Date(a.details.end_date).getTime() : (a.details?.timestamp || 0);
      const timeB = b.details?.end_date ? new Date(b.details.end_date).getTime() : (b.details?.timestamp || 0);
      return timeB - timeA;
    });

    const wonTournamentsByTier = { s: [] as string[], a: [] as string[], b: [] as string[], c: [] as string[] };

    tournaments.forEach((t) => {
      const standings = t.standings || [];
      const tier = (t.details?.tier || '').toLowerCase() as keyof typeof wonTournamentsByTier;

      standings.forEach((standing: any) => {
        if (standing.position === 1 && standing.id === id && t.finished) {
          if (wonTournamentsByTier[tier]) {
            wonTournamentsByTier[tier].push(t.displayed_name);
          }
        }
      });
    });

    // Compute player's global ranking standing
    const rankingList = Array.isArray(rankingData) ? rankingData : Object.values(rankingData || {});
    rankingList.sort((a: any, b: any) => Number(b.ranking) - Number(a.ranking));
    const playerRankIndex = rankingList.findIndex((p: any) => p.id === id);
    const globalRankPosition = playerRankIndex !== -1 ? playerRankIndex + 1 : null;
    const playerRanking = rankingList.find((p: any) => p.id === id) || { majorRanking: 0, minorRanking: 0, ranking: 0 };

    // Find position in the most recent finished S-Tier
    const finishedSTiers = tournaments.filter(
      (t: any) => t.finished && t.details?.tier?.toUpperCase() === 'S'
    );
    let lastSTierPosition: number | null = null;
    if (finishedSTiers.length > 0 && finishedSTiers[0].standings) {
      const standing = finishedSTiers[0].standings.find((s: any) => s.id === id);
      if (standing && standing.position && !isNaN(Number(standing.position))) {
        lastSTierPosition = Number(standing.position);
      }
    }

    return (
      <PlayerProfileClient
        player={player}
        tournaments={tournaments}
        ranking={playerRanking}
        globalRankPosition={globalRankPosition}
        lastSTierPosition={lastSTierPosition}
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
