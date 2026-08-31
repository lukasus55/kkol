'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../ui/Button';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import { X, Clock, CalendarIcon } from 'lucide-react';
import { Modal } from '../../ui/Modal';

export interface TimeBlock {
  id: string; // temporary or db id
  dayIndex: number; // 0 (Mon) to 6 (Sun)
  startHour: number; // e.g. 14.5 for 14:30
  endHour: number;   // e.g. 16.0 for 16:00
  status: 'available' | 'maybe' | 'unavailable';
  isOverride?: boolean; // visually indicate it's an override if in routine mode? 
}

interface WeeklyTimeGridProps {
  mode: 'routine' | 'specific_week';
  weekStartDate: Date | null; // Monday of the current week
  initialBlocks: TimeBlock[];
  onSaveRoutine?: (blocks: TimeBlock[]) => void;
  onSaveDayOverride?: (dateStr: string, blocks: TimeBlock[], revertToRoutine: boolean) => void;
  hasOverridesMap?: Record<number, boolean>; // Tells us which day index has overrides in specific_week mode
  isLoading?: boolean;
  headerLeft?: React.ReactNode;
  headerRight?: React.ReactNode;
}

const DAYS_SHORT = ["Pon", "Wto", "Śro", "Czw", "Pią", "Sob", "Nie"];

const STATUS_COLORS: Record<string, string> = {
  'available': 'bg-green-500 text-green-900',
  'maybe': 'bg-yellow-500 text-yellow-900'
};

const formatHour = (hourObj: number) => {
  const h = Math.floor(hourObj);
  const m = (hourObj % 1) * 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export default function WeeklyTimeGrid({ mode, weekStartDate, initialBlocks, onSaveRoutine, onSaveDayOverride, hasOverridesMap, isLoading, headerLeft, headerRight }: WeeklyTimeGridProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ left: number, bottom: number, alignRight: boolean } | null>(null);
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalBlock(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    dayIndex: number | null;
    startHour: number | null;
    currentHour: number | null;
    action: 'create' | 'move' | 'resize-top' | 'resize-bottom' | null;
    blockId: string | null;
    originalBlock: TimeBlock | null;
  }>({
    isDragging: false, dayIndex: null, startHour: null, currentHour: null, action: null, blockId: null, originalBlock: null
  });

  const [activeModalBlock, setActiveModalBlock] = useState<TimeBlock | null>(null);

  useEffect(() => {
    setBlocks(initialBlocks);
  }, [initialBlocks]);

  const getHourFromMouse = (e: React.MouseEvent | MouseEvent) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const scrollY = gridRef.current.scrollTop;
    // Each hour is 48px
    const rawHour = (y + scrollY) / 48;
    // Snap to 30 min (0.5)
    return Math.max(0, Math.min(24, Math.round(rawHour * 2) / 2));
  };

  const getDayFromMouse = (e: React.MouseEvent | MouseEvent) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 48; // 48px is the time column width
    if (x < 0) return 0;
    const dayWidth = (rect.width - 48) / 7;
    return Math.max(0, Math.min(6, Math.floor(x / dayWidth)));
  };

  const handleMouseDown = (e: React.MouseEvent, action: 'create' | 'move' | 'resize-top' | 'resize-bottom', blockId?: string) => {
    if (e.button !== 0) return; // Only left click
    const day = getDayFromMouse(e);
    const hour = getHourFromMouse(e);
    
    let original = null;
    if (blockId) {
       original = blocks.find(b => b.id === blockId) || null;
    }

    setDragState({
      isDragging: true,
      dayIndex: day,
      startHour: hour,
      currentHour: hour,
      action,
      blockId: blockId || null,
      originalBlock: original ? { ...original } : null
    });
    
    // Prevent text selection
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.isDragging) return;
      const hour = getHourFromMouse(e);
      setDragState(prev => ({ ...prev, currentHour: hour }));
    };

    const handleMouseUp = () => {
      if (!dragState.isDragging) return;
      
      const { action, dayIndex, startHour, currentHour, blockId, originalBlock } = dragState;

      // Detect if it was just a click (no movement) on an existing block
      if (blockId && originalBlock && startHour !== null && currentHour !== null && Math.abs(currentHour - startHour) < 0.1) {
          setActiveModalBlock(originalBlock);
          
          // Compute menu coords
          const el = document.getElementById(`timeblock-${blockId}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            const centerY = rect.top + rect.height / 2;
            const centerX = rect.left + rect.width / 2;
            
            // Pop out from center Y, slightly to the right
            let left = centerX + 10;
            let alignRight = false;
            
            // If near right edge of screen, align it to the left of the center
            if (left + 320 > window.innerWidth) { // 320 is the new menu width
              left = centerX - 10;
              alignRight = true;
            }
            
            setMenuCoords({
              left,
              bottom: window.innerHeight - centerY,
              alignRight
            });
          }
          
          setDragState({ isDragging: false, dayIndex: null, startHour: null, currentHour: null, action: null, blockId: null, originalBlock: null });
          return;
      }

      setBlocks(prev => {
        let newBlocks = [...prev];
        
        if (dayIndex === null || startHour === null || currentHour === null) return prev;
        
        markAction(dayIndex);

        if (action === 'create') {
          const s = Math.min(startHour, currentHour);
          const e = Math.max(startHour, currentHour);
          if (e - s > 0) {
            newBlocks.push({
              id: 'temp-' + Date.now(),
              dayIndex,
              startHour: s,
              endHour: e,
              status: 'available'
            });
          }
        } else if (blockId && originalBlock) {
          const blockIndex = newBlocks.findIndex(b => b.id === blockId);
          if (blockIndex > -1) {
            const block = { ...newBlocks[blockIndex] };
            markAction(block.dayIndex);
            if (action === 'move') {
              const diff = currentHour - startHour;
              block.startHour = Math.max(0, originalBlock.startHour + diff);
              block.endHour = Math.min(24, originalBlock.endHour + diff);
              if (block.endHour - block.startHour < (originalBlock.endHour - originalBlock.startHour)) {
                 if (block.startHour === 0) block.endHour = originalBlock.endHour - originalBlock.startHour;
                 if (block.endHour === 24) block.startHour = 24 - (originalBlock.endHour - originalBlock.startHour);
              }
            } else if (action === 'resize-top') {
              const diff = currentHour - startHour;
              block.startHour = Math.max(0, Math.min(block.endHour - 0.5, originalBlock.startHour + diff));
            } else if (action === 'resize-bottom') {
              const diff = currentHour - startHour;
              block.endHour = Math.min(24, Math.max(block.startHour + 0.5, originalBlock.endHour + diff));
            }
            newBlocks[blockIndex] = block;
          }
        }
        return newBlocks;
      });

      setDragState({ isDragging: false, dayIndex: null, startHour: null, currentHour: null, action: null, blockId: null, originalBlock: null });
    };

    if (dragState.isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  const modifiedDaysRef = useRef<Set<number>>(new Set());
  const [userActionCount, setUserActionCount] = useState(0);
  const lastSavedActionCount = useRef(0);

  const markAction = (dayIndex: number) => {
    modifiedDaysRef.current.add(dayIndex);
    setUserActionCount(c => c + 1);
  };

  useEffect(() => {
    if (userActionCount === 0 || userActionCount === lastSavedActionCount.current) return;
    const timer = setTimeout(() => {
      lastSavedActionCount.current = userActionCount; // Oznaczamy, że ten stan został już wysłany do zapisu
      if (mode === 'routine' && onSaveRoutine) {
        onSaveRoutine(blocks);
      } else if (mode === 'specific_week' && onSaveDayOverride && weekStartDate) {
        // Save each modified day
        const daysToSave = Array.from(modifiedDaysRef.current);
        daysToSave.forEach(dayIdx => {
           const date = new Date(weekStartDate);
           date.setDate(date.getDate() + dayIdx);
           const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
           const dayBlocks = blocks.filter(b => b.dayIndex === dayIdx);
           onSaveDayOverride(dateStr, dayBlocks, false);
        });
      }
      modifiedDaysRef.current.clear();
    }, 1000);
    return () => clearTimeout(timer);
  }, [blocks, userActionCount, mode, onSaveRoutine, onSaveDayOverride, weekStartDate]);

  const handleSaveDay = (dayIdx: number, overrideBlocks: TimeBlock[] = blocks) => {
    if (!onSaveDayOverride || !weekStartDate) return;
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + dayIdx);
    const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    const dayBlocks = overrideBlocks.filter(b => b.dayIndex === dayIdx);
    onSaveDayOverride(dateStr, dayBlocks, false);
  };

  const handleRevertDay = (dayIdx: number) => {
    if (!onSaveDayOverride || !weekStartDate) return;
    if (!confirm('Czy na pewno chcesz usunąć wyjątki i przywrócić rutynę dla tego dnia?')) return;
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + dayIdx);
    const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    onSaveDayOverride(dateStr, [], true);
  };

  // Render ghost block while dragging
  const renderGhostBlock = () => {
    if (!dragState.isDragging || dragState.action !== 'create' || dragState.dayIndex === null || dragState.startHour === null || dragState.currentHour === null) return null;
    const s = Math.min(dragState.startHour, dragState.currentHour);
    const e = Math.max(dragState.startHour, dragState.currentHour);
    if (e - s <= 0) return null;
    return (
      <div 
        className="absolute bg-accent-500/40 border border-accent-500/80 rounded-md pointer-events-none z-10"
        style={{
          left: `calc(48px + (100% - 48px) / 7 * ${dragState.dayIndex})`,
          width: `calc((100% - 48px) / 7)`,
          top: `${s * 48}px`,
          height: `${(e - s) * 48}px`
        }}
      />
    );
  };

  const currentDisplayBlocks = blocks.map(b => {
    if (dragState.isDragging && dragState.blockId === b.id && dragState.originalBlock && dragState.startHour !== null && dragState.currentHour !== null) {
      const diff = dragState.currentHour - dragState.startHour;
      let ns = b.startHour;
      let ne = b.endHour;
      if (dragState.action === 'move') {
        ns = Math.max(0, dragState.originalBlock.startHour + diff);
        ne = Math.min(24, dragState.originalBlock.endHour + diff);
        if (ne - ns < (dragState.originalBlock.endHour - dragState.originalBlock.startHour)) {
           if (ns === 0) ne = dragState.originalBlock.endHour - dragState.originalBlock.startHour;
           if (ne === 24) ns = 24 - (dragState.originalBlock.endHour - dragState.originalBlock.startHour);
        }
      } else if (dragState.action === 'resize-top') {
        ns = Math.max(0, Math.min(dragState.originalBlock.endHour - 0.5, dragState.originalBlock.startHour + diff));
        ne = dragState.originalBlock.endHour;
      } else if (dragState.action === 'resize-bottom') {
        ns = dragState.originalBlock.startHour;
        ne = Math.min(24, Math.max(dragState.originalBlock.startHour + 0.5, dragState.originalBlock.endHour + diff));
      }
      return { ...b, startHour: ns, endHour: ne };
    }
    return b;
  });

  return (
    <div className="flex flex-col h-full bg-bg-100 rounded-md overflow-hidden">
      
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-bg-200">
        <div>{headerLeft}</div>
        <div className="flex items-center gap-4">
          {headerRight}
        </div>
      </div>

      {/* Grid Container with Sticky Header */}
      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-bg-100" ref={gridRef} onMouseDown={(e) => handleMouseDown(e, 'create')}>
        
        {/* Sticky Header Days */}
        <div className="flex sticky top-0 z-30 bg-bg-200 shadow-sm">
          <div className="w-[48px] flex-shrink-0 border-r border-bg-400"></div>
          {DAYS_SHORT.map((day, i) => {
            let dateStr = '';
            if (mode === 'specific_week' && weekStartDate) {
              const d = new Date(weekStartDate);
              d.setDate(d.getDate() + i);
              dateStr = d.getDate() + '.' + (d.getMonth()+1);
            }
            const hasOverride = mode === 'specific_week' && hasOverridesMap?.[i];

            return (
              <div key={i} className="flex-1 text-center py-2 flex flex-col relative group border-r border-bg-300 last:border-r-0">
                <span className="font-bold text-text-900 text-sm">{day} {dateStr}</span>
                {hasOverride && <span className="text-[10px] text-accent-500 font-bold uppercase">Wyjątek</span>}
                
                {mode === 'specific_week' && hasOverride && (
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-40">
                    <button onClick={(e) => { e.stopPropagation(); handleRevertDay(i); }} className="p-1 bg-red-500 text-bg-100 rounded text-[10px] font-bold shadow-md" title="Przywróć rutynę">Usuń</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Grid Content Wrapper */}
        <div className="relative w-full" style={{ height: '1152px' }}>
          {/* Background Grid Lines */}
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

          {/* Blocks */}
          <div className="absolute inset-0 z-10 pointer-events-none">
            {currentDisplayBlocks.map(block => {
              const top = block.startHour * 48;
              const height = (block.endHour - block.startHour) * 48;
              const left = `calc(48px + (100% - 48px) / 7 * ${block.dayIndex})`;
              const width = `calc((100% - 48px) / 7)`;
              const isActive = activeModalBlock?.id === block.id;
              
              return (
                <div 
                  key={block.id}
                  id={`timeblock-${block.id}`}
                  className={`absolute rounded-md shadow-sm flex flex-col group pointer-events-auto transition-shadow hover:shadow-md ${STATUS_COLORS[block.status] || STATUS_COLORS['available']} ${isActive ? 'ring-2 ring-text-900 ring-offset-1 ring-offset-bg-100 z-30' : 'z-10'}`}
                  style={{ top: `${top}px`, height: `${height}px`, left, width, margin: '0 2px', width: 'calc((100% - 48px) / 7 - 4px)' }}
                >
                  <div 
                    className="absolute left-0 w-full cursor-ns-resize hover:bg-black/20 z-20"
                    style={{ top: '-4px', height: '12px' }}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-top', block.id); }}
                  />
                  
                  <div 
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-move z-10"
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'move', block.id); }}
                  >
                    <span className="text-xs font-bold whitespace-nowrap opacity-90 text-bg-100 select-none pointer-events-none">{formatHour(block.startHour)} - {formatHour(block.endHour)}</span>
                  </div>
                  
                  <div 
                    className="absolute left-0 w-full cursor-ns-resize hover:bg-black/20 z-20"
                    style={{ bottom: '-4px', height: '12px' }}
                    onMouseDown={(e) => { e.stopPropagation(); handleMouseDown(e, 'resize-bottom', block.id); }}
                  />
                </div>
              )
            })}
            {renderGhostBlock()}
          </div>
        </div>

        {/* Popover Menu for Editing Block */}
        {activeModalBlock && menuCoords && (
          <>
            <div 
              className="fixed inset-0 z-[9998]" 
              onClick={(e) => { e.stopPropagation(); setActiveModalBlock(null); }} 
              onMouseDown={(e) => e.stopPropagation()} 
            />
            <div 
              className="fixed z-[9999] bg-bg-200 shadow-2xl rounded-lg border border-bg-400 p-4 w-[320px] flex flex-col gap-3"
              style={{ 
                left: menuCoords.left, 
                bottom: menuCoords.bottom,
                transform: menuCoords.alignRight ? 'translateX(-100%)' : 'none'
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-1">
                 <span className="font-bold text-text-900 text-sm">Edytuj Blok Dostępności</span>
                 <button onClick={() => setActiveModalBlock(null)} className="text-text-500 hover:text-text-900"><X className="w-4 h-4" /></button>
              </div>
              
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-text-700 mb-1">Od</label>
                  <Input 
                    type="time"
                    value={formatHour(activeModalBlock.startHour)}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const val = h + (m / 60);
                      setBlocks(prev => prev.map(b => b.id === activeModalBlock.id ? { ...b, startHour: val } : b));
                      setActiveModalBlock(prev => prev ? { ...prev, startHour: val } : null);
                      markAction(activeModalBlock.dayIndex);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-text-700 mb-1">Do</label>
                  <Input 
                    type="time"
                    value={formatHour(activeModalBlock.endHour)}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number);
                      const val = h + (m / 60);
                      setBlocks(prev => prev.map(b => b.id === activeModalBlock.id ? { ...b, endHour: val } : b));
                      setActiveModalBlock(prev => prev ? { ...prev, endHour: val } : null);
                      markAction(activeModalBlock.dayIndex);
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-1.5 mt-1">
                 <button 
                   onClick={() => {
                     setBlocks(prev => prev.map(b => b.id === activeModalBlock.id ? { ...b, status: 'available' } : b));
                     setActiveModalBlock(prev => prev ? { ...prev, status: 'available' } : null);
                     markAction(activeModalBlock.dayIndex);
                   }} 
                   className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all border ${activeModalBlock.status === 'available' ? 'bg-green-500 text-green-900 border-green-600 shadow-sm' : 'bg-bg-100 text-text-600 border-bg-400 hover:bg-green-500/20 hover:text-green-600'}`}
                 >
                   Dostępny
                 </button>
                 <button 
                   onClick={() => {
                     setBlocks(prev => prev.map(b => b.id === activeModalBlock.id ? { ...b, status: 'maybe' } : b));
                     setActiveModalBlock(prev => prev ? { ...prev, status: 'maybe' } : null);
                     markAction(activeModalBlock.dayIndex);
                   }} 
                   className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all border ${activeModalBlock.status === 'maybe' ? 'bg-yellow-500 text-yellow-900 border-yellow-600 shadow-sm' : 'bg-bg-100 text-text-600 border-bg-400 hover:bg-yellow-500/20 hover:text-yellow-600'}`}
                 >
                   Być może
                 </button>
              </div>

              <Button variant="danger" onClick={() => {
                setBlocks(prev => prev.filter(b => b.id !== activeModalBlock.id));
                markAction(activeModalBlock.dayIndex);
                setActiveModalBlock(null);
              }}>
                Usuń Blok
              </Button>
            </div>
          </>
        )}

      </div>

    </div>
  );
}
