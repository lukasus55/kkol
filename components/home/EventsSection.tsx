'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LinkButton } from '@/components/ui/LinkButton';

interface Standing {
    id: string;
    displayed_name: string;
    position: number;
}

interface Tournament {
    id: string;
    page_url?: string;
    finished: boolean;
    standings?: Standing[];
}

interface Player {
    id: string;
    displayed_name: string;
    pfp_base64?: string;
}

export default function EventsSection() {
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [players, setPlayers] = useState<Record<string, Player>>({});

    useEffect(() => {
        async function loadEventsData() {
            try {
                const [tRes, pRes] = await Promise.all([
                    fetch('/api/tournaments'),
                    fetch('/api/players')
                ]);
                const tData = await tRes.json();
                const pData = await pRes.json();
                setTournaments(Object.values(tData));
                setPlayers(pData);
            } catch (err) {
                console.error("Failed to load events data:", err);
            }
        }
        loadEventsData();
    }, []);

    const getWinner = (url: string) => {
        const tournament = tournaments.find(t => t.page_url === url);
        if (tournament?.finished && tournament.standings && tournament.standings.length > 0) {
            const topPosition = tournament.standings[0].position;
            const winners = tournament.standings.filter(s => s.position === topPosition);
            if (winners.length > 0) {
                const winner = winners[0];
                const player = players[winner.id];
                return {
                    name: player?.displayed_name || winner.displayed_name,
                    pfpSrc: player?.pfp_base64 ? `data:image/webp;base64,${player.pfp_base64}` : '/img/default_pfp.webp'
                };
            }
        }
        return null;
    };

    const renderCard = (year: string, url: string) => {
        const winner = getWinner(url);
        const isLive = year === '2026';

        return (
            <Link
                href={`/${url}`}
                className="group flex flex-col w-[80vw] sm:w-[28rem] h-56 sm:h-64 bg-bg-200 rounded-md overflow-hidden cursor-pointer shadow-sm transition-all duration-300 hover:-translate-y-1 relative shrink-0 snap-center transform-gpu"
            >
                {/* Live Indicator */}
                {isLive && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-sm flex items-center gap-1.5 z-10 shadow-sm">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                        W TRAKCIE
                    </div>
                )}

                {/* Image Section */}
                <div className="relative flex-1 w-full overflow-hidden bg-bg-100 rounded-t-md transform-gpu">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0 will-change-transform"
                        style={{ backgroundImage: `url('/img/home/events/kol${year}.webp')` }}
                    />
                    <div className="absolute inset-0 bg-blue-900/40 mix-blend-overlay transition-opacity duration-700 group-hover:opacity-0 pointer-events-none" />
                </div>

                {/* Bottom Bar */}
                <div className="relative h-12 sm:h-14 w-full flex items-center justify-center transition-colors duration-300 bg-bg-200 group-hover:bg-bg-300">

                    {/* Default state: Tournament Name */}
                    <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">
                        <span className="text-base sm:text-lg font-bold text-text-900 uppercase tracking-widest">
                            Sezon {year}
                        </span>
                    </div>

                    {/* Hover state: Winner Info */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
                        {winner ? (
                            <div className="flex items-center justify-center gap-2">
                                <img
                                    src={winner.pfpSrc}
                                    alt={winner.name}
                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover border border-white/20 shadow-sm"
                                />
                                <span className="text-sm sm:text-base font-bold text-white uppercase tracking-wider relative top-[1px] sm:top-[2px]">
                                    {winner.name}
                                </span>
                            </div>
                        ) : (
                            <span className="text-sm sm:text-base font-bold text-white uppercase tracking-widest">TBD</span>
                        )}
                    </div>
                </div>
            </Link>
        );
    };

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            // Check if mobile width, approximation based on typically available inner width
            const isMobile = window.innerWidth < 640;
            const scrollAmount = isMobile ? window.innerWidth * 0.8 + 16 : 472; // Card width + gap
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section className="w-full flex flex-col items-center">
            <h2 className="mb-6 sm:mb-8 text-3xl sm:text-4xl font-bold">Główne Wydarzenia</h2>

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

                    {renderCard('2026', '2026')}
                    {renderCard('2025', '2025')}
                    {renderCard('2024', '2024')}
                </div>

                <button
                    onClick={() => scroll('right')}
                    className="absolute right-2 sm:right-0 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-bg-300 rounded-full hover:bg-bg-400 transition-colors z-10 shadow-sm"
                >
                    <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-text-900" />
                </button>
            </div>

            <div className="mt-8">
                <LinkButton href="/events" variant="secondary">
                    Zobacz wszystkie wydarzenia
                </LinkButton>
            </div>
        </section>
    );
}