'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    <nav className="dashboard_navbar">
      <div className="title_section">
        <Link href="/">
          <img src="/img/logos/olympic-logo-transparent.svg" style={{ width: '4rem', height: '4rem' }} alt="Logo" />
        </Link>
        <div className="title_text">
          <div className="title_line">Karwińska</div>
          <div className="title_line">Olimpiada</div>
        </div>
      </div>

      <div className="selector">
        <ul>
          <li className={activeTab === 'account' ? 'active' : ''} onClick={() => setActiveTab('account')} title="Konto">
            <img src="/img/dashboard/profile_icon.webp" alt="Konto" />
            <span className="selector-text">Konto</span>
          </li>
          <li className={activeTab === 'tournaments' ? 'active' : ''} onClick={() => setActiveTab('tournaments')} title="Turnieje">
            <img src="/img/dashboard/trophy_icon.webp" alt="Turnieje" />
            <span className="selector-text">Turnieje</span>
          </li>
          <li className={activeTab === 'calendar' ? 'active' : ''} onClick={() => setActiveTab('calendar')} title="Kalendarz">
            <img src="/img/dashboard/calendar_icon.webp" alt="Kalendarz" />
            <span className="selector-text">Kalendarz</span>
          </li>
          <li className={activeTab === 'polls' ? 'active' : ''} onClick={() => setActiveTab('polls')} title="Głosowania">
            <img src="/img/dashboard/poll_icon.svg" alt="Głosowania" />
            <span className="selector-text">Głosowania</span>
          </li>
          <li id="logout_li" title="Wyloguj się" onClick={handleLogout}>
            <div className="mobile_logout_btn">
              <img src="/img/dashboard/leave_icon.webp" alt="Wyloguj" />
              <span className="selector-text">Wyloguj się</span>
            </div>
          </li>
        </ul>
      </div>

      <div className="user_card_container">
        <div className="user_card">
          <div className="picture">
            <img src={pfpSrc} id="player_pfp" alt="Profilowe" />
          </div>

          <div className="details">
            <Link href={`/player?id=${user?.id}`} id="player_link">
              <div className="details_container">
                <h3>
                  <div className="name">{user?.displayed_name}</div>
                </h3>
                <div className="role_container">
                  <h5>
                    <div className={`role_badge role_badge-${user?.role}`}>
                      {getRoleInfo(user?.role).name}
                    </div>
                  </h5>
                </div>
              </div>
            </Link>
          </div>

          <div className="more_icon relative">
            <button className="more_button hover:text-white transition-colors" onClick={() => setShowUserMenu(!showUserMenu)}>
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
                  <div className="px-3.5 py-2 text-[11px] font-bold text-dashboard-text-s3 uppercase tracking-wider border-b border-white/5 mb-1">
                    Akcje konta
                  </div>
                  
                  {/* Space for future options */}
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors text-left"
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
