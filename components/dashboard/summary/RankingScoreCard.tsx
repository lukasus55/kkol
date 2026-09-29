'use client';

import React from 'react';
import Link from 'next/link';
import { Award, ChevronRight } from 'lucide-react';
import { SummaryRankingPlayer } from './types';

interface RankingScoreCardProps {
  currentUserId: string;
  userRank: number | null;
  userScore: SummaryRankingPlayer | null;
  leaderboardContext: { player: SummaryRankingPlayer; rank: number }[];
}

export function RankingScoreCard({ currentUserId, userRank, userScore, leaderboardContext }: RankingScoreCardProps) {
  return (
    <div className="w-full bg-bg-200 rounded-md p-5 sm:p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-bg-300">
        <div className="flex items-center gap-2.5">
          <Award className="w-5 h-5 text-white" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
            Ranking KKOL
          </h2>
        </div>

        <Link
          href="/ranking"
          className="flex items-center gap-1 text-xs font-semibold text-text-500 hover:text-white transition-colors group"
        >
          <span>Pełny ranking</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mb-4">
        <div className="bg-bg-100 rounded-md p-3 flex flex-col justify-center">
          <span className="text-[11px] text-text-500 font-medium uppercase tracking-wider">Pozycja</span>
          <span className="text-xl sm:text-2xl font-bold text-white mt-0.5">
            {userRank ? `#${userRank}` : '-'}
          </span>
        </div>

        <div className="bg-bg-100 rounded-md p-3 flex flex-col justify-center">
          <span className="text-[11px] text-text-500 font-medium uppercase tracking-wider">S-Score</span>
          <span className="text-xl sm:text-2xl font-bold text-white mt-0.5">
            {userScore?.majorRanking ?? '0.00'}
          </span>
        </div>

        <div className="bg-bg-100 rounded-md p-3 flex flex-col justify-center">
          <span className="text-[11px] text-text-500 font-medium uppercase tracking-wider">AB-Score</span>
          <span className="text-xl sm:text-2xl font-bold text-white mt-0.5">
            {userScore?.minorRanking ?? '0.00'}
          </span>
        </div>
      </div>

      {/* Mini Leaderboard Context */}
      {leaderboardContext.length > 0 && (
        <div className="flex flex-col pt-3 border-t border-bg-300">
          <div className="flex items-center justify-between text-[11px] font-semibold text-text-500 uppercase tracking-wider mb-2 px-1">
            <span>Najbliżsi rywale</span>
            <span>Punkty</span>
          </div>
          <div className="flex flex-col divide-y divide-bg-300">
            {leaderboardContext.map(({ player, rank }) => {
              const isCurrentUser = player.id === currentUserId;
              return (
                <Link
                  key={player.id}
                  href={`/player/${player.id}`}
                  className={`flex items-center justify-between py-2 px-2.5 rounded-md transition-colors group ${
                    isCurrentUser ? 'bg-bg-300 text-white font-semibold' : 'hover:bg-bg-300 text-text-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`w-4 text-center text-xs font-semibold ${isCurrentUser ? 'font-bold text-white' : 'text-text-500'}`}>
                      {rank}
                    </span>
                    <img
                      src={player.pfpSrc || '/img/default_pfp.webp'}
                      alt={player.name}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                    <span className={`truncate max-w-[140px] sm:max-w-[200px] text-xs sm:text-sm group-hover:underline ${isCurrentUser ? 'font-bold text-white' : 'text-text-900 group-hover:text-white'}`}>
                      {player.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-xs">
                    <span className={`font-bold ${isCurrentUser ? 'text-white' : 'text-text-900'}`}>{player.ranking}</span>
                    <span className="text-[11px] text-text-500">pkt</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
