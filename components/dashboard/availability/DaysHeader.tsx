import React from 'react';
import { DAYS_SHORT } from './types';

interface DaysHeaderProps {
  mode: 'routine' | 'specific_week';
  weekStartDate: Date | null;
  hasOverridesMap?: Record<number, boolean>;
  onRevertDay: (dayIndex: number) => void;
  readOnly?: boolean;
}

export const DaysHeader: React.FC<DaysHeaderProps> = ({
  mode,
  weekStartDate,
  hasOverridesMap,
  onRevertDay,
  readOnly
}) => {
  return (
    <div className="flex sticky top-0 z-30 bg-bg-200 shadow-sm">
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
            <span className="font-bold text-text-900 text-sm">{day} {dateStr}</span>
            
            {mode === 'specific_week' && hasOverride && !readOnly && (
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-40">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRevertDay(i); }} 
                  className="p-1 bg-red-500 text-bg-100 rounded text-[10px] font-bold shadow-md" 
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
