import React from 'react';
import { TimeBlock, STATUS_COLORS, formatHour } from './types';

interface TimeBlockItemProps {
  block: TimeBlock;
  isActive: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, action: 'create' | 'move' | 'resize-top' | 'resize-bottom', blockId?: string) => void;
}

export const TimeBlockItem: React.FC<TimeBlockItemProps> = ({
  block,
  isActive,
  isDragging,
  onMouseDown
}) => {
  const top = block.startHour * 48;
  const height = (block.endHour - block.startHour) * 48;
  const left = `calc(48px + (100% - 48px) / 7 * ${block.dayIndex})`;

  return (
    <div 
      id={`timeblock-${block.id}`}
      className={`absolute rounded-md shadow-sm flex flex-col group pointer-events-auto transition-shadow hover:shadow-md ${STATUS_COLORS[block.status] || STATUS_COLORS['available']} ${isActive ? 'ring-2 ring-text-900 ring-offset-1 ring-offset-bg-100 z-30' : (isDragging ? 'z-[40] opacity-90 shadow-lg ring-1 ring-black/10' : 'z-10')}`}
      style={{ 
        top: `${top}px`, 
        height: `${height}px`, 
        left, 
        width: 'calc((100% - 48px) / 7 - 4px)',
        margin: '0 2px' 
      }}
    >
      <div 
        className="absolute left-0 w-full cursor-ns-resize hover:bg-black/20 z-20"
        style={{ top: '-4px', height: '12px' }}
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, 'resize-top', block.id); }}
      />
      
      <div 
        className="absolute inset-0 flex flex-col items-center justify-center cursor-move z-10"
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, 'move', block.id); }}
      >
        <span className="text-xs font-bold whitespace-nowrap opacity-90 text-bg-100 select-none pointer-events-none">
          {formatHour(block.startHour)} - {formatHour(block.endHour)}
        </span>
      </div>
      
      <div 
        className="absolute left-0 w-full cursor-ns-resize hover:bg-black/20 z-20"
        style={{ bottom: '-4px', height: '12px' }}
        onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, 'resize-bottom', block.id); }}
      />
    </div>
  );
};
