'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export interface SeasonWinner {
  name: string;
  pfpSrc?: string;
}

interface SeasonBannerProps {
  year: string;
  url: string;
  image: string;
  winner?: SeasonWinner | null;
  isCurrent?: boolean;
}

export function SeasonBanner({ year, url, image, winner, isCurrent }: SeasonBannerProps) {
  return (
    <Link
      href={url}
      className="group relative w-full rounded-md overflow-hidden bg-bg-200 p-5 sm:p-6 md:p-7 flex items-center justify-between gap-4 transition-all duration-200 block cursor-pointer select-none"
    >
      {/* Background Image with subtle zoom on hover */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-105"
        style={{ backgroundImage: `url('${image}')` }}
      />

      {/* Dark gradient overlay ensuring high contrast everywhere */}
      <div className="absolute inset-0 bg-gradient-to-t from-bg-100 via-bg-100/90 to-bg-100/70 sm:bg-gradient-to-r sm:from-bg-100 sm:via-bg-100/85 sm:to-bg-100/50" />

      {/* Left side: Season Title & Winner */}
      <div className="relative z-10 flex flex-col gap-1.5 min-w-0">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight group-hover:text-slate-100 transition-colors">
          Sezon {year}
        </h2>

        {/* Winner info underneath */}
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] font-semibold text-text-500 uppercase tracking-wider">
            Zwycięzca:
          </span>
          {winner ? (
            <div className="flex items-center gap-1.5">
              <img
                src={winner.pfpSrc || '/img/default_pfp.webp'}
                alt={winner.name}
                className="w-5 h-5 rounded-full object-cover shrink-0 border border-bg-300"
              />
              <span className="text-xs sm:text-sm font-bold text-white group-hover:text-slate-100 transition-colors truncate">
                {winner.name}
              </span>
            </div>
          ) : (
            <span className="text-xs sm:text-sm text-text-500 italic font-medium">
              {isCurrent ? 'W trakcie' : 'Brak zwycięzcy'}
            </span>
          )}
        </div>
      </div>

      {/* Right side: Top-right Arrow CTA */}
      <div className="relative z-10 shrink-0 self-center">
        <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-text-500 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
      </div>
    </Link>
  );
}

export default SeasonBanner;
