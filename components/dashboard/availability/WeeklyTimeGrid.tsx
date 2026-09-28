'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { ConfirmationPopup } from '../../ui/ConfirmationPopup';
import { Button } from '../../ui/Button';
import { TimeBlock, WeeklyTimeGridProps } from './types';
import { normalizeBlocks } from './normalizeBlocks';
import { BlockEditPopover } from './BlockEditPopover';
import { TimeBlockItem } from './TimeBlockItem';
import { DaysHeader } from './DaysHeader';
import { GridBackground } from './GridBackground';
import { MobileDaySelector } from './MobileDaySelector';
import { AddBlockModal } from './AddBlockModal';
import { useWeeklyDrag } from './useWeeklyDrag';

export type { TimeBlock };

export default function WeeklyTimeGrid({
  mode,
  weekStartDate,
  initialBlocks,
  onSaveRoutine,
  onSaveDayOverride,
  hasOverridesMap,
  isLoading,
  headerLeft,
  headerRight,
  readOnly
}: WeeklyTimeGridProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const gridRef = useRef<HTMLDivElement>(null);
  const [menuCoords, setMenuCoords] = useState<{ left: number; bottom: number; alignRight: boolean } | null>(null);
  const [revertPopupState, setRevertPopupState] = useState<{ isOpen: boolean; dayIdx: number | null }>({ isOpen: false, dayIdx: null });
  const [activeModalBlock, setActiveModalBlock] = useState<TimeBlock | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitial, setAddModalInitial] = useState<{ dayIndex: number; startHour: number; endHour: number }>({
    dayIndex: 0,
    startHour: 16,
    endHour: 18
  });

  const [selectedMobileDay, setSelectedMobileDay] = useState<number | 'all'>(() => {
    const d = new Date().getDay();
    return d === 0 ? 6 : d - 1;
  });
  const [isMobileScreen, setIsMobileScreen] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobileScreen(window.innerWidth < 768);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const isSingleDay = isMobileScreen && selectedMobileDay !== 'all';

  useEffect(() => { setBlocks(initialBlocks); }, [initialBlocks]);

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

  const handleOpenBlockEditor = useCallback((block: TimeBlock, clientX?: number, clientY?: number) => {
    setActiveModalBlock(block);
    let left = clientX ?? window.innerWidth / 2;
    let bottom = window.innerHeight - (clientY ?? window.innerHeight / 2);
    let alignRight = false;

    const el = document.getElementById(`timeblock-${block.id}`);
    if (el) {
      const rect = el.getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      const centerX = rect.left + rect.width / 2;
      left = centerX + 10;
      if (left + 320 > window.innerWidth) {
        left = centerX - 10;
        alignRight = true;
      }
      bottom = window.innerHeight - centerY;
    }
    setMenuCoords({ left, bottom, alignRight });
  }, []);

  const handleCommitBlocks = useCallback((newBlocks: TimeBlock[], activeId: string, dayIndex: number) => {
    markAction(dayIndex);
    setBlocks(normalizeBlocks(newBlocks, activeId));
  }, []);

  const { dragState, handleMouseDown, getDayFromMouse, wasDraggingRef } = useWeeklyDrag({
    gridRef,
    blocks,
    readOnly,
    onCommitBlocks: handleCommitBlocks,
    onBlockClick: handleOpenBlockEditor
  });

  const handleGridClick = (e: React.MouseEvent) => {
    if (readOnly || wasDraggingRef.current || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const scrollY = gridRef.current.scrollTop;
    const rawHour = (y + scrollY) / 48;
    const snappedHour = Math.floor(rawHour);
    const day = isSingleDay && typeof selectedMobileDay === 'number' 
      ? selectedMobileDay 
      : getDayFromMouse(e);

    setAddModalInitial({
      dayIndex: Math.max(0, Math.min(6, day)),
      startHour: Math.max(0, Math.min(23, snappedHour)),
      endHour: Math.max(1, Math.min(24, snappedHour + 1))
    });
    setIsAddModalOpen(true);
  };

  const handleAddBlock = (dayIndex: number, startHour: number, endHour: number, status: 'available' | 'maybe') => {
    const newId = 'temp-' + Date.now();
    const newBlock: TimeBlock = { id: newId, dayIndex, startHour, endHour, status };
    markAction(dayIndex);
    setBlocks(prev => normalizeBlocks([...prev, newBlock], newId));
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

  const confirmRevertDay = () => {
    if (revertPopupState.dayIdx === null || !onSaveDayOverride || !weekStartDate) return;
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + revertPopupState.dayIdx);
    const dateStr = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    onSaveDayOverride(dateStr, [], true);
  };

  const displayedBlocks = (isSingleDay ? blocks.filter(b => b.dayIndex === selectedMobileDay) : blocks).map(b => {
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
      } else if (dragState.action === 'resize-bottom') {
        ne = Math.min(24, Math.max(dragState.originalBlock.startHour + 0.5, dragState.originalBlock.endHour + diff));
      }
      return { ...b, startHour: ns, endHour: ne };
    }
    return b;
  });

  return (
    <div className="flex flex-col h-full bg-bg-100 rounded-md overflow-hidden relative">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 sm:p-3 bg-bg-200 border-b border-bg-300">
        <div>{headerLeft}</div>
        <div className="flex items-center gap-2 sm:gap-4">
          {!readOnly && (
            <Button
              variant="primary"
              onClick={() => {
                const day = typeof selectedMobileDay === 'number' ? selectedMobileDay : 0;
                setAddModalInitial({ dayIndex: day, startHour: 16, endHour: 18 });
                setIsAddModalOpen(true);
              }}
              className="hidden md:inline-flex text-sm py-1.5 px-3 gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Dodaj blok</span>
            </Button>
          )}
          {headerRight}
        </div>
      </div>

      <MobileDaySelector
        mode={mode}
        weekStartDate={weekStartDate}
        selectedDay={selectedMobileDay}
        onSelectDay={setSelectedMobileDay}
        blocks={blocks}
        hasOverridesMap={hasOverridesMap}
      />

      <div
        className="flex-1 overflow-y-auto relative custom-scrollbar bg-bg-100"
        ref={gridRef}
        onMouseDown={(e) => handleMouseDown(e, 'create')}
        onClick={handleGridClick}
      >
        <DaysHeader 
          mode={mode} 
          weekStartDate={weekStartDate} 
          hasOverridesMap={hasOverridesMap} 
          onRevertDay={(dayIdx) => setRevertPopupState({ isOpen: true, dayIdx })} 
          readOnly={readOnly}
          isSingleDayView={isSingleDay}
          selectedDayIndex={typeof selectedMobileDay === 'number' ? selectedMobileDay : 0}
        />

        <div className="relative w-full" style={{ height: '1152px' }}>
          <GridBackground isSingleDayView={isSingleDay} />

          <div className="absolute inset-0 z-10 pointer-events-none">
            {displayedBlocks.map(block => (
              <TimeBlockItem 
                key={block.id}
                block={block}
                isActive={activeModalBlock?.id === block.id}
                isDragging={dragState.isDragging && dragState.blockId === block.id}
                isSingleDayView={isSingleDay}
                onMouseDown={handleMouseDown}
                onSelectBlock={(b, e) => handleOpenBlockEditor(b, e?.clientX, e?.clientY)}
              />
            ))}

            {!isSingleDay && dragState.isDragging && dragState.action === 'create' && dragState.dayIndex !== null && dragState.startHour !== null && dragState.currentHour !== null && dragState.startHour !== dragState.currentHour && (
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

      {!readOnly && (
        <Button
          variant="primary"
          onClick={() => {
            const day = typeof selectedMobileDay === 'number' ? selectedMobileDay : 0;
            setAddModalInitial({ dayIndex: day, startHour: 16, endHour: 18 });
            setIsAddModalOpen(true);
          }}
          className="md:hidden fixed bottom-6 right-6 z-40 shadow-xl py-3 px-4 gap-2 text-sm font-bold"
        >
          <Plus className="w-5 h-5" />
          <span>Dodaj</span>
        </Button>
      )}

      <AddBlockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddBlock}
        mode={mode}
        weekStartDate={weekStartDate}
        initialDayIndex={addModalInitial.dayIndex}
        initialStartHour={addModalInitial.startHour}
        initialEndHour={addModalInitial.endHour}
      />

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
