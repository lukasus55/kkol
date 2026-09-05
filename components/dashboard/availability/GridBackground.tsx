import React from 'react';

export const GridBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="flex h-[48px] w-full pointer-events-none">
          <div className="w-[48px] flex-shrink-0 text-[10px] text-text-500 font-semibold text-right pr-1 pt-1 bg-bg-200 border-r border-bg-400">
            {i}:00
          </div>
          <div className="flex-1 flex pointer-events-none border-t border-bg-300">
            {Array.from({ length: 7 }).map((_, j) => (
              <div key={j} className="flex-1 border-r border-bg-300 last:border-r-0"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
