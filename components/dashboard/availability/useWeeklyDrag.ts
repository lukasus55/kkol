'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TimeBlock } from './types';
import { useGridAutoScroll } from './useGridAutoScroll';

interface UseWeeklyDragProps {
  gridRef: React.RefObject<HTMLDivElement | null>;
  blocks: TimeBlock[];
  readOnly?: boolean;
  onCommitBlocks: (newBlocks: TimeBlock[], activeId: string, dayIndex: number) => void;
  onBlockClick: (block: TimeBlock, clientX: number, clientY: number) => void;
}

export function useWeeklyDrag({
  gridRef,
  blocks,
  readOnly,
  onCommitBlocks,
  onBlockClick
}: UseWeeklyDragProps) {
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

  const wasDraggingRef = useRef(false);

  const getHourFromMouse = useCallback((e: { clientY: number }) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const scrollY = gridRef.current.scrollTop;
    const rawHour = (y + scrollY) / 48;
    return Math.max(0, Math.min(24, Math.round(rawHour * 2) / 2));
  }, [gridRef]);

  const getDayFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!gridRef.current) return 0;
    const rect = gridRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 48;
    if (x < 0) return 0;
    const dayWidth = (rect.width - 48) / 7;
    return Math.max(0, Math.min(6, Math.floor(x / dayWidth)));
  }, [gridRef]);

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

  const handleMouseDown = (
    e: React.MouseEvent,
    action: 'create' | 'move' | 'resize-top' | 'resize-bottom',
    blockId?: string
  ) => {
    if (readOnly) return;
    if (e.button !== 0) return;
    // On mobile touch screens, do not initiate mouse dragging
    if (typeof window !== 'undefined' && 'ontouchstart' in window && window.innerWidth < 768) {
      return;
    }

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

    const handleMouseUp = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      dragClientYRef.current = null;
      stopAutoScroll();

      const state = dragStateRef.current;
      const { action, dayIndex, startHour, currentHour, blockId, originalBlock } = state;

      if (blockId && originalBlock && startHour !== null && currentHour !== null && Math.abs(currentHour - startHour) < 0.1) {
        onBlockClick(originalBlock, e.clientX, e.clientY);
        setDragState({ isDragging: false, dayIndex: null, startHour: null, currentHour: null, action: null, blockId: null, originalBlock: null });
        return;
      }

      if (dayIndex === null || startHour === null || currentHour === null) {
        setDragState({ isDragging: false, dayIndex: null, startHour: null, currentHour: null, action: null, blockId: null, originalBlock: null });
        return;
      }

      wasDraggingRef.current = true;
      setTimeout(() => { wasDraggingRef.current = false; }, 100);

      let newBlocks = [...blocks];
      let activeId = blockId;
      let targetDayIndex = dayIndex;

      if (action === 'create') {
        const s = Math.min(startHour, currentHour);
        const eHour = Math.max(startHour, currentHour);
        if (eHour - s > 0) {
          activeId = 'temp-' + Date.now();
          newBlocks.push({ id: activeId, dayIndex, startHour: s, endHour: eHour, status: 'available' });
          onCommitBlocks(newBlocks, activeId, dayIndex);
        }
      } else if (blockId && originalBlock) {
        const blockIndex = newBlocks.findIndex(b => b.id === blockId);
        if (blockIndex > -1) {
          const block = { ...newBlocks[blockIndex] };
          targetDayIndex = block.dayIndex;
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
          onCommitBlocks(newBlocks, blockId, targetDayIndex);
        }
      }

      setDragState({ isDragging: false, dayIndex: null, startHour: null, currentHour: null, action: null, blockId: null, originalBlock: null });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [stopAutoScroll, getHourFromMouse, blocks, onCommitBlocks, onBlockClick]);

  return {
    dragState,
    handleMouseDown,
    getDayFromMouse,
    getHourFromMouse,
    wasDraggingRef
  };
}
