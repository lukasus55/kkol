'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, User, Trophy, Calendar, PieChart, LogOut, Menu, X, Shield } from 'lucide-react';

import { checkHasUnansweredPolls } from './polls/pollChecker';
import { UserAccountMenu } from './UserAccountMenu';

interface DashboardNavProps {
  user: any;
}


export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname() || '';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(pathname.startsWith('/dashboard/calendar'));
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

  const getRoleInfo = (role: string) => {
    const roles: any = {
      player: { name: 'Gracz' },
      organizer: { name: 'Organizator' },
      admin: { name: 'Administrator' },
    };
    return roles[role] || { name: 'Nieznany' };
  };

  const pfpSrc = user?.pfp_base64
    ? `data:image/webp;base64,${user.pfp_base64}`
    : '/img/default_pfp.webp';

  // Determine active section name for mobile header
  const getActiveTitle = () => {
    if (pathname === '/dashboard/summary' || pathname === '/dashboard') return 'Podsumowanie';
    if (pathname === '/dashboard/account') return 'Konto';
    if (pathname.startsWith('/dashboard/tournaments')) return 'Turnieje';
    if (pathname === '/dashboard/calendar') return 'Kalendarz: Przegląd Wydarzeń';
    if (pathname.startsWith('/dashboard/calendar/availability')) return 'Kalendarz: Moja Dostępność';
    if (pathname.startsWith('/dashboard/calendar/shared')) return 'Kalendarz: Dostępność Innych';
    if (pathname.startsWith('/dashboard/calendar')) return 'Kalendarz';
    if (pathname.startsWith('/dashboard/polls')) return 'Głosowania';
    return 'Panel Gracza';
  };

  const navLinksList = (
    <ul className="flex flex-col list-none gap-1 w-full">
      <li className="group relative">
        <Link
          href="/dashboard/summary"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname === '/dashboard/summary' || pathname === '/dashboard' ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'}`}
        >
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          <span>Podsumowanie</span>
        </Link>
      </li>
      <li className="group relative">
        <Link
          href="/dashboard/account"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname === '/dashboard/account' ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'}`}
        >
          <User className="w-4 h-4 flex-shrink-0" />
          <span>Konto</span>
        </Link>
      </li>
      <li className="group relative">
        <Link
          href="/dashboard/tournaments"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/tournaments') ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'}`}
        >
          <Trophy className="w-4 h-4 flex-shrink-0" />
          <span>Turnieje</span>
        </Link>
      </li>
      
      <li className="group relative flex flex-col w-full">
        <div
          className={`flex items-center justify-between w-full h-9 rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/calendar') && !isCalendarExpanded ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800 font-medium'}`}
          onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
        >
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span>Kalendarz</span>
          </div>
          <svg className={`w-3.5 h-3.5 text-text-500 transition-transform ${isCalendarExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
        
        {isCalendarExpanded && (
          <div className="flex flex-col w-full mt-1">
            <div className="flex flex-col border-l border-bg-400 ml-[20px] pl-[10px] gap-1 py-1">
              <Link
                href="/dashboard/calendar"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${pathname === '/dashboard/calendar' ? 'font-semibold text-text-900' : 'text-text-700'}`}
              >
                <span>Przegląd Wydarzeń</span>
              </Link>
              <Link
                href="/dashboard/calendar/availability"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/calendar/availability') ? 'font-semibold text-text-900' : 'text-text-700'}`}
              >
                <span>Moja Dostępność</span>
              </Link>
              <Link
                href="/dashboard/calendar/shared"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/calendar/shared') ? 'font-semibold text-text-900' : 'text-text-700'}`}
              >
                <span>Dostępność Innych</span>
              </Link>
            </div>
          </div>
        )}
      </li>
      
      <li className="group relative">
        <Link
          href="/dashboard/polls"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center justify-between w-full h-9 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/polls') ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'}`}
        >
          <div className="flex items-center gap-3">
            <PieChart className="w-4 h-4 flex-shrink-0" />
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
      
      {user?.role === 'admin' && (
        <li className="group relative md:hidden">
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 text-text-800"
          >
            <Shield className="w-4 h-4 flex-shrink-0" />
            <span>Tryb administratora</span>
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
          className={`w-full px-4 py-3 flex items-center justify-between text-left hover:bg-bg-300/50 transition-colors ${isMobileMenuOpen ? 'border-b border-bg-300' : 'border-b border-bg-300'}`}
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

      {/* Desktop Sidebar (unchanged layout, visible only on md+) */}
      <div className="hidden md:grid bg-bg-200 w-full h-full md:grid-rows-[1fr_auto] md:grid-cols-1 border-r border-bg-300">
        <div className="p-4 w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
          {navLinksList}
        </div>

        <div className="hidden md:flex h-full">
          <div className="grid p-4 w-full bg-bg-300 h-24 grid-cols-[auto_1fr_auto] grid-rows-1 gap-x-4 items-center">
            <div className="flex justify-center items-center">
              <img src={pfpSrc} id="player_pfp" alt="Profilowe" className="w-12 h-12 rounded-full" />
            </div>

            <div className="flex flex-wrap items-center">
              <Link href={`/player?id=${user?.id}`} id="player_link">
                <div className="details_container">
                  <h3 className="text-lg font-normal text-text-900 truncate">
                    {user?.displayed_name}
                  </h3>
                  <div className="role_container">
                    <h5 className="text-sm text-text-700">
                      <div className={`role_badge role_badge-${user?.role}`}>
                        {getRoleInfo(user?.role).name}
                      </div>
                    </h5>
                  </div>
                </div>
              </Link>
            </div>

            <div className="flex items-center relative h-full">
              <button className="text-text-700 cursor-pointer transition-colors hover:text-text-900" onClick={() => setShowUserMenu(!showUserMenu)}>
                <svg fill="currentColor" width="2rem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="17.5" cy="12" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="6.5" cy="12" r="1.5" />
                </svg>
              </button>

              {showUserMenu && (
                <UserAccountMenu
                  user={user}
                  onLogout={handleLogout}
                  closeMenu={() => setShowUserMenu(false)}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
