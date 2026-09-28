'use client';
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
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
  const popoverRef = useRef<HTMLDivElement>(null);
  const [adjustedStyle, setAdjustedStyle] = useState<React.CSSProperties>({
    left: coords.left,
    bottom: coords.bottom,
    visibility: 'hidden'
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useLayoutEffect(() => {
    if (!popoverRef.current) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (vw < 640) {
      setAdjustedStyle({
        position: 'fixed',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        visibility: 'visible',
        width: 'min(340px, calc(100vw - 32px))'
      });
      return;
    }

    const popoverRect = popoverRef.current.getBoundingClientRect();
    const width = popoverRect.width || 320;
    const height = popoverRect.height || 260;
    const pad = 12;

    let actualLeft = coords.alignRight ? coords.left - width : coords.left;
    if (actualLeft + width > vw - pad) actualLeft = vw - pad - width;
    if (actualLeft < pad) actualLeft = pad;

    let calculatedTop = vh - coords.bottom - height / 2;
    if (calculatedTop + height > vh - pad) calculatedTop = vh - pad - height;
    if (calculatedTop < pad) calculatedTop = pad;

    setAdjustedStyle({
      position: 'fixed',
      left: `${Math.round(actualLeft)}px`,
      top: `${Math.round(calculatedTop)}px`,
      visibility: 'visible',
      width: 'min(320px, calc(100vw - 24px))'
    });
  }, [coords]);

  return (
    <>
      <div 
        className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-xs animate-in fade-in duration-150" 
        onClick={(e) => { e.stopPropagation(); onClose(); }} 
        onMouseDown={(e) => e.stopPropagation()} 
      />
      <div 
        ref={popoverRef}
        className="fixed z-[9999] bg-bg-100 rounded-md border border-bg-300 p-4 shadow-xl flex flex-col gap-3.5 animate-in zoom-in-95 duration-150"
        style={adjustedStyle}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-2 border-b border-bg-300">
          <span className="font-bold text-text-900 text-sm">Edytuj Blok Dostępności</span>
          <button 
            type="button"
            onClick={onClose} 
            className="text-text-500 hover:text-text-900 p-1 rounded-md hover:bg-bg-200 transition-colors"
            title="Zamknij"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input 
              label="Od"
              type="time"
              value={formatHour(block.startHour)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                onUpdateStartHour(h + (m / 60));
              }}
            />
          </div>
          <div>
            <Input 
              label="Do"
              type="time"
              value={formatHour(block.endHour)}
              onChange={(e) => {
                const [h, m] = e.target.value.split(':').map(Number);
                onUpdateEndHour(h + (m / 60));
              }}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-text-700 mb-1.5">Status</label>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => onUpdateStatus('available')} 
              className={`flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all border ${
                block.status === 'available' 
                  ? 'bg-green-500 text-green-950 border-green-600 shadow-sm' 
                  : 'bg-bg-200 text-text-600 border-bg-400 hover:bg-green-500/20 hover:text-green-700'
              }`}
            >
              Dostępny
            </button>
            <button 
              type="button"
              onClick={() => onUpdateStatus('maybe')} 
              className={`flex-1 py-2 px-2 rounded-md text-xs font-bold transition-all border ${
                block.status === 'maybe' 
                  ? 'bg-yellow-500 text-yellow-950 border-yellow-600 shadow-sm' 
                  : 'bg-bg-200 text-text-600 border-bg-400 hover:bg-yellow-500/20 hover:text-yellow-700'
              }`}
            >
              Być może
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center gap-2 pt-2 border-t border-bg-300">
          <Button variant="danger" onClick={onDelete} className="gap-1.5 py-1.5 px-3 text-xs">
            <Trash2 className="w-3.5 h-3.5" />
            Usuń
          </Button>
          <Button variant="primary" onClick={onClose} className="gap-1.5 py-1.5 px-4 text-xs">
            <Check className="w-3.5 h-3.5" />
            Gotowe
          </Button>
        </div>
      </div>
    </>
  );
};
