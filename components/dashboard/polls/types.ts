export type PollStatus = 'unanswered' | 'completed' | 'ended' | 'upcoming' | 'neutral';

export interface PollItem {
  id: string;
  name: string;
  tournament_id: string;
  tournament_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  status: PollStatus;
}

export interface PollTournament {
  id: string;
  displayed_name?: string;
}
