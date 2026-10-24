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

export { getTierBadgeClass } from '@/components/ui/TierBadge';
