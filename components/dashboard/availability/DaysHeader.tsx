'use client';
import React from 'react';
import { RotateCcw } from 'lucide-react';
import { DAYS_SHORT, FULL_DAY_NAMES } from './types';
import { Button } from '../../ui/Button';

interface DaysHeaderProps {
  mode: 'routine' | 'specific_week';
  weekStartDate: Date | null;
  hasOverridesMap?: Record<number, boolean>;
  onRevertDay: (dayIndex: number) => void;
  readOnly?: boolean;
  isSingleDayView?: boolean;
  selectedDayIndex?: number;
}

export const DaysHeader: React.FC<DaysHeaderProps> = ({
  mode,
  weekStartDate,
  hasOverridesMap,
  onRevertDay,
  readOnly,
  isSingleDayView = false,
  selectedDayIndex = 0
}) => {
  if (isSingleDayView) {
    const dayName = FULL_DAY_NAMES[selectedDayIndex] || DAYS_SHORT[selectedDayIndex];
    let dateStr = '';
    if (mode === 'specific_week' && weekStartDate) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + selectedDayIndex);
      dateStr = `${d.getDate()}.${d.getMonth() + 1}`;
    }
    const hasOverride = mode === 'specific_week' && hasOverridesMap?.[selectedDayIndex];

    return (
      <div className="flex sticky top-0 z-30 bg-bg-200 shadow-sm border-b border-bg-300 items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-text-900 text-sm">{dayName}</span>
          {dateStr && <span className="text-xs text-text-500 font-semibold">({dateStr})</span>}
          {hasOverride && (
            <span className="text-[10px] font-bold text-accent-500 bg-accent-500/10 px-1.5 py-0.5 rounded">
              Wyjątek
            </span>
          )}
        </div>

        {hasOverride && !readOnly && (
          <Button
            variant="danger"
            onClick={() => onRevertDay(selectedDayIndex)}
            className="text-xs py-1 px-2.5 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Przywróć rutynę
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex sticky top-0 z-30 bg-bg-200 shadow-sm border-b border-bg-300">
      <div className="w-[48px] flex-shrink-0 border-r border-bg-400"></div>
      {DAYS_SHORT.map((day, i) => {
        let dateStr = '';
        if (mode === 'specific_week' && weekStartDate) {
          const d = new Date(weekStartDate);
          d.setDate(d.getDate() + i);
          dateStr = `${d.getDate()}.${d.getMonth() + 1}`;
        }
        const hasOverride = mode === 'specific_week' && hasOverridesMap?.[i];

        return (
          <div key={i} className="flex-1 text-center py-2 flex flex-col relative group border-r border-bg-300 last:border-r-0">
            <span className="font-bold text-text-900 text-xs sm:text-sm">{day} {dateStr}</span>
            
            {mode === 'specific_week' && hasOverride && !readOnly && (
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-40">
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRevertDay(i); }} 
                  className="p-1 bg-red-500 text-bg-100 rounded text-[10px] font-bold shadow-md hover:bg-red-600 transition-colors" 
                  title="Przywróć rutynę"
                >
                  Usuń
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
