'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RankingData {
    id: string;
    name: string;
    pfpSrc: string;
    ranking: string;
}

interface Tournament {
    id: string;
    finished: boolean;
    details: {
        tier: string;
    };
    standings: { id: string; position: number }[];
}

export default function PlayersSection() {
    const targetPlayers = ['kostys', 'damidami2', 'harnas', 'kukula'];
    const playerColors: Record<string, string> = {
        'kostys': '#6b2c2c', // red-ish
        'damidami2': '#1e3a5f', // blue-ish
        'harnas': '#a35d1f', // orange-ish
        'kukula': '#2a4d2e' // green-ish
    };

    const [players, setPlayers] = useState<any[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function load() {
            try {
                const [rankRes, tourRes] = await Promise.all([
                    fetch('/api/ranking'),
                    fetch('/api/tournaments')
                ]);
                const rankingList = await rankRes.json();
                const tournamentsData = await tourRes.json();
                const tournaments = Object.values(tournamentsData) as Tournament[];

                const mapped = targetPlayers.map(id => {
                    const rankData = rankingList.find((r: any) => r.id === id) || { ranking: 0, name: id, pfpSrc: '/img/default_pfp.webp' };

                    let sTierWins = 0;
                    tournaments.forEach(t => {
                        if (t.finished && t.details?.tier === 'S' && t.standings) {
                            const topPos = t.standings.length > 0 ? t.standings[0].position : null;
                            if (topPos === 1) {
                                const winners = t.standings.filter(s => s.position === 1);
                                if (winners.some(w => w.id === id)) {
                                    sTierWins++;
                                }
                            }
                        }
                    });

                    return {
                        id,
                        name: rankData.name,
                        pfpSrc: rankData.pfpSrc,
                        ranking: Number(rankData.ranking),
                        sTierWins,
                        color: playerColors[id] || 'transparent'
                    };
                });

                mapped.sort((a, b) => b.ranking - a.ranking);
                setPlayers(mapped);
            } catch (err) {
                console.error(err);
            }
        }
        load();
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const isMobile = window.innerWidth < 640;
            const scrollAmount = isMobile ? window.innerWidth * 0.8 + 16 : 312; // Card width (w-72 = 288px) + gap-6 (24px)
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="w-full flex flex-col items-center">
            <h2 className="mb-8 text-3xl sm:text-4xl font-bold">Wyróżnieni Gracze</h2>

            <div className="relative flex items-center w-full max-w-[1016px] px-8 sm:px-12">
                <button
                    onClick={() => scroll('left')}
                    className="absolute left-2 sm:left-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-bg-300 rounded-full hover:bg-bg-400 transition-colors z-10 shadow-sm"
                >
                    <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-text-900" />
                </button>

                <div
                    ref={scrollContainerRef}
                    className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth w-full mx-auto py-4"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    <style dangerouslySetInnerHTML={{ __html: `div::-webkit-scrollbar { display: none; }` }} />

                    {players.map((p, i) => (
                        <Link 
                            key={p.id} 
                            href={`/player/${p.id}`} 
                            style={{ '--hover-bg': p.color } as React.CSSProperties}
                            className={`group flex flex-col items-center p-6 sm:p-8 rounded-md shadow-sm transition-all duration-500 hover:-translate-y-1 bg-bg-200 hover:bg-[var(--hover-bg)] relative overflow-hidden isolate shrink-0 snap-center w-[80vw] sm:w-72`}
                        >

                            <div className="relative z-10 flex flex-col items-center w-full">
                                <div className="relative mb-4">
                                    <img src={p.pfpSrc} alt={p.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-bg-300 group-hover:border-white/20 shadow-md transition-all duration-500 group-hover:scale-105 group-hover:rotate-3" />
                                    <div className="absolute -bottom-2 -right-2 bg-bg-100 group-hover:bg-black/20 text-text-900 group-hover:text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-md border-2 border-transparent transition-colors duration-500">
                                        #{i + 1}
                                    </div>
                                </div>

                                <span className="text-xl sm:text-2xl font-bold text-text-900 group-hover:text-white uppercase tracking-widest mb-4 transition-colors duration-500">{p.name}</span>

                                <div className="w-full h-px bg-bg-400 group-hover:bg-white/20 mb-4 transition-colors duration-500" />

                                <div className="flex w-full justify-between px-2 gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-text-500 group-hover:text-white/70 mb-1 transition-colors duration-500">Ranking</div>
                                        <div className="text-lg sm:text-xl font-black text-text-900 group-hover:text-white transition-colors duration-500">{Number(p.ranking).toFixed(1)}</div>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-text-500 group-hover:text-white/70 mb-1 transition-colors duration-500">Mistrzostwa</div>
                                        <div className="text-lg sm:text-xl font-black text-text-900 group-hover:text-white transition-colors duration-500">{p.sTierWins}</div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 sm:right-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-bg-300 rounded-full hover:bg-bg-400 transition-colors z-10 shadow-sm"
                >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-text-900" />
                </button>
            </div>
        </section>
    );
}
