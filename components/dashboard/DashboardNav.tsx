'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, Trophy, PieChart, LogOut, Shield } from 'lucide-react';

import { checkHasUnansweredPolls } from './polls/pollChecker';
import { useUser } from './UserProvider';
import { NavCalendarSection } from './nav/NavCalendarSection';
import { NavAdminSection } from './nav/NavAdminSection';
import { NavUserProfile } from './nav/NavUserProfile';

interface DashboardNavProps {
  user: any;
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname() || '';
  const { isAdminMode, toggleAdminMode } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hasUnansweredPolls, setHasUnansweredPolls] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Check if user has open polls to fill
  useEffect(() => {
    let isMounted = true;
    checkHasUnansweredPolls(user).then((res) => {
      if (isMounted) setHasUnansweredPolls(res);
    });
    return () => {
      isMounted = false;
    };
  }, [user, pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  // Determine active section name for mobile header
  const getActiveTitle = () => {
    if (pathname === '/dashboard/summary' || pathname === '/dashboard') return 'Podsumowanie';
    if (pathname === '/dashboard/account') return 'Konto';
    if (pathname.startsWith('/dashboard/tournaments')) return 'Turnieje';
    if (pathname === '/dashboard/calendar') return 'Kalendarz: Wydarzenia';
    if (pathname.startsWith('/dashboard/calendar/availability')) return 'Kalendarz: Moja Dostępność';
    if (pathname.startsWith('/dashboard/calendar/shared')) return 'Kalendarz: Dostępność Innych';
    if (pathname.startsWith('/dashboard/calendar')) return 'Kalendarz';
    if (pathname.startsWith('/dashboard/polls')) return 'Głosowania';
    if (pathname.startsWith('/dashboard/admin/users')) return 'Admin: Użytkownicy';
    if (pathname.startsWith('/dashboard/admin/trivia')) return 'Admin: Ciekawostki';
    if (pathname.startsWith('/dashboard/admin')) return 'Panel Administratora';
    return 'Panel Gracza';
  };

  const navIconClass = `w-4 h-4 flex-shrink-0 transition-colors ${isAdminMode ? 'text-amber-400' : ''}`;

  const navLinksList = (
    <ul className="flex flex-col list-none gap-1 w-full">
      <li className="group relative">
        <Link
          href="/dashboard/summary"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${
            pathname === '/dashboard/summary' || pathname === '/dashboard'
              ? 'bg-bg-300 font-semibold text-text-900'
              : 'text-text-800'
          }`}
        >
          <LayoutDashboard className={navIconClass} />
          <span>Podsumowanie</span>
        </Link>
      </li>
      <li className="group relative">
        <Link
          href="/dashboard/account"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${
            pathname === '/dashboard/account' ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'
          }`}
        >
          <User className={navIconClass} />
          <span>Konto</span>
        </Link>
      </li>
      <li className="group relative">
        <Link
          href="/dashboard/tournaments"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${
            pathname.startsWith('/dashboard/tournaments') ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'
          }`}
        >
          <Trophy className={navIconClass} />
          <span>Turnieje</span>
        </Link>
      </li>

      <NavCalendarSection pathname={pathname} onNavigate={() => setIsMobileMenuOpen(false)} />

      <li className="group relative">
        <Link
          href="/dashboard/polls"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center justify-between w-full h-9 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${
            pathname.startsWith('/dashboard/polls') ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <PieChart className={navIconClass} />
            <span>Głosowania</span>
          </div>
          {hasUnansweredPolls && (
            <span
              title="Masz ankiety do uzupełnienia"
              className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
            />
          )}
        </Link>
      </li>

      {isAdminMode && (
        <NavAdminSection pathname={pathname} onNavigate={() => setIsMobileMenuOpen(false)} />
      )}

      {user?.role === 'admin' && (
        <li className="group relative md:hidden pt-2 mt-1 border-t border-bg-300">
          <div
            onClick={() => toggleAdminMode()}
            className="flex items-center gap-3 w-full h-9 px-3 text-sm rounded-md cursor-pointer transition-colors hover:bg-bg-300 text-text-800"
          >
            <Shield className={navIconClass} />
            <span>{isAdminMode ? 'Wyłącz tryb administratora' : 'Włącz tryb administratora'}</span>
          </div>
        </li>
      )}

      <li className="group relative md:hidden mt-2 pt-2 border-t border-bg-300">
        <div
          className="flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 text-danger-500"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Wyloguj się</span>
        </div>
      </li>
    </ul>
  );

  return (
    <nav className="w-full md:w-auto h-auto md:h-[calc(100vh-64px)] md:sticky md:top-16 z-[40]">
      {/* Mobile Top Bar for Dashboard Navigation */}
      <div className="md:hidden w-full bg-bg-200">
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-bg-300 transition-colors border-b border-bg-300"
          aria-expanded={isMobileMenuOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-semibold text-text-500 uppercase tracking-wider">Panel:</span>
            <span className="text-sm font-bold text-text-900 truncate">{getActiveTitle()}</span>
            {hasUnansweredPolls && (
              <span
                title="Masz ankiety do uzupełnienia"
                className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
              />
            )}
          </div>
          <div className="flex items-center gap-2 text-text-600 shrink-0">
            <span className="text-xs font-medium">{isMobileMenuOpen ? 'Zwiń' : 'Zmień'}</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Collapsible Mobile Dropdown Panel */}
        {isMobileMenuOpen && (
          <div className="px-4 pb-4 pt-3 bg-bg-200 border-b border-bg-300 animate-in slide-in-from-top-2 duration-150">
            {navLinksList}
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:grid bg-bg-200 w-full h-full md:grid-rows-[1fr_auto] md:grid-cols-1 border-r border-bg-300">
        <div className="p-4 w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
          {navLinksList}
        </div>

        <NavUserProfile user={user} isAdminMode={isAdminMode} onLogout={handleLogout} />
      </div>
    </nav>
  );
}
