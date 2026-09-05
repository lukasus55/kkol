import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { TimeBlock, formatHour } from './types';

interface BlockEditPopoverProps {
  block: TimeBlock;
  coords: { left: number; bottom: number; alignRight: boolean };
  onClose: () => void;
  onUpdateStartHour: (hour: number) => void;
  onUpdateEndHour: (hour: number) => void;
  onUpdateStatus: (status: 'available' | 'maybe') => void;
  onDelete: () => void;
}

export const BlockEditPopover: React.FC<BlockEditPopoverProps> = ({
  block,
  coords,
  onClose,
  onUpdateStartHour,
  onUpdateEndHour,
  onUpdateStatus,
  onDelete
}) => {
  return (
    <>
      <div 
        className="fixed inset-0 z-[9998]" 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        onMouseDown={(e) => e.stopPropagation()} 
      />
      <div 
        className="fixed z-[9999] bg-bg-200 shadow-2xl rounded-md border border-bg-400 p-4 w-[320px] flex flex-col gap-3"
        style={{ 
          left: coords.left, 
          bottom: coords.bottom,
          transform: coords.alignRight ? 'translateX(-100%)' : 'none'
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-1">
          <span className="font-bold text-text-900 text-sm">Edytuj Blok Dostępności</span>
          <button onClick={onClose} className="text-text-500 hover:text-text-900"><X className="w-4 h-4" /></button>
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-bold text-text-700 mb-1">Od</label>
            <Input 
              type="time"
              value={formatHour(block.startHour)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                onUpdateStartHour(h + (m / 60));
              }}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-bold text-text-700 mb-1">Do</label>
            <Input 
              type="time"
              value={formatHour(block.endHour)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                onUpdateEndHour(h + (m / 60));
              }}
            />
          </div>
        </div>

        <div className="flex gap-1.5 mt-1">
          <button 
            onClick={() => onUpdateStatus('available')} 
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all border ${block.status === 'available' ? 'bg-green-500 text-green-900 border-green-600 shadow-sm' : 'bg-bg-100 text-text-600 border-bg-400 hover:bg-green-500/20 hover:text-green-600'}`}
          >
            Dostępny
          </button>
          <button 
            onClick={() => onUpdateStatus('maybe')} 
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all border ${block.status === 'maybe' ? 'bg-yellow-500 text-yellow-900 border-yellow-600 shadow-sm' : 'bg-bg-100 text-text-600 border-bg-400 hover:bg-yellow-500/20 hover:text-yellow-600'}`}
          >
            Być może
          </button>
        </div>

        <Button variant="danger" onClick={onDelete}>
          Usuń Blok
        </Button>
      </div>
    </>
  );
};
