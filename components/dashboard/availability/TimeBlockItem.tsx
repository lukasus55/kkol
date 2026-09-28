'use client';
import React from 'react';
import { Clock } from 'lucide-react';
import { TimeBlock, STATUS_COLORS, formatHour } from './types';

interface TimeBlockItemProps {
  block: TimeBlock;
  isActive: boolean;
  isDragging: boolean;
  isSingleDayView?: boolean;
  onMouseDown: (e: React.MouseEvent, action: 'create' | 'move' | 'resize-top' | 'resize-bottom', blockId?: string) => void;
  onSelectBlock: (block: TimeBlock, e?: React.MouseEvent) => void;
}

export const TimeBlockItem: React.FC<TimeBlockItemProps> = ({
  block,
  isActive,
  isDragging,
  isSingleDayView = false,
  onMouseDown,
  onSelectBlock
}) => {
  const top = block.startHour * 48;
  const height = (block.endHour - block.startHour) * 48;
  const left = isSingleDayView 
    ? '52px' 
    : `calc(48px + (100% - 48px) / 7 * ${block.dayIndex})`;
  const width = isSingleDayView 
    ? 'calc(100% - 56px)' 
    : 'calc((100% - 48px) / 7 - 4px)';

  return (
    <div 
      id={`timeblock-${block.id}`}
      className={`absolute rounded-md shadow-sm flex flex-col group pointer-events-auto transition-shadow hover:shadow-md cursor-pointer ${
        STATUS_COLORS[block.status] || STATUS_COLORS['available']
      } ${
        isActive 
          ? 'ring-2 ring-text-900 ring-offset-1 ring-offset-bg-100 z-30' 
          : isDragging 
            ? 'z-[40] opacity-90 shadow-lg ring-1 ring-black/10' 
            : 'z-10'
      }`}
      style={{ 
        top: `${top}px`, 
        height: `${height}px`, 
        left, 
        width,
        margin: isSingleDayView ? '0' : '0 2px'
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelectBlock(block, e);
      }}
    >
      <div 
        className="hidden md:block absolute left-0 w-full cursor-ns-resize hover:bg-black/20 z-20"
        style={{ top: '-4px', height: '12px' }}
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, 'resize-top', block.id); }}
      />
      
      <div 
        className="absolute inset-0 flex items-center justify-between px-2 cursor-pointer md:cursor-move z-10"
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, 'move', block.id); }}
      >
        {isSingleDayView ? (
          <div className="flex items-center justify-between w-full pointer-events-none select-none px-1">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 opacity-80" />
              <span className="text-xs font-bold text-bg-100">
                {formatHour(block.startHour)} - {formatHour(block.endHour)}
              </span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/20 text-bg-100 uppercase tracking-wider">
              {block.status === 'available' ? 'Dostępny' : 'Być może'}
            </span>
          </div>
        ) : (
          <div className="w-full text-center pointer-events-none select-none">
            <span className="text-[11px] font-bold whitespace-nowrap opacity-90 text-bg-100">
              {formatHour(block.startHour)} - {formatHour(block.endHour)}
            </span>
          </div>
        )}
      </div>
      
      <div 
        className="hidden md:block absolute left-0 w-full cursor-ns-resize hover:bg-black/20 z-20"
        style={{ bottom: '-4px', height: '12px' }}
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, 'resize-bottom', block.id); }}
      />
    </div>
  );
};
