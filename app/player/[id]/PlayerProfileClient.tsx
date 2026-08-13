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
      badge: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-s-glow animate-s-pulse border border-yellow-300',
      bar: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      tableBadge: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-yellow-300'
    },
    a: {
      badge: 'bg-purple-600 text-white border border-purple-400',
      bar: 'bg-purple-600 text-white',
      tableBadge: 'bg-purple-600 text-white border-purple-400'
    },
    b: {
      badge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border border-blue-300',
      bar: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white',
      tableBadge: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-blue-300'
    },
    c: {
      badge: 'bg-gray-500 text-white border border-gray-400',
      bar: 'bg-gray-500 text-white',
      tableBadge: 'bg-gray-500 text-white border-gray-400'
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6 font-sans">
      <style>{`
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 10px 2px rgba(245, 158, 11, 0.6); }
          50% { box-shadow: 0 0 25px 8px rgba(245, 158, 11, 1); }
        }
        .animate-s-pulse {
          animation: pulseGlow 2s infinite;
        }
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
        className="w-full h-72 rounded-xl flex flex-col justify-center items-center relative overflow-hidden shadow-lg border border-bg-400"
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
          
          <div className="flex gap-4 relative z-10">
            {(['s', 'a', 'b', 'c'] as const).map(tier => {
              const count = wonTournamentsByTier[tier].length;
              if (count === 0) return null;

              return (
                <button 
                  key={tier}
                  onClick={() => handleBadgeClick(tier)}
                  className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all hover:scale-105 ${tierStyles[tier].badge} ${activeTier === tier ? 'opacity-100 scale-105' : 'opacity-90'}`}
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
          <div className="w-full overflow-hidden rounded-xl border border-bg-400">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse bg-bg-100">
                <thead>
                  <tr className="bg-accent-500 text-white uppercase text-xs md:text-sm tracking-wide">
                    <th className="py-4 px-6 font-semibold">Nazwa</th>
                    <th className="py-4 px-6 font-semibold text-center">Pos.</th>
                    <th className="py-4 px-6 font-semibold text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-400">
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
                        <tr key={t.id || i} className="hover:bg-bg-400 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100">
                          <td className="py-4 px-6 text-sm font-medium text-text-900">
                            <div className="flex items-center gap-2">
                              {t.page_exists ? (
                                <Link href={`/${t.page_url}`} className="hover:text-accent-600 transition-colors font-bold flex items-center gap-1 group-hover:underline">
                                  {t.displayed_name}
                                  <ExternalLink className="w-4 h-4 text-accent-500 opacity-70 group-hover:opacity-100" />
                                </Link>
                              ) : (
                                <span className="font-bold">{t.displayed_name}</span>
                              )}
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${smallBadgeClass}`}>
                                {t.details?.tier ?? '?'}-Tier
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
          <div className="w-full overflow-hidden rounded-xl border border-bg-400 h-fit">
            <table className="w-full text-left border-collapse bg-bg-100">
              <thead>
                <tr className="bg-accent-500 text-white uppercase text-xs md:text-sm tracking-wide">
                  <th colSpan={2} className="py-4 px-6 font-semibold text-center">Statystyki</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bg-400">
                <tr className="hover:bg-bg-400 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100">
                  <td className="py-4 px-6 text-sm font-medium text-text-700">Ranking KKOL</td>
                  <td className="py-4 px-6 text-sm font-bold text-text-900 text-right">{ranking.ranking}</td>
                </tr>
                <tr className="hover:bg-bg-400 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100">
                  <td className="py-4 px-6 text-sm font-medium text-text-700">S-Score</td>
                  <td className="py-4 px-6 text-sm font-bold text-text-900 text-right">{ranking.majorRanking}</td>
                </tr>
                <tr className="hover:bg-bg-400 transition-colors duration-150 group even:bg-bg-200 odd:bg-bg-100">
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
