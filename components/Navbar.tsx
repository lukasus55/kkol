'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname() || '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  let navBg = "bg-bg-200 border-bg-300";
  let linkClass = "text-text-700 hover:text-white";
  let activeLinkClass = "text-white font-semibold after:content-[''] after:absolute after:bottom-1 after:left-1 after:right-1 after:h-[2px] after:bg-white";

  if (pathname.startsWith('/2024')) {
    navBg = "bg-[#00163a] border-[#1e295d]";
    linkClass = "text-[#A3BED0] hover:text-white";
    activeLinkClass = "text-white font-semibold after:content-[''] after:absolute after:bottom-1 after:left-1 after:right-1 after:h-[2px] after:bg-[#eaf6ff]";
  } else if (pathname.startsWith('/2025')) {
    navBg = "bg-[#251706] border-[#473016]";
    linkClass = "text-[#F4F5E9]/80 hover:text-[#FBAB18]";
    activeLinkClass = "text-[#FBAB18] font-semibold after:content-[''] after:absolute after:bottom-1 after:left-1 after:right-1 after:h-[2px] after:bg-[#FBAB18]";
  } else if (pathname.startsWith('/2026')) {
    navBg = "bg-[#1e2024] border-[#383b42]";
    linkClass = "text-[#b4c0cf] hover:text-[#8DC63F]";
    activeLinkClass = "text-[#8DC63F] font-semibold after:content-[''] after:absolute after:bottom-1 after:left-1 after:right-1 after:h-[2px] after:bg-[#8DC63F]";
  }

  const navLinks = [
    { label: 'Strona Główna', href: '/' },
    { label: 'Wydarzenia', href: '/events' },
    { label: 'Ranking', href: '/ranking' },
    { label: 'Profil', href: '/dashboard' },
  ];

  const isCurrent2026 = pathname.startsWith('/2026');

  return (
    <header className={`sticky top-0 left-0 w-full z-50 border-b transition-colors duration-300 ${navBg}`}>
      <div className="w-full max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <img
            src="/img/logos/kol-logo-horizontal.svg"
            alt="Karwińska Olimpiada"
            className="h-7 md:h-8 w-auto hidden sm:block"
          />
          <img
            src="/img/logos/kol-signet.svg"
            alt="Karwińska Olimpiada"
            className="h-8 w-auto sm:hidden"
          />
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {navLinks.map((link) => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors py-2 px-1 relative tracking-wide flex items-center ${isActive ? activeLinkClass : linkClass}`}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href="/2026"
            className={`relative group flex items-center gap-2 px-3.5 py-2 rounded-md font-semibold text-sm transition-all duration-300 overflow-hidden border ${isCurrent2026
              ? 'bg-lime-500/20 text-lime-400 border-lime-500/80 shadow-[0_0_12px_rgba(141,198,63,0.25)]'
              : 'bg-[#000000] hover:bg-bg-300 text-text-900 border-lime-500/40 hover:border-lime-400'
              }`}
          >
            <img
              src="/img/season_icon.webp"
              alt="Sezon 2026"
              className="w-4 h-4 object-contain relative z-10 transition-transform group-hover:scale-110"
            />
            <span className="relative z-10">Sezon 2026</span>

            <div className="absolute top-0 -left-[100%] w-[60%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 group-hover:left-[200%] transition-all duration-700 ease-in-out z-20 pointer-events-none" />
          </Link>
        </nav>

        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-md text-text-500 hover:text-white hover:bg-bg-300 transition-colors"
            aria-label="Przełącz menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Fullscreen Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 z-40 bg-bg-200 border-t border-bg-300 overflow-y-auto animate-in fade-in duration-200">
          <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col gap-3 min-h-full">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`py-1.5 px-4 rounded-md text-lg font-medium transition-all ${isActive
                    ? 'bg-bg-200 text-white font-semibold'
                    : 'text-text-600 hover:bg-bg-200 hover:text-white'
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="h-px bg-bg-300" />

            <Link
              href="/2026"
              className={`flex items-center justify-between py-3.5 px-4 rounded-md border text-lg font-semibold transition-all ${isCurrent2026
                ? 'bg-lime-500/20 text-lime-400 border-lime-500/80 shadow-[0_0_12px_rgba(141,198,63,0.25)]'
                : 'bg-[#000000] hover:bg-bg-300 text-white border-lime-500/40 hover:border-lime-400'
                }`}
            >
              <span className="flex items-center gap-3">
                <img src="/img/season_icon.webp" alt="Sezon 2026" className="w-5 h-5 object-contain" />
                Sezon 2026
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
