'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConfirmationPopup } from '../../ui/ConfirmationPopup';
import { TimeBlock, WeeklyTimeGridProps } from './types';
import { normalizeBlocks } from './normalizeBlocks';
import { useGridAutoScroll } from './useGridAutoScroll';
import { BlockEditPopover } from './BlockEditPopover';
import { TimeBlockItem } from './TimeBlockItem';
import { DaysHeader } from './DaysHeader';
import { GridBackground } from './GridBackground';

export type { TimeBlock };

export default function WeeklyTimeGrid({
  mode,
  weekStartDate,
  initialBlocks,
  onSaveRoutine,
  onSaveDayOverride,
  hasOverridesMap,
  headerLeft,
  headerRight
}: WeeklyTimeGridProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ left: number; bottom: number; alignRight: boolean } | null>(null);
  const [revertPopupState, setRevertPopupState] = useState<{ isOpen: boolean; dayIdx: number | null }>({ isOpen: false, dayIdx: null });
  const [activeModalBlock, setActiveModalBlock] = useState<TimeBlock | null>(null);

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
  
  const dragStateRef = useRef(dragState);
  useEffect(() => { dragStateRef.current = dragState; }, [dragState]);

  useEffect(() => { setBlocks(initialBlocks); }, [initialBlocks]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveModalBlock(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const getHourFromMouse = useCallback((e: { clientY: number }) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const scrollY = gridRef.current.scrollTop;
    const rawHour = (y + scrollY) / 48;
    return Math.max(0, Math.min(24, Math.round(rawHour * 2) / 2));
  }, []);

  const getDayFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 48;
    if (x < 0) return 0;
    const dayWidth = (rect.width - 48) / 7;
    return Math.max(0, Math.min(6, Math.floor(x / dayWidth)));
  }, []);

  const handleHourChange = useCallback((hour: number) => {
    setDragState(prev => {
      if (prev.currentHour === hour) return prev;
      const next = { ...prev, currentHour: hour };
      dragStateRef.current = next;
      return next;
    });
  }, []);

  const { isDraggingRef, dragClientYRef, startAutoScroll, stopAutoScroll } = useGridAutoScroll({
    gridRef,
    getHourFromMouse,
    onHourChange: handleHourChange
  });

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
      lastSavedActionCount.current = userActionCount;
      if (mode === 'routine' && onSaveRoutine) {
        onSaveRoutine(blocks);
      } else if (mode === 'specific_week' && onSaveDayOverride && weekStartDate) {
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

  const handleMouseDown = (e: React.MouseEvent, action: 'create' | 'move' | 'resize-top' | 'resize-bottom', blockId?: string) => {
    if (e.button !== 0) return;
    const day = getDayFromMouse(e);
    const hour = getHourFromMouse(e);
    const original = blockId ? blocks.find(b => b.id === blockId) || null : null;

    const nextState = {
      isDragging: true,
      dayIndex: day,
      startHour: hour,
      currentHour: hour,
      action,
      blockId: blockId || null,
      originalBlock: original ? { ...original } : null
    };

    isDraggingRef.current = true;
    dragStateRef.current = nextState;
    dragClientYRef.current = e.clientY;
    setDragState(nextState);

    startAutoScroll();
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      dragClientYRef.current = e.clientY;
      const hour = getHourFromMouse(e);
      setDragState(prev => {
        if (prev.currentHour === hour) return prev;
        const next = { ...prev, currentHour: hour };
        dragStateRef.current = next;
        return next;
      });
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      dragClientYRef.current = null;
      stopAutoScroll();

      const state = dragStateRef.current;
      const { action, dayIndex, startHour, currentHour, blockId, originalBlock } = state;

      if (blockId && originalBlock && startHour !== null && currentHour !== null && Math.abs(currentHour - startHour) < 0.1) {
        setActiveModalBlock(originalBlock);
        const el = document.getElementById(`timeblock-${blockId}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const centerY = rect.top + rect.height / 2;
          const centerX = rect.left + rect.width / 2;
          let left = centerX + 10;
          let alignRight = false;
          if (left + 320 > window.innerWidth) {
            left = centerX - 10;
            alignRight = true;
          }
          setMenuCoords({ left, bottom: window.innerHeight - centerY, alignRight });
        }
        setDragState({ isDragging: false, dayIndex: null, startHour: null, currentHour: null, action: null, blockId: null, originalBlock: null });
        return;
      }

      setBlocks(prev => {
        let newBlocks = [...prev];
        if (dayIndex === null || startHour === null || currentHour === null) return prev;
        markAction(dayIndex);
        let activeId = blockId;

        if (action === 'create') {
          const s = Math.min(startHour, currentHour);
          const e = Math.max(startHour, currentHour);
          if (e - s > 0) {
            activeId = 'temp-' + Date.now();
            newBlocks.push({ id: activeId, dayIndex, startHour: s, endHour: e, status: 'available' });
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

        return activeId ? normalizeBlocks(newBlocks, activeId) : newBlocks;
      });

      setDragState({ isDragging: false, dayIndex: null, startHour: null, currentHour: null, action: null, blockId: null, originalBlock: null });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stopAutoScroll, getHourFromMouse]);

  const confirmRevertDay = () => {
    if (revertPopupState.dayIdx === null || !onSaveDayOverride || !weekStartDate) return;
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + revertPopupState.dayIdx);
    const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    onSaveDayOverride(dateStr, [], true);
  };

  const updateBlock = (blockId: string, updates: Partial<TimeBlock>) => {
    setBlocks(prev => {
      const mapped = prev.map(b => b.id === blockId ? { ...b, ...updates } : b);
      const normalized = normalizeBlocks(mapped, blockId);
      const newActive = normalized.find(b => b.id === blockId);
      if (newActive) setActiveModalBlock(newActive);
      return normalized;
    });
    if (activeModalBlock) markAction(activeModalBlock.dayIndex);
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
      <div className="flex items-center justify-between p-3 bg-bg-200">
        <div>{headerLeft}</div>
        <div className="flex items-center gap-4">{headerRight}</div>
      </div>

      <div className="flex-1 overflow-y-auto relative custom-scrollbar bg-bg-100" ref={gridRef} onMouseDown={(e) => handleMouseDown(e, 'create')}>
        <DaysHeader 
          mode={mode} 
          weekStartDate={weekStartDate} 
          hasOverridesMap={hasOverridesMap} 
          onRevertDay={(dayIdx) => setRevertPopupState({ isOpen: true, dayIdx })} 
        />

        <div className="relative w-full" style={{ height: '1152px' }}>
          <GridBackground />

          <div className="absolute inset-0 z-10 pointer-events-none">
            {currentDisplayBlocks.map(block => (
              <TimeBlockItem 
                key={block.id}
                block={block}
                isActive={activeModalBlock?.id === block.id}
                isDragging={dragState.isDragging && dragState.blockId === block.id}
                onMouseDown={handleMouseDown}
              />
            ))}

            {dragState.isDragging && dragState.action === 'create' && dragState.dayIndex !== null && dragState.startHour !== null && dragState.currentHour !== null && dragState.startHour !== dragState.currentHour && (
              <div 
                className="absolute bg-accent-500/40 border border-accent-500/80 rounded-md pointer-events-none z-[40]"
                style={{
                  left: `calc(48px + (100% - 48px) / 7 * ${dragState.dayIndex})`,
                  width: 'calc((100% - 48px) / 7)',
                  top: `${Math.min(dragState.startHour, dragState.currentHour) * 48}px`,
                  height: `${Math.abs(dragState.currentHour - dragState.startHour) * 48}px`
                }}
              />
            )}
          </div>
        </div>

        {activeModalBlock && menuCoords && (
          <BlockEditPopover 
            block={activeModalBlock}
            coords={menuCoords}
            onClose={() => setActiveModalBlock(null)}
            onUpdateStartHour={(hour) => updateBlock(activeModalBlock.id, { startHour: hour })}
            onUpdateEndHour={(hour) => updateBlock(activeModalBlock.id, { endHour: hour })}
            onUpdateStatus={(status) => updateBlock(activeModalBlock.id, { status })}
            onDelete={() => {
              setBlocks(prev => prev.filter(b => b.id !== activeModalBlock.id));
              markAction(activeModalBlock.dayIndex);
              setActiveModalBlock(null);
            }}
          />
        )}
      </div>

      <ConfirmationPopup 
        isOpen={revertPopupState.isOpen}
        title="Usuwanie wyjątku"
        message="Czy na pewno chcesz usunąć wszystkie wyjątki i <strong>przywrócić rutynę</strong> dla tego dnia?"
        confirmText="Tak, przywróć"
        onConfirm={confirmRevertDay}
        onClose={() => setRevertPopupState({ isOpen: false, dayIdx: null })}
      />
    </div>
  );
}
