'use client';

import { useState, useEffect, useCallback } from 'react';
import { PollItem, PollTournament, PollStatus } from './types';

export function usePollsData(user: any) {
  const [polls, setPolls] = useState<PollItem[]>([]);
  const [tournaments, setTournaments] = useState<PollTournament[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/tournaments_active'),
        fetch('/api/polls')
      ]);

      let tData: PollTournament[] = [];
      if (tRes.ok) {
        tData = await tRes.json();
        setTournaments(tData);
      }

      if (pRes.ok) {
        const pData = await pRes.json();
        const tournamentMap = new Map(tData.map(t => [t.id, t.displayed_name || t.id]));

        const filtered = pData.filter((poll: any) => {
          const isPlayer = !!user?.tournaments?.[poll.tournament_id];
          const isOrganizer = !!user?.organizer_roles?.[poll.tournament_id];
          const isAdmin = user?.role === 'admin';
          return isAdmin || isPlayer || isOrganizer;
        });

        const now = new Date();

        const pollsWithStatus: PollItem[] = await Promise.all(
          filtered.map(async (poll: any): Promise<PollItem> => {
            const isEnded = poll.end_date && new Date(poll.end_date) < now;
            const notStarted = poll.start_date && new Date(poll.start_date) > now;
            const tournamentName = tournamentMap.get(poll.tournament_id) || poll.tournament_id;

            if (isEnded) {
              return { ...poll, tournament_name: tournamentName, status: 'ended' };
            }

            if (notStarted) {
              return { ...poll, tournament_name: tournamentName, status: 'upcoming' };
            }

            try {
              const [qRes, aRes] = await Promise.all([
                fetch(`/api/poll_questions?poll=${poll.id}`),
                fetch(`/api/poll_player_answers?poll=${poll.id}&player=${user.id}`)
              ]);

              if (qRes.ok && aRes.ok) {
                const questions = await qRes.json();
                const answers = await aRes.json();

                if (Array.isArray(questions) && questions.length > 0) {
                  const answerable = questions.filter(
                    (q: any) => Array.isArray(q.options) && q.options.length > 0
                  );

                  if (answerable.length > 0) {
                    const hasUnanswered = answerable.some(
                      (q: any) => !answers[q.id] || answers[q.id].length === 0
                    );
                    const status: PollStatus = hasUnanswered ? 'unanswered' : 'completed';
                    return { ...poll, tournament_name: tournamentName, status };
                  }
                }
              }
            } catch {
              // fallback to neutral
            }

            return { ...poll, tournament_name: tournamentName, status: 'neutral' };
          })
        );

        const statusPriority: Record<PollStatus, number> = {
          unanswered: 0,
          completed: 1,
          upcoming: 2,
          neutral: 3,
          ended: 4
        };

        pollsWithStatus.sort((a, b) => {
          const pA = statusPriority[a.status] ?? 3;
          const pB = statusPriority[b.status] ?? 3;
          if (pA !== pB) return pA - pB;
          return 0;
        });

        setPolls(pollsWithStatus);
      }
    } catch (e) {
      console.error('Failed to fetch polls data', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    polls,
    tournaments,
    loading,
    refresh: fetchData
  };
}
