'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  year: string;
  url: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  image: string;
}

const SLIDES: Slide[] = [
  {
    year: '2026',
    url: '/2026',
    badge: 'W TRAKCIE',
    badgeColor: 'bg-red-600 text-white',
    title: 'Sezon 2026 w toku',
    subtitle: 'Śledź zmagania w aż 11 wydarzeniach i 6 grach w trzeciej edycji Karwińskiej Olimpiady!',
    image: '/img/home/events/kol2026.webp'
  },
  {
    year: '2025',
    url: '/2025',
    badge: 'ZAKOŃCZONY',
    badgeColor: 'bg-bg-400 text-text-700',
    title: 'Sezon 2025',
    subtitle: 'Komplet punktów i wygrana Kostysia w drugim sezonie Karwińskiej Olimpiady.',
    image: '/img/home/events/kol2025.webp'
  },
  {
    year: '2024',
    url: '/2024',
    badge: 'ZAKOŃCZONY',
    badgeColor: 'bg-bg-400 text-text-700',
    title: 'Sezon 2024',
    subtitle: 'Inauguracyjna edycja Karwińskiej Olimpiady, która zapoczątkowała rywalizację.',
    image: '/img/home/events/kol2024.webp'
  }
];

export default function HeroBanner() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const touchStartY = React.useRef<number | null>(null);

  // Auto slide every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Trigger swipe only if horizontal movement is dominant and exceeds threshold (40px)
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        // Swipe left -> Next slide
        setCurrentIdx((prev) => (prev + 1) % SLIDES.length);
      } else {
        // Swipe right -> Previous slide
        setCurrentIdx((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const active = SLIDES[currentIdx];

  return (
    <div
      className="w-full relative rounded-md overflow-hidden bg-bg-200 h-64 sm:h-72 md:h-80 select-none group cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Whole card clickable link */}
      <Link href={active.url} className="absolute inset-0 z-20" aria-label={active.title}>
        <span className="sr-only">{active.title}</span>
      </Link>

      {/* Background Images with Crossfade and subtle hover scale */}
      {SLIDES.map((slide, idx) => {
        const isCurrent = idx === currentIdx;
        return (
          <div
            key={slide.year}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isCurrent ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              }`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
              style={{ backgroundImage: `url('${slide.image}')` }}
            />
            {/* Subtle dark gradient overlay for text readability without spatial shadows */}
            <div className="absolute inset-0 bg-gradient-to-t from-bg-100 via-bg-100/60 to-transparent md:bg-gradient-to-r md:from-bg-100 md:via-bg-100/70 md:to-transparent" />
          </div>
        );
      })}

      {/* Content Container (Text only, no button) */}
      <div className="relative z-20 pointer-events-none h-full max-w-xl p-6 sm:p-8 md:p-10 flex flex-col justify-end items-start pb-7 sm:pb-8 md:pb-9">
        <div className="mb-2">
          <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm ${active.badgeColor}`}>
            {active.badge}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight group-hover:text-slate-200 transition-colors">
          {active.title}
        </h1>

        <p className="mt-2 text-xs sm:text-sm text-text-600 line-clamp-2 max-w-md min-h-[2rem] sm:min-h-[2.5rem] flex items-start">
          {active.subtitle}
        </p>
      </div>

      {/* Pagination Dots */}
      <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5">
        {SLIDES.map((slide, idx) => (
          <button
            key={slide.year}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setCurrentIdx(idx);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIdx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
              }`}
            aria-label={`Przejdź do slajdu ${slide.year}`}
          />
        ))}
      </div>
    </div>
  );
}
