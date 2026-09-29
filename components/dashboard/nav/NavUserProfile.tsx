'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UserAccountMenu } from '../UserAccountMenu';

interface NavUserProfileProps {
  user: any;
  isAdminMode: boolean;
  onLogout: () => void;
}

export function NavUserProfile({ user, onLogout }: NavUserProfileProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleInfo = (role: string) => {
    const roles: Record<string, { name: string }> = {
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
    <div className="hidden md:flex h-full">
      <div className="grid p-4 w-full bg-bg-300 h-24 grid-cols-[auto_1fr_auto] grid-rows-1 gap-x-4 items-center">
        <div className="flex justify-center items-center">
          <img src={pfpSrc} id="player_pfp" alt="Profilowe" className="w-12 h-12 rounded-full object-cover" />
        </div>

        <div className="flex flex-wrap items-center min-w-0">
          <Link href={`/player?id=${user?.id}`} id="player_link" className="min-w-0 block">
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
          <button
            type="button"
            className="text-text-700 cursor-pointer transition-colors hover:text-text-900"
            onClick={() => setShowUserMenu(!showUserMenu)}
            aria-label="Opcje konta"
          >
            <svg fill="currentColor" width="2rem" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="17.5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="6.5" cy="12" r="1.5" />
            </svg>
          </button>

          {showUserMenu && (
            <UserAccountMenu
              user={user}
              onLogout={onLogout}
              closeMenu={() => setShowUserMenu(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
