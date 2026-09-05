'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Trophy, Calendar, PieChart, LogOut, Menu, X } from 'lucide-react';

interface DashboardNavProps {
  user: any;
}

function NavTooltip({ text }: { text: string }) {
  return (
    <div className="hidden md:block absolute left-full top-1/2 -translate-y-1/2 ml-2 z-[100] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 delay-[400ms]">
      <div className="relative px-2.5 py-1.5 bg-bg-100 border border-bg-300 rounded-md shadow-lg text-xs text-text-900 font-medium whitespace-nowrap">
        {text}
        <div className="absolute left-[-5px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-bg-100 border-l border-t border-bg-300 -rotate-45 rounded-[1px]"></div>
      </div>
    </div>
  );
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname() || '';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(pathname.startsWith('/dashboard/calendar'));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

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

  return (
    <nav className="w-full md:w-auto h-auto md:h-[calc(100vh-60px)] md:sticky md:top-0 z-[60]">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between bg-bg-200 border-b border-bg-300 px-4 h-[60px] w-full shrink-0">
        <Link href="/" className="flex items-center">
          <img src="/img/logos/kol-logo-horizontal.svg" className="h-10 object-contain" alt="Karwińska Olimpiada Logo" />
        </Link>
        <button className="text-text-900 p-2" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar (Desktop) / Overlay (Mobile) */}
      <div className={`bg-bg-200 w-full md:h-full flex-col md:grid md:grid-rows-[auto_1fr_auto] md:grid-cols-1 border-r border-bg-300 md:border-r-0 fixed inset-0 md:static ${isMobileMenuOpen ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Mobile Close Header inside Overlay */}
        <div className="md:hidden flex items-center justify-between border-b border-bg-300 px-4 h-[60px] shrink-0">
          <span className="font-bold text-text-900 text-lg">Menu</span>
          <button className="text-text-900 p-2" onClick={() => setIsMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Desktop Logo */}
        <div className="hidden md:flex justify-center items-center h-fit mx-4 mt-8 mb-4 pb-4 border-b border-bg-300 px-2">
          <Link href="/" className="w-full flex justify-center">
            <img src="/img/logos/kol-logo-horizontal.svg" className="w-full h-auto max-h-16 object-contain opacity-80 hover:opacity-100 transition-opacity" alt="Karwińska Olimpiada Logo" />
          </Link>
        </div>

        <div className="p-4 w-full h-full flex flex-col overflow-y-auto custom-scrollbar">
          <ul className="flex flex-col list-none gap-1 w-full">
            <li className="group relative">
              <Link href="/dashboard/account" className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname === '/dashboard/account' || pathname === '/dashboard' ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'}`}>
                <User className="w-4 h-4 flex-shrink-0" />
                <span>Konto</span>
              </Link>
            </li>
            <li className="group relative">
              <Link href="/dashboard/tournaments" className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/tournaments') ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'}`}>
                <Trophy className="w-4 h-4 flex-shrink-0" />
                <span>Turnieje</span>
              </Link>
            </li>
            
            <li className="group relative flex flex-col w-full">
              <div className={`flex items-center justify-between w-full h-9 rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/calendar') && !isCalendarExpanded ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800 font-medium'}`} onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>Kalendarz</span>
                </div>
                <svg className={`w-3.5 h-3.5 text-text-500 transition-transform ${isCalendarExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
              
              {isCalendarExpanded && (
                <div className="flex flex-col w-full mt-1">
                  {/* Removed w-full here to prevent bleeding on the right side */}
                  <div className="flex flex-col border-l border-bg-400 ml-[20px] pl-[10px] gap-1 py-1">
                    <Link href="/dashboard/calendar" className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${pathname === '/dashboard/calendar' ? 'font-semibold text-text-900' : 'text-text-700'}`}>
                      <span>Przegląd Wydarzeń</span>
                    </Link>
                    <Link href="/dashboard/calendar/availability" className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/calendar/availability') ? 'font-semibold text-text-900' : 'text-text-700'}`}>
                      <span>Moja Dostępność</span>
                    </Link>
                    <Link href="/dashboard/calendar/shared" className={`flex items-center w-full h-8 gap-3 text-[13px] rounded-md px-2 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/calendar/shared') ? 'font-semibold text-text-900' : 'text-text-700'}`}>
                      <span>Dostępność Innych</span>
                    </Link>
                  </div>
                </div>
              )}
            </li>
            
            <li className="group relative">
              <Link href="/dashboard/polls" className={`flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 ${pathname.startsWith('/dashboard/polls') ? 'bg-bg-300 font-semibold text-text-900' : 'text-text-800'}`}>
                <PieChart className="w-4 h-4 flex-shrink-0" />
                <span>Głosowania</span>
              </Link>
            </li>
            
            <li className="group relative md:hidden mt-4">
              <div className="flex items-center w-full h-9 gap-3 text-sm rounded-md px-3 cursor-pointer transition-colors hover:bg-bg-300 text-red-500" onClick={handleLogout}>
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Wyloguj się</span>
              </div>
            </li>
          </ul>
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
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute bottom-full left-0 mb-3 w-52 bg-bg-300 border-bg-300 rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-in slide-in-from-bottom-2 fade-in duration-200">
                    <div className="px-3.5 py-2 text-[11px] font-bold text-text-500 uppercase tracking-wider border-b border-bg-300 mb-1">
                      Akcje konta
                    </div>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-bg-400 transition-colors text-left"
                    >
                      <svg width="16" height="16" viewBox="0 0 12 12" className="flex-shrink-0">
                        <polygon fill="currentColor" points="9,2 9,0 1,0 1,12 9,12 9,10 8,10 8,11 2,11 2,1 8,1 8,2 " />
                        <polygon fill="currentColor" points="8.2929688,3.2929688 7.5859375,4 9.0859375,5.5 5,5.5 5,6.5 9.0859375,6.5 7.5859375,8 8.2929688,8.7070313 11,6 " />
                      </svg>
                      Wyloguj się
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
