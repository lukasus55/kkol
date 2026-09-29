'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { useSummaryData } from './summary/useSummaryData';
import { PlayerHeaderCard } from './summary/PlayerHeaderCard';
import { RankingScoreCard } from './summary/RankingScoreCard';
import { AvailabilitySummaryCard } from './summary/AvailabilitySummaryCard';
import { UpcomingEventCard } from './summary/UpcomingEventCard';
import { RecentTournamentsCard } from './summary/RecentTournamentsCard';

export default function SummaryTab({ user }: { user: any }) {
  const {
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
  } = useSummaryData(user);

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full min-h-0 pb-6 px-4 sm:px-8 pt-4 gap-5 max-w-5xl mx-auto overflow-y-auto custom-scrollbar">
        {/* Header Skeleton */}
        <div className="w-full bg-bg-200 rounded-md p-5 animate-pulse h-24" />
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 flex flex-col gap-5">
            <div className="w-full bg-bg-200 rounded-md p-5 animate-pulse h-72" />
            <div className="w-full bg-bg-200 rounded-md p-5 animate-pulse h-48" />
          </div>
          <div className="lg:col-span-5 flex flex-col gap-5">
            <div className="w-full bg-bg-200 rounded-md p-5 animate-pulse h-36" />
            <div className="w-full bg-bg-200 rounded-md p-5 animate-pulse h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0 pb-6 px-4 sm:px-8 pt-4 gap-5 max-w-5xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Active Polls Notification (only rendered when there are open polls user has not answered yet) */}
      {activePollsCount > 0 && (
        <Link
          href="/dashboard/polls"
          className="flex items-center justify-between px-4 py-3 rounded-md bg-bg-200 hover:bg-bg-300 border border-bg-300 border-l-[3px] border-l-amber-400 transition-colors group"
        >
          <div className="flex items-center gap-3 min-w-0">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold text-white truncate">
                Niewypełnione ankiety
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-500/15 text-amber-300 shrink-0">
                {activePollsCount} do uzupełnienia
              </span>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-400 group-hover:text-amber-300 transition-colors shrink-0">
            Głosuj
          </span>
        </Link>
      )}

      {/* Player Header */}
      <PlayerHeaderCard
        user={user}
        rank={userRank}
        totalPoints={userScore?.ranking ?? null}
        stats={stats}
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Ranking & Availability */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <RankingScoreCard
            currentUserId={user?.id}
            userRank={userRank}
            userScore={userScore}
            leaderboardContext={leaderboardContext}
          />
          <AvailabilitySummaryCard
            userStatus={userAvailabilityStatus}
            friends={friendsAvailability}
          />
        </div>

        {/* Right Column: Upcoming Event & Recent Tournaments */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <UpcomingEventCard event={upcomingEvent} />
          <RecentTournamentsCard
            currentUserId={user?.id}
            tournaments={tournaments}
          />
        </div>
      </div>
    </div>
  );
}
