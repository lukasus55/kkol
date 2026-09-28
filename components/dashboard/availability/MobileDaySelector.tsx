'use client';
import React from 'react';
import { Calendar, Layers } from 'lucide-react';
import { DAYS_SHORT, TimeBlock } from './types';

interface MobileDaySelectorProps {
  mode: 'routine' | 'specific_week';
  weekStartDate: Date | null;
  selectedDay: number | 'all';
  onSelectDay: (day: number | 'all') => void;
  blocks: TimeBlock[];
  hasOverridesMap?: Record<number, boolean>;
}

export const MobileDaySelector: React.FC<MobileDaySelectorProps> = ({
  mode,
  weekStartDate,
  selectedDay,
  onSelectDay,
  blocks,
  hasOverridesMap
}) => {
  return (
    <div className="flex md:hidden items-center gap-1.5 p-2 bg-bg-200 border-b border-bg-300 overflow-x-auto no-scrollbar">
      {DAYS_SHORT.map((day, i) => {
        let dateStr = '';
        if (mode === 'specific_week' && weekStartDate) {
          const d = new Date(weekStartDate);
          d.setDate(d.getDate() + i);
          dateStr = `${d.getDate()}.${d.getMonth() + 1}`;
        }

        const isSelected = selectedDay === i;
        const dayBlocks = blocks.filter(b => b.dayIndex === i);
        const hasAvailable = dayBlocks.some(b => b.status === 'available');
        const hasOverride = mode === 'specific_week' && hasOverridesMap?.[i];

        const statusDotClass = dayBlocks.length === 0
          ? 'bg-red-500'
          : hasAvailable
            ? 'bg-green-500'
            : 'bg-yellow-500';

        return (
          <button
            key={i}
            type="button"
            onClick={() => onSelectDay(i)}
            className={`flex-1 min-w-[46px] py-1.5 px-1 rounded-md flex flex-col items-center justify-center transition-all relative ${
              isSelected
                ? 'bg-bg-100 text-text-900 border border-bg-400 font-bold shadow-sm'
                : 'bg-bg-200 text-text-500 hover:text-text-900 hover:bg-bg-300'
            }`}
          >
            <span className="text-xs">{day}</span>
            {dateStr && <span className="text-[10px] opacity-75">{dateStr}</span>}
            
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass} inline-block`} />
              {hasOverride && (
                <span className="w-1.5 h-1.5 rounded-full bg-accent-500 inline-block" title="Wyjątek" />
              )}
            </div>
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onSelectDay('all')}
        className={`min-w-[44px] py-1.5 px-2 rounded-md flex flex-col items-center justify-center transition-all ${
          selectedDay === 'all'
            ? 'bg-bg-100 text-text-900 border border-bg-400 font-bold shadow-sm'
            : 'bg-bg-200 text-text-500 hover:text-text-900 hover:bg-bg-300'
        }`}
        title="Pokaż cały tydzień"
      >
        <Layers className="w-3.5 h-3.5 mb-0.5" />
        <span className="text-[10px] leading-tight">Tydz.</span>
      </button>
    </div>
  );
};
