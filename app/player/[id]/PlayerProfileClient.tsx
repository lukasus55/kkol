'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

interface PlayerProfileClientProps {
  player: any;
  tournaments: any[];
  ranking: any;
  wonTournamentsByTier: { s: string[]; a: string[]; b: string[]; c: string[] };
}

export function PlayerProfileClient({ player, tournaments, ranking, wonTournamentsByTier }: PlayerProfileClientProps) {
  const [activeTier, setActiveTier] = useState<string | null>(null);
  const [displayedTier, setDisplayedTier] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scrollDist, setScrollDist] = useState(0);

  useEffect(() => {
    if (activeTier) {
      setDisplayedTier(activeTier);
    }
  }, [activeTier]);

  useEffect(() => {
    if (activeTier && scrollerRef.current && innerRef.current) {
      const containerW = scrollerRef.current.clientWidth;
      const innerW = innerRef.current.scrollWidth;
      if (innerW > containerW) {
        setScrollDist(innerW - containerW);
      } else {
        setScrollDist(0);
      }
    }
  }, [activeTier, wonTournamentsByTier]);

  const handleBadgeClick = (tier: string) => {
    setActiveTier(activeTier === tier ? null : tier);
  };

  const pfpSrc = player.pfp_base64
    ? (player.pfp_base64.startsWith('data:image') ? player.pfp_base64 : `data:image/webp;base64,${player.pfp_base64}`)
    : '/img/default_pfp.webp';

  const tierStyles: Record<string, { badge: string, bar: string, tableBadge: string }> = {
    s: {
      badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30',
      bar: 'bg-amber-500 text-bg-100',
      tableBadge: 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
    },
    a: {
      badge: 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30',
      bar: 'bg-purple-600 text-white',
      tableBadge: 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
    },
    b: {
      badge: 'bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30',
      bar: 'bg-sky-600 text-white',
      tableBadge: 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
    },
    c: {
      badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30',
      bar: 'bg-emerald-600 text-white',
      tableBadge: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 font-sans">
      <style>{`
        @keyframes pingPongScroll {
          0%, 10% { transform: translateX(0); }
          45%, 55% { transform: translateX(calc(var(--scroll-dist) * -1px)); }
          90%, 100% { transform: translateX(0); }
        }
        .animate-ping-pong {
          animation: pingPongScroll 12s linear infinite;
        }
      `}</style>

      {/* Banner */}
      <div
        className="w-full h-72 rounded-md flex flex-col justify-center items-center relative overflow-hidden shadow-lg"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${pfpSrc})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="flex flex-col items-center justify-center flex-grow">
          <h1 className="text-5xl font-bold text-white mb-4 relative z-10 drop-shadow-lg">
            {player.displayed_name}
          </h1>

          <div className="flex gap-3 relative z-10 flex-wrap justify-center">
            {(['s', 'a', 'b', 'c'] as const).map(tier => {
              const count = wonTournamentsByTier[tier].length;
              if (count === 0) return null;

              return (
                <button
                  key={tier}
                  onClick={() => handleBadgeClick(tier)}
                  className={`px-3.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${tierStyles[tier].badge} ${activeTier === tier ? 'ring-2 ring-white/50 scale-105' : 'opacity-90'}`}
                >
                  {count}x {tier.toUpperCase()}-Tier
                </button>
              );
            })}
          </div>
        </div>

        {/* Animated Bar attached to bottom */}
        <div
          className={`absolute bottom-0 left-0 w-full transition-all duration-500 ease-in-out flex items-center justify-center overflow-hidden
            ${activeTier ? 'h-12 translate-y-0' : 'h-0 translate-y-full'}
          `}
        >
          {/* Background layers for smooth crossfading */}
          <div className={`absolute inset-0 transition-opacity duration-500 ${displayedTier === 's' ? 'opacity-100' : 'opacity-0'} ${tierStyles.s.bar}`}></div>
          <div className={`absolute inset-0 transition-opacity duration-500 ${displayedTier === 'a' ? 'opacity-100' : 'opacity-0'} ${tierStyles.a.bar}`}></div>
          <div className={`absolute inset-0 transition-opacity duration-500 ${displayedTier === 'b' ? 'opacity-100' : 'opacity-0'} ${tierStyles.b.bar}`}></div>
          <div className={`absolute inset-0 transition-opacity duration-500 ${displayedTier === 'c' ? 'opacity-100' : 'opacity-0'} ${tierStyles.c.bar}`}></div>

          <div className={`w-full h-full flex items-center px-4 relative z-10 transition-opacity duration-300 ${activeTier ? 'opacity-100' : 'opacity-0'}`} ref={scrollerRef}>
            {displayedTier && (
              <div
                ref={innerRef}
                className={`flex items-center gap-8 whitespace-nowrap font-bold text-lg tracking-wider mx-auto text-white ${scrollDist > 0 ? 'animate-ping-pong' : ''}`}
                style={{ '--scroll-dist': scrollDist } as React.CSSProperties}
              >
                {wonTournamentsByTier[displayedTier as keyof typeof wonTournamentsByTier].length > 0 ? (
                  wonTournamentsByTier[displayedTier as keyof typeof wonTournamentsByTier].map((tName, i) => (
                    <span key={i}>{tName.toUpperCase()}</span>
                  ))
                ) : (
                  <span className="opacity-80 italic">BRAK WYGRANYCH TURNIEJÓW</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Tournaments & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Tournaments List */}
        <div className="md:col-span-2 space-y-4">
          <div className="w-full overflow-hidden rounded-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-bg-100">
                <thead>
                  <tr className="bg-bg-300 text-text-900 border-b border-bg-400 uppercase text-xs md:text-sm tracking-wide">
                    <th className="py-4 px-6 font-bold">Nazwa</th>
                    <th className="py-4 px-6 font-bold text-center">Pos.</th>
                    <th className="py-4 px-6 font-bold text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="">
                  {tournaments.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-text-500 font-medium">Brak przypisanych turniejów</td>
                    </tr>
                  ) : (
                    tournaments.map((t, i) => {
                      const isFinished = t.finished;
                      const standings = t.standings || [];
                      const playerStanding = standings.find((s: any) => s.id === player.id);
                      const position = playerStanding?.position;

                      const tTierKey = (t.details?.tier || '').toLowerCase();
                      const smallBadgeClass = tierStyles[tTierKey]?.tableBadge || 'bg-bg-300 text-text-600 border-bg-400';

                      return (
                        <tr key={t.id || i} className="hover:bg-bg-300 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100">
                          <td className="py-4 px-6 text-sm font-medium text-text-900">
                            <div className="flex items-center gap-2">
                              {t.page_exists ? (
                                <Link href={`/${t.page_url}`} className="hover:text-text-500 transition-colors font-bold flex items-center gap-1 group-hover:underline">
                                  {t.displayed_name}
                                  <ExternalLink className="w-4 h-4 text-text-700 opacity-70 group-hover:opacity-100" />
                                </Link>
                              ) : (
                                <span className="font-bold">{t.displayed_name}</span>
                              )}
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${smallBadgeClass}`}>
                                <span className="sm:hidden">{t.details?.tier ?? '?'}</span>
                                <span className="hidden sm:inline">{t.details?.tier ?? '?'}-Tier</span>
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-center font-bold text-text-800">
                            {position && isFinished ? `#${position}` : '-'}
                          </td>
                          <td className="py-4 px-6 text-sm text-right text-text-500 font-medium">
                            {t.details?.displayed_date ?? '-'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="md:col-span-1">
          <div className="w-full overflow-hidden rounded-md h-fit">
            <table className="w-full text-left border-collapse bg-bg-100">
              <thead>
                <tr className="bg-bg-300 text-text-900 border-b border-bg-400 uppercase text-xs md:text-sm tracking-wide">
                  <th colSpan={2} className="py-4 px-6 font-bold text-center">Statystyki</th>
                </tr>
              </thead>
              <tbody className="">
                <tr className="hover:bg-bg-300 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100">
                  <td className="py-4 px-6 text-sm font-medium text-text-700">Ranking KKOL</td>
                  <td className="py-4 px-6 text-sm font-bold text-text-900 text-right">{ranking.ranking}</td>
                </tr>
                <tr className="hover:bg-bg-300 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100">
                  <td className="py-4 px-6 text-sm font-medium text-text-700">S-Score</td>
                  <td className="py-4 px-6 text-sm font-bold text-text-900 text-right">{ranking.majorRanking}</td>
                </tr>
                <tr className="hover:bg-bg-300 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100">
                  <td className="py-4 px-6 text-sm font-medium text-text-700">AB-Score</td>
                  <td className="py-4 px-6 text-sm font-bold text-text-900 text-right">{ranking.minorRanking}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
