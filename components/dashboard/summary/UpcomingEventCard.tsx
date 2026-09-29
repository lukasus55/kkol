'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';
import { SummaryUpcomingEvent } from './types';

interface UpcomingEventCardProps {
  event: SummaryUpcomingEvent | null;
}

export function UpcomingEventCard({ event }: UpcomingEventCardProps) {
  const getEventParts = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.toLocaleDateString('pl-PL', { month: 'short' }).replace('.', '').toUpperCase();
      const time = d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

      const now = new Date();
      const diffMs = d.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      let relative = '';
      if (diffDays <= 0) relative = 'Dzisiaj';
      else if (diffDays === 1) relative = 'Jutro';
      else relative = `Za ${diffDays} dni`;

      return { day, month, time, relative };
    } catch {
      return { day: '—', month: '', time: dateStr, relative: '' };
    }
  };

  const parts = event ? getEventParts(event.event_date) : null;

  return (
    <div className="w-full bg-bg-200 rounded-md p-5 sm:p-6 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-bg-300">
        <div className="flex items-center gap-2.5">
          <Calendar className="w-5 h-5 text-white" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight">
            Najbliższe Wydarzenie
          </h2>
        </div>

        <Link
          href="/dashboard/calendar"
          className="flex items-center gap-1 text-xs font-semibold text-text-500 hover:text-white transition-colors group"
        >
          <span>Kalendarz</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Content */}
      {!event || !parts ? (
        <div className="py-4 text-center text-text-500 text-xs sm:text-sm">
          Brak zaplanowanych nadchodzących wydarzeń.
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {/* Left: Calendar Date Tile + Event info */}
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Calendar Tile */}
            <div className="flex flex-col items-center justify-center w-11 h-11 rounded-md bg-bg-100 shrink-0 border border-bg-300">
              <span className="text-[10px] font-bold text-text-500 uppercase tracking-wider leading-none mb-0.5">
                {parts.month}
              </span>
              <span className="text-base font-bold text-white leading-none">
                {parts.day}
              </span>
            </div>

            {/* Event Name & Tournament */}
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm sm:text-base font-bold text-white truncate">
                  {event.name}
                </span>
                {event.is_major && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider bg-bg-300 text-text-700 shrink-0">
                    Major
                  </span>
                )}
              </div>
              <span className="text-xs text-text-500 truncate mt-0.5">
                {event.tournament_name || event.tournament_id}
              </span>
            </div>
          </div>

          {/* Right: Time & Countdown */}
          <div className="flex flex-col items-end shrink-0 text-right">
            <span className="text-xs sm:text-sm font-bold text-white">
              {parts.time}
            </span>
            <span className="text-[11px] text-text-500 mt-0.5">
              {parts.relative}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
