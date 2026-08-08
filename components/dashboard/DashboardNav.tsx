'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Trophy, Calendar, PieChart, LogOut } from 'lucide-react';

interface DashboardNavProps {
  activeTab: string;
  setActiveTab: (tab: 'account' | 'tournaments' | 'calendar' | 'polls') => void;
  user: any;
}

export default function DashboardNav({ activeTab, setActiveTab, user }: DashboardNavProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

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
    <nav className="bg-dashboard-bg-s2 w-full h-auto md:h-[calc(100vh-60px)] flex flex-row-reverse justify-center md:grid md:grid-rows-[auto_1fr_auto] md:grid-cols-1 border-r border-dashboard-stroke">
      <div className="hidden md:flex justify-center items-center h-fit mx-4 mt-8 mb-4 pb-4 border-b border-dashboard-stroke px-2">
        <Link href="/" className="w-full flex justify-center">
          <img src="/img/logos/kol-logo-horizontal.svg" className="w-full h-auto max-h-16 object-contain" alt="Karwińska Olimpiada Logo" />
        </Link>
      </div>

      <div className="p-4 md:px-8 md:py-0 w-auto h-full">
        <ul className="flex flex-wrap list-none gap-2">
          <li className={`flex items-center w-auto md:w-full h-10 gap-3 text-lg rounded-md px-2 py-4 cursor-pointer transition-colors hover:bg-dashboard-bg-s4 ${activeTab === 'account' ? 'bg-dashboard-bg-s4' : ''}`} onClick={() => setActiveTab('account')} title="Konto">
            <User className="w-5 h-5 text-dashboard-text" />
            <span className="text-dashboard-text md:block">Konto</span>
          </li>
          <li className={`flex items-center w-auto md:w-full h-10 gap-3 text-lg rounded-md px-2 py-4 cursor-pointer transition-colors hover:bg-dashboard-bg-s4 ${activeTab === 'tournaments' ? 'bg-dashboard-bg-s4' : ''}`} onClick={() => setActiveTab('tournaments')} title="Turnieje">
            <Trophy className="w-5 h-5 text-dashboard-text" />
            <span className="text-dashboard-text md:block">Turnieje</span>
          </li>
          <li className={`flex items-center w-auto md:w-full h-10 gap-3 text-lg rounded-md px-2 py-4 cursor-pointer transition-colors hover:bg-dashboard-bg-s4 ${activeTab === 'calendar' ? 'bg-dashboard-bg-s4' : ''}`} onClick={() => setActiveTab('calendar')} title="Kalendarz">
            <Calendar className="w-5 h-5 text-dashboard-text" />
            <span className="text-dashboard-text md:block">Kalendarz</span>
          </li>
          <li className={`flex items-center w-auto md:w-full h-10 gap-3 text-lg rounded-md px-2 py-4 cursor-pointer transition-colors hover:bg-dashboard-bg-s4 ${activeTab === 'polls' ? 'bg-dashboard-bg-s4' : ''}`} onClick={() => setActiveTab('polls')} title="Głosowania">
            <PieChart className="w-5 h-5 text-dashboard-text" />
            <span className="text-dashboard-text md:block">Głosowania</span>
          </li>
          <li className="block md:hidden flex items-center w-auto h-10 gap-3 text-lg rounded-md px-2 py-4 cursor-pointer transition-colors hover:bg-dashboard-bg-s4" title="Wyloguj się" onClick={handleLogout}>
            <div className="flex justify-center items-center w-full h-full gap-3 text-red-500">
              <LogOut className="w-5 h-5" />
              <span className="text-red-500 md:block">Wyloguj się</span>
            </div>
          </li>
        </ul>
      </div>

      <div className="hidden md:flex h-full">
        <div className="grid p-4 w-full bg-dashboard-bg-s3 h-24 grid-cols-[auto_1fr_auto] grid-rows-1 gap-x-4 items-center">
          <div className="flex justify-center items-center">
            <img src={pfpSrc} id="player_pfp" alt="Profilowe" className="w-12 h-12 rounded-full" />
          </div>

          <div className="flex flex-wrap items-center">
            <Link href={`/player?id=${user?.id}`} id="player_link">
              <div className="details_container">
                <h3 className="text-lg font-normal text-dashboard-text truncate">
                  {user?.displayed_name}
                </h3>
                <div className="role_container">
                  <h5 className="text-sm text-dashboard-text-s2">
                    <div className={`role_badge role_badge-${user?.role}`}>
                      {getRoleInfo(user?.role).name}
                    </div>
                  </h5>
                </div>
              </div>
            </Link>
          </div>

          <div className="flex items-center relative h-full">
            <button className="text-dashboard-text-s2 cursor-pointer transition-colors hover:text-dashboard-text" onClick={() => setShowUserMenu(!showUserMenu)}>
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
                <div className="absolute bottom-full left-0 mb-3 w-52 bg-dashboard-bg-s3 border border-dashboard-stroke rounded-xl shadow-2xl z-50 overflow-hidden py-1.5 animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <div className="px-3.5 py-2 text-[11px] font-bold text-dashboard-text-s3 uppercase tracking-wider border-b border-dashboard-stroke mb-1">
                    Akcje konta
                  </div>
                  
                  {/* Space for future options */}
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-dashboard-bg-s2 transition-colors text-left"
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
    </nav>
  );
}
