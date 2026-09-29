'use client';

import { useState, useEffect } from 'react';
import {
  SummaryTournament,
  SummaryRankingPlayer,
  SummaryUpcomingEvent,
  SummaryStats,
  LiveAvailabilityStatus,
  SummaryFriendAvailability
} from './types';
import { fetchAvailabilitySummary } from './availabilityHelper';

export function useSummaryData(user: any) {
  const [loading, setLoading] = useState(true);
  const [rankingList, setRankingList] = useState<SummaryRankingPlayer[]>([]);
  const [tournaments, setTournaments] = useState<SummaryTournament[]>([]);
  const [upcomingEvent, setUpcomingEvent] = useState<SummaryUpcomingEvent | null>(null);
  const [activePollsCount, setActivePollsCount] = useState<number>(0);
  const [userAvailabilityStatus, setUserAvailabilityStatus] = useState<LiveAvailabilityStatus>('unavailable');
  const [friendsAvailability, setFriendsAvailability] = useState<SummaryFriendAvailability[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    async function loadAllData() {
      setLoading(true);
      try {
        const [rankingRes, tournamentsRes, eventRes, pollsRes, availData] = await Promise.all([
          fetch('/api/ranking').catch(() => null),
          fetch(`/api/tournaments?player=${user.id}`).catch(() => null),
          fetch('/api/events?upcoming=true&format=list&limit=1').catch(() => null),
          fetch('/api/polls').catch(() => null),
          fetchAvailabilitySummary(user)
        ]);

        if (!isMounted) return;

        if (rankingRes && rankingRes.ok) {
          const rData = await rankingRes.json();
          if (Array.isArray(rData)) setRankingList(rData);
        }

        if (tournamentsRes && tournamentsRes.ok) {
          const tData = await tournamentsRes.json();
          setTournaments(Object.values(tData) as SummaryTournament[]);
        }

        if (eventRes && eventRes.ok) {
          const eData = await eventRes.json();
          if (Array.isArray(eData) && eData.length > 0) {
            setUpcomingEvent(eData[0]);
          }
        }

        if (availData) {
          setUserAvailabilityStatus(availData.userStatus);
          setFriendsAvailability(availData.friends);
        }

        if (pollsRes && pollsRes.ok) {
          const pData = await pollsRes.json();
          if (Array.isArray(pData)) {
            const now = new Date();
            const eligiblePolls = pData.filter((poll: any) => {
              const isPlayer = !!user.tournaments?.[poll.tournament_id];
              const isOrganizer = !!user.organizer_roles?.[poll.tournament_id];
              const isStarted = !poll.start_date || new Date(poll.start_date) <= now;
              const isEnded = poll.end_date && new Date(poll.end_date) < now;
              return (isPlayer || isOrganizer) && isStarted && !isEnded;
            });

            let unansweredCount = 0;
            await Promise.all(
              eligiblePolls.map(async (poll: any) => {
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
                        if (hasUnanswered) unansweredCount++;
                      }
                    }
                  }
                } catch {
                  // ignore
                }
              })
            );

            if (isMounted) setActivePollsCount(unansweredCount);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard summary data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAllData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Derived user ranking & context
  const userRankIndex = rankingList.findIndex((p) => p.id === user?.id);
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;
  const userScore = userRankIndex >= 0 ? rankingList[userRankIndex] : null;

  const startIdx = Math.max(0, userRankIndex >= 0 ? userRankIndex - 2 : 0);
  const endIdx = Math.min(rankingList.length, Math.max(5, userRankIndex >= 0 ? userRankIndex + 3 : 5));
  const leaderboardContext =
    userRankIndex >= 0
      ? rankingList.slice(startIdx, endIdx).map((player, i) => ({ player, rank: startIdx + i + 1 }))
      : rankingList.slice(0, 5).map((player, i) => ({ player, rank: i + 1 }));

  // Derived statistics
  const finishedTournaments = tournaments.filter((t) => t.finished);
  let wins = 0;

  for (const t of finishedTournaments) {
    const userStanding = t.standings?.find((s) => s.id === user?.id);
    if (!userStanding) continue;
    const pos = Number(userStanding.position);
    if (!isNaN(pos) && pos === 1) wins++;
  }

  const totalPlayed = finishedTournaments.length;
  const winRate = totalPlayed > 0 ? Math.round((wins / totalPlayed) * 100) : 0;

  const stats: SummaryStats = { totalPlayed, wins, winRate };

  return {
    loading,
    userRank,
    userScore,
    leaderboardContext,
    tournaments,
    upcomingEvent,
    activePollsCount,
    userAvailabilityStatus,
    friendsAvailability,
    stats
  };
}
