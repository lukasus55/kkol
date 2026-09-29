'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface TriviaFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: 'all' | 'pending' | 'used';
  onStatusChange: (val: 'all' | 'pending' | 'used') => void;
  counts: {
    total: number;
    pending: number;
    used: number;
  };
}

export function TriviaFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  counts,
}: TriviaFiltersProps) {
  const tabs = [
    { id: 'all' as const, label: 'Wszystkie', count: counts.total },
    { id: 'pending' as const, label: 'W kolejce', count: counts.pending },
    { id: 'used' as const, label: 'Wysłane', count: counts.used },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
      {/* Search Input */}
      <div className="relative flex-1 min-w-0">
        <Search className="w-4 h-4 text-text-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Szukaj w treści ciekawostek..."
          className="w-full bg-bg-200 text-text-900 border border-bg-400 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-text-900 transition-colors placeholder:text-text-500"
        />
      </div>

      {/* Status Pills */}
      <div className="flex items-center gap-1.5 bg-bg-200 p-1 rounded-md border border-bg-300 shrink-0 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = statusFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onStatusChange(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                isActive
                  ? 'bg-bg-100 text-text-900 border border-bg-400'
                  : 'text-text-700 hover:text-text-900 hover:bg-bg-300 border border-transparent'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                  isActive
                    ? 'bg-bg-300 text-text-900'
                    : 'bg-bg-100 text-text-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
