'use client';

import React from 'react';
import Link from 'next/link';
import { Users, ChevronRight } from 'lucide-react';
import { LiveAvailabilityStatus, SummaryFriendAvailability } from './types';
import { getStatusDetails } from './availabilityHelper';

interface AvailabilitySummaryCardProps {
  userStatus: LiveAvailabilityStatus;
  friends: SummaryFriendAvailability[];
}

export function AvailabilitySummaryCard({ userStatus, friends }: AvailabilitySummaryCardProps) {
  const myStatusDetails = getStatusDetails(userStatus);
  const availableCount = friends.filter((f) => f.status === 'available').length;

  return (
    <div className="w-full bg-bg-200 rounded-md p-5 sm:p-6 flex flex-col justify-between">
      {/* Header with integrated User Status Badge */}
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-bg-300 gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Users className="w-5 h-5 text-white shrink-0" />
          <h2 className="text-base sm:text-lg font-bold text-white tracking-wide leading-tight truncate">
            Dostępność
          </h2>
        </div>

        {/* Clickable user status badge linking directly to schedule editing */}
        <Link
          href="/dashboard/calendar/availability"
          title="Kliknij, aby zmienić grafik"
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-md bg-bg-100 hover:bg-bg-300 transition-colors group shrink-0"
        >
          <span className="text-[11px] text-text-500 font-medium hidden xs:inline">Twój status:</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full shrink-0 ${myStatusDetails.dotClass}`} />
            <span className={`text-xs ${myStatusDetails.textClass} group-hover:underline`}>
              {myStatusDetails.label}
            </span>
          </div>
        </Link>
      </div>

      {/* Friends Availability Section */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between text-[11px] font-semibold text-text-500 uppercase tracking-wider mb-2 px-1">
          <span>
            Rywale w turniejach {availableCount > 0 && `(${availableCount} dostępnych)`}
          </span>
          <Link
            href="/dashboard/calendar/shared"
            className="flex items-center gap-1 text-[11px] font-semibold text-text-500 hover:text-white transition-colors group"
          >
            <span>Pełny grafik</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {friends.length === 0 ? (
          <div className="py-4 text-center text-text-500 text-xs">
            Brak innych graczy w Twoich aktywnych turniejach.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-bg-300">
            {friends.slice(0, 5).map((f) => {
              const details = getStatusDetails(f.status);
              return (
                <Link
                  key={f.id}
                  href="/dashboard/calendar/shared"
                  className="flex items-center justify-between py-2 px-2.5 rounded-md hover:bg-bg-300 transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={f.pfpSrc || '/img/default_pfp.webp'}
                      alt={f.displayed_name}
                      className="w-5 h-5 rounded-full object-cover shrink-0"
                    />
                    <span className="truncate max-w-[140px] sm:max-w-[200px] text-xs sm:text-sm text-text-900 group-hover:text-white transition-colors">
                      {f.displayed_name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`w-2 h-2 rounded-full ${details.dotClass}`} />
                    <span className={`text-xs ${details.textClass}`}>{details.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
