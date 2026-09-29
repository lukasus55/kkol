'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className = ''
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const delta = 1;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== 'ellipsis') {
        pages.push('ellipsis');
      }
    }
    return pages;
  };

  const pages = getPageNumbers();

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className={`flex items-center justify-between gap-3 pt-3 text-xs ${className}`}>
      {/* Items range info */}
      <div className="text-text-500 font-medium">
        {totalItems !== undefined && itemsPerPage !== undefined ? (
          <span>
            {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}–
            {Math.min(currentPage * itemsPerPage, totalItems)} z {totalItems}
          </span>
        ) : (
          <span>
            Strona <strong className="text-white">{currentPage}</strong> z <strong className="text-white">{totalPages}</strong>
          </span>
        )}
      </div>

      {/* Page controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-md text-text-600 hover:text-white hover:bg-bg-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1.5 text-text-500 select-none">
                …
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[28px] h-7 px-1.5 rounded-md font-semibold text-xs transition-colors ${
                isActive
                  ? 'bg-bg-300 text-white font-bold'
                  : 'text-text-600 hover:text-white hover:bg-bg-300'
              }`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-md text-text-600 hover:text-white hover:bg-bg-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          aria-label="Następna strona"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
