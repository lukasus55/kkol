'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, MinusCircle, ChevronRight, BarChart2, Clock } from 'lucide-react';
import { PollItem } from './types';

interface PollRowProps {
  poll: PollItem;
}

export function PollRow({ poll }: PollRowProps) {
  const router = useRouter();

  const getRelativeTime = (dateStr?: string | null) => {
    if (!dateStr) return 'Bez terminu';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Zakończona';
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays === 1) return 'Jutro';
    if (diffDays > 30) return `${Math.floor(diffDays / 30)} mies.`;
    return `Za ${diffDays} dni`;
  };

  const isUnanswered = poll.status === 'unanswered';
  const isEnded = poll.status === 'ended';
  const isCompleted = poll.status === 'completed';
  const isUpcoming = poll.status === 'upcoming';
  const isNeutral = poll.status === 'neutral';

  const containerClasses = [
    'flex items-center justify-between rounded-md p-4 sm:p-5 transition-all cursor-pointer group',
    isUnanswered
      ? 'bg-bg-200 hover:bg-bg-300 border-l-[3px] border-l-amber-400'
      : isEnded
        ? 'bg-bg-200 hover:bg-bg-300 opacity-60 hover:opacity-100'
        : 'bg-bg-200 hover:bg-bg-300'
  ].join(' ');

  return (
    <div
      onClick={() => router.push(`/poll/${poll.id}`)}
      className={containerClasses}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {isUnanswered ? (
            <AlertCircle className="w-5 h-5 text-amber-400" />
          ) : isEnded ? (
            <MinusCircle className="w-5 h-5 text-text-500" />
          ) : isUpcoming ? (
            <Clock className="w-5 h-5 text-text-500" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-text-500" />
          ) : (
            <BarChart2 className="w-5 h-5 text-text-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span
              className={`text-[15px] font-bold truncate group-hover:underline ${
                isUnanswered ? 'text-white' : isEnded ? 'text-text-700' : 'text-text-900'
              }`}
            >
              {poll.name}
            </span>

            {isUnanswered && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider bg-amber-500/15 text-amber-300 shrink-0">
                Do uzupełnienia
              </span>
            )}
            {isCompleted && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider bg-bg-100 text-text-500 shrink-0">
                Wypełniona
              </span>
            )}
            {isEnded && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider bg-bg-300 text-text-500 shrink-0">
                Zakończona
              </span>
            )}
            {isUpcoming && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider bg-bg-300 text-text-500 shrink-0">
                Nadchodząca
              </span>
            )}
            {isNeutral && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider bg-bg-100 text-text-500 shrink-0">
                Podgląd
              </span>
            )}
          </div>

          <span className="text-xs sm:text-[13px] text-text-500 truncate">
            {poll.tournament_name || poll.tournament_id}
          </span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 shrink-0 text-right">
        <span className="text-xs sm:text-sm font-medium text-text-500 hidden xs:inline">
          {getRelativeTime(poll.end_date)}
        </span>

        {isUnanswered ? (
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:text-amber-300 transition-colors">
            <span>Wypełnij</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        ) : (
          <ChevronRight className="w-4 h-4 text-text-500 transition-transform group-hover:translate-x-0.5" />
        )}
      </div>
    </div>
  );
}
