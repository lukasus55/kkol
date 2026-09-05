import { useRef, useEffect, useCallback } from 'react';

interface UseGridAutoScrollOptions {
  gridRef: React.RefObject<HTMLDivElement | null>;
  getHourFromMouse: (e: { clientY: number }) => number;
  onHourChange: (hour: number) => void;
}

export function useGridAutoScroll({
  gridRef,
  getHourFromMouse,
  onHourChange
}: UseGridAutoScrollOptions) {
  const isDraggingRef = useRef(false);
  const dragClientYRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const scrollLoop = useCallback(() => {
    if (!isDraggingRef.current) return;

    if (dragClientYRef.current !== null && gridRef.current) {
      const y = dragClientYRef.current;
      const rect = gridRef.current.getBoundingClientRect();
      const winHeight = window.innerHeight;
      const scrollSpeed = 32;
      const zone = 80;

      let scrolled = false;

      // Scroll internal calendar container
      if (y < rect.top + zone) {
        if (gridRef.current.scrollTop > 0) {
          gridRef.current.scrollTop -= scrollSpeed;
          scrolled = true;
        }
      } else if (y > rect.bottom - zone) {
        const maxScroll = gridRef.current.scrollHeight - gridRef.current.clientHeight;
        if (gridRef.current.scrollTop < maxScroll) {
          gridRef.current.scrollTop += scrollSpeed;
          scrolled = true;
        }
      }

      // Scroll window / page (when dragged outside or near viewport edges)
      if (y < zone) {
        if (window.scrollY > 0) {
          window.scrollBy(0, -scrollSpeed);
          scrolled = true;
        }
      } else if (y > winHeight - zone || y > rect.bottom) {
        window.scrollBy(0, scrollSpeed);
        scrolled = true;
      }

      if (scrolled) {
        const hour = getHourFromMouse({ clientY: y });
        onHourChange(hour);
      }
    }

    if (isDraggingRef.current) {
      animationFrameRef.current = requestAnimationFrame(scrollLoop);
    }
  }, [gridRef, getHourFromMouse, onHourChange]);

  const startAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(scrollLoop);
  }, [scrollLoop]);

  const stopAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAutoScroll();
    };
  }, [stopAutoScroll]);

  return {
    isDraggingRef,
    dragClientYRef,
    startAutoScroll,
    stopAutoScroll
  };
}
