'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Select } from '@/components/ui/Select';

interface UsersFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  roleFilter: string;
  onRoleChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
}

export function UsersFilters({
  search,
  onSearchChange,
  roleFilter,
  onRoleChange,
  statusFilter,
  onStatusChange,
}: UsersFiltersProps) {
  const roleOptions = [
    { value: 'all', label: 'Wszystkie role' },
    { value: 'admin', label: 'Administratorzy' },
    { value: 'organizer', label: 'Organizatorzy' },
    { value: 'player', label: 'Gracze' },
  ];

  const statusOptions = [
    { value: 'all', label: 'Wszystkie statusy' },
    { value: 'active', label: 'Tylko aktywni' },
    { value: 'inactive', label: 'Tylko zablokowani' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-text-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Szukaj po nazwie lub loginie..."
          className="w-full bg-bg-200 text-text-900 border border-bg-400 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-text-900 transition-colors placeholder:text-text-500"
        />
      </div>

      {/* Role Filter */}
      <div className="w-full sm:w-48">
        <Select
          value={roleFilter}
          onChange={onRoleChange}
          options={roleOptions}
        />
      </div>

      {/* Status Filter */}
      <div className="w-full sm:w-48">
        <Select
          value={statusFilter}
          onChange={onStatusChange}
          options={statusOptions}
        />
      </div>
    </div>
  );
}
