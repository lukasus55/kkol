'use client';

import React, { useEffect } from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useUser } from './UserProvider';

interface UserAccountMenuProps {
  user: any;
  onLogout: () => void;
  closeMenu: () => void;
}

export function UserAccountMenu({ user, onLogout, closeMenu }: UserAccountMenuProps) {
  const { isAdminMode, toggleAdminMode } = useUser();
  const isAdmin = user?.role === 'admin';

  // Close on Escape key (Rule 2)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeMenu]);

  return (
    <>
      {/* Backdrop to close menu when clicking outside (Rule 2) */}
      <div
        className="fixed inset-0 z-40"
        onClick={closeMenu}
      />

      {/* Menu dropdown positioned above the three-dots trigger */}
      <div
        className="absolute bottom-full left-0 mb-2 min-w-[15rem] w-max bg-bg-100 border border-bg-400 rounded-md py-1 overflow-hidden z-50 animate-in fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {isAdmin && (
          <>
            <button
              onClick={() => {
                toggleAdminMode();
                closeMenu();
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-900 hover:bg-bg-200 transition-colors text-left cursor-pointer whitespace-nowrap"
            >
              <Shield className={`w-4 h-4 shrink-0 ${isAdminMode ? 'text-amber-400' : 'text-text-700'}`} />
              <span>{isAdminMode ? 'Wyłącz tryb administratora' : 'Włącz tryb administratora'}</span>
            </button>
            <div className="border-t border-bg-300 my-1" />
          </>
        )}

        <button
          onClick={() => {
            onLogout();
            closeMenu();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-500 hover:bg-red-500/20 hover:text-red-400 transition-colors text-left cursor-pointer whitespace-nowrap"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Wyloguj się</span>
        </button>
      </div>
    </>
  );
}
