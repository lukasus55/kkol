'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import WeeklyTimeGrid, { TimeBlock } from './WeeklyTimeGrid';

interface FriendWeeklyScheduleProps {
  friend: {
    id: string;
    displayed_name: string;
    pfp_base64?: string;
  };
  defaults: any[];
  overrides: any[];
  onBack: () => void;
}

export function FriendWeeklySchedule({
  friend,
  defaults,
  overrides,
  onBack
}: FriendWeeklyScheduleProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const parseHour = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
  };

  const getWeekDateStrings = () =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    });

  const selectedUserBlocks = useMemo(() => {
    const weekDates = getWeekDateStrings();
    const blocks: TimeBlock[] = [];

    for (let i = 0; i < 7; i++) {
      const dateStr = weekDates[i];
      const dayOverrides = overrides.filter(
        (o) => o.player_id === friend.id && o.specific_date.split('T')[0] === dateStr
      );

      if (dayOverrides.length > 0) {
        dayOverrides.forEach((o) => {
          if (o.start_time === '00:00:00' && o.end_time === '00:00:00') return;
          blocks.push({
            id: o.id,
            dayIndex: i,
            startHour: parseHour(o.start_time),
            endHour: parseHour(o.end_time),
            status: o.status,
            isOverride: true
          });
        });
      } else {
        const dayDefaults = defaults.filter(
          (d) => d.player_id === friend.id && d.day_of_week === i + 1
        );
        dayDefaults.forEach((d) => {
          blocks.push({
            id: 'def-' + d.id,
            dayIndex: i,
            startHour: parseHour(d.start_time),
            endHour: parseHour(d.end_time),
            status: d.status,
            isOverride: false
          });
        });
      }
    }
    return blocks;
  }, [friend.id, currentWeekStart, defaults, overrides]);

  const hasOverridesMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    const weekDates = getWeekDateStrings();
    for (let i = 0; i < 7; i++) {
      map[i] = overrides.some(
        (o) => o.player_id === friend.id && o.specific_date.split('T')[0] === weekDates[i]
      );
    }
    return map;
  }, [friend.id, overrides, currentWeekStart]);

  const avatarSrc = friend.pfp_base64
    ? friend.pfp_base64.startsWith('data:image')
      ? friend.pfp_base64
      : 'data:image/jpeg;base64,' + friend.pfp_base64
    : '/img/default_pfp.webp';

  return (
    <div className="flex flex-col h-full overflow-hidden p-0 gap-0">
      <div className="flex-1 overflow-hidden">
        <WeeklyTimeGrid
          mode="specific_week"
          weekStartDate={currentWeekStart}
          initialBlocks={selectedUserBlocks}
          hasOverridesMap={hasOverridesMap}
          readOnly={true}
          headerLeft={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-bg-200 hover:bg-bg-300 text-text-700 hover:text-white transition-colors text-xs font-semibold"
                title="Wróć do listy graczy"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Wróć</span>
              </button>
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full bg-bg-200 border border-bg-400 overflow-hidden shrink-0"
                  title={friend.displayed_name}
                >
                  <img
                    src={avatarSrc}
                    alt={friend.displayed_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold text-text-900 text-sm truncate max-w-[180px] sm:max-w-xs">
                  {friend.displayed_name}
                </span>
              </div>
            </div>
          }
          headerRight={
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() - 7);
                    setCurrentWeekStart(d);
                  }}
                  className="p-1 bg-bg-300 rounded-md hover:bg-bg-400 transition-colors"
                  aria-label="Poprzedni tydzień"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-text-900 min-w-[110px] text-center text-sm">
                  {currentWeekStart.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })} -{' '}
                  {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString(
                    'pl-PL',
                    { month: 'short', day: 'numeric' }
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(currentWeekStart);
                    d.setDate(d.getDate() + 7);
                    setCurrentWeekStart(d);
                  }}
                  className="p-1 bg-bg-300 rounded-md hover:bg-bg-400 transition-colors"
                  aria-label="Następny tydzień"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          }
        />
      </div>
    </div>
  );
}
