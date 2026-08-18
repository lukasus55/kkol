'use client';

import React, { useState } from 'react';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  forceHidden?: boolean;
}

export function Tooltip({ children, content, className = '', forceHidden = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      onMouseEnter={(e) => { setIsVisible(true); setPos({ x: e.clientX, y: e.clientY }); }}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && !forceHidden && (
        <div
          className="fixed z-[99999] px-3 py-2 bg-bg-100 border border-bg-400 text-text-900 text-xs font-medium rounded-md shadow-2xl whitespace-nowrap pointer-events-none transform -translate-x-1/2 -translate-y-[calc(100%+12px)] animate-in fade-in zoom-in-95 duration-100"
          style={{ top: pos.y, left: pos.x }}
        >
          {content}
        </div>
      )}
    </div>
  );
}
