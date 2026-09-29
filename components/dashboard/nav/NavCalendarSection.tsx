'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Calendar, ChevronDown } from 'lucide-react';
import { useUser } from '../UserProvider';

interface NavCalendarSectionProps {
  pathname: string;
  onNavigate?: () => void;
}

export function NavCalendarSection({ pathname, onNavigate }: NavCalendarSectionProps) {
  const { isAdminMode } = useUser();
  const [isExpanded, setIsExpanded] = useState(pathname.startsWith('/dashboard/calendar'));
  const isCalendarActive = pathname.startsWith('/dashboard/calendar');

  return (
    <li className="group relative flex flex-col w-full">
      <div
        className={`flex items-center justify-between w-full h-9 rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${
          isCalendarActive && !isExpanded ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 text-sm">
          <Calendar className={`w-4 h-4 flex-shrink-0 transition-colors ${isAdminMode ? 'text-amber-400' : ''}`} />
          <span>Kalendarz</span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-text-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {isExpanded && (
        <div className="flex flex-col w-full mt-1">
          <div className="flex flex-col border-l border-bg-400 ml-[20px] pl-[10px] gap-1 py-1">
            <Link
              href="/dashboard/calendar"
              onClick={onNavigate}
              className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${
                pathname === '/dashboard/calendar' ? 'font-semibold text-text-900 bg-bg-300' : 'text-text-700'
              }`}
            >
              <span>Przegląd Wydarzeń</span>
            </Link>
            <Link
              href="/dashboard/calendar/availability"
              onClick={onNavigate}
              className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${
                pathname.startsWith('/dashboard/calendar/availability')
                  ? 'font-semibold text-text-900 bg-bg-300'
                  : 'text-text-700'
              }`}
            >
              <span>Moja Dostępność</span>
            </Link>
            <Link
              href="/dashboard/calendar/shared"
              onClick={onNavigate}
              className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${
                pathname.startsWith('/dashboard/calendar/shared')
                  ? 'font-semibold text-text-900 bg-bg-300'
                  : 'text-text-700'
              }`}
            >
              <span>Dostępność Innych</span>
            </Link>
          </div>
        </div>
      )}
    </li>
  );
}
