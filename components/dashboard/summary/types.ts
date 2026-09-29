export interface SummaryTournament {
  id: string;
  displayed_name: string;
  page_exists: boolean;
  page_url?: string | null;
  finished: boolean;
  standings?: { id: string; displayed_name: string; position: number | string; total_points?: number }[];
  details?: {
    end_date?: string | null;
    displayed_date?: string | null;
    tier?: string | null;
  };
}

export interface SummaryRankingPlayer {
  id: string;
  name: string;
  pfpSrc: string;
  majorRanking: string;
  minorRanking: string;
  ranking: string;
}

export interface SummaryUpcomingEvent {
  id: number | string;
  tournament_id: string;
  name: string;
  event_date: string;
  is_major: boolean;
  tournament_name?: string;
}

export interface SummaryStats {
  totalPlayed: number;
  wins: number;
  winRate: number;
}

export type LiveAvailabilityStatus = 'available' | 'maybe' | 'unavailable';

export interface SummaryFriendAvailability {
  id: string;
  displayed_name: string;
  pfpSrc: string;
  status: LiveAvailabilityStatus;
}

export const getTierBadgeClass = (tierRaw?: string | null) => {
  if (!tierRaw) return 'bg-bg-300 text-text-700';
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
