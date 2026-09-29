'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, KeyRound, Monitor, Ban, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface UserItem {
  id: string;
  displayed_name: string;
  email?: string | null;
  role: string | null;
  is_active: boolean | null;
  last_login?: string | null;
  created_at?: string | null;
  pfp_base64?: string | null;
}

interface UserCardProps {
  user: UserItem;
  currentUserId: string;
  onToggleRole: (user: UserItem, nextRole: 'player' | 'organizer') => void;
  onToggleStatus: (user: UserItem) => void;
  onResetPassword: (user: UserItem) => void;
  onOpenSessions: (user: UserItem) => void;
}

export function UserCard({
  user,
  currentUserId,
  onToggleRole,
  onToggleStatus,
  onResetPassword,
  onOpenSessions,
}: UserCardProps) {
  const isSelf = user.id === currentUserId;
  const isTargetAdmin = user.role === 'admin';
  const isActive = user.is_active !== false;

  const pfpSrc = user.pfp_base64
    ? `data:image/webp;base64,${user.pfp_base64}`
    : '/img/default_pfp.webp';

  const roleStyles: Record<string, { label: string; textClass: string }> = {
    admin: { label: 'Administrator', textClass: 'text-amber-400' },
    organizer: { label: 'Organizator', textClass: 'text-blue-400' },
    player: { label: 'Gracz', textClass: 'text-text-700' },
  };

  const roleInfo = roleStyles[user.role || 'player'] || roleStyles.player;
  const nextRole: 'player' | 'organizer' = user.role === 'organizer' ? 'player' : 'organizer';
  const nextRoleName = nextRole === 'organizer' ? 'Organizator' : 'Gracz';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Nigdy';
    try {
      return new Date(dateStr).toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-bg-200 rounded-md p-4 sm:p-5 flex flex-col justify-between gap-4 border border-bg-300">
      <div className="flex flex-col gap-3">
        {/* Header: Avatar, Name, and Unified Interactive Role Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <img
                src={pfpSrc}
                alt={user.displayed_name}
                className="w-12 h-12 rounded-full object-cover bg-bg-300"
              />
              <span
                className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-bg-200 ${
                  isActive ? 'bg-emerald-500' : 'bg-danger-500'
                }`}
                title={isActive ? 'Konto aktywne' : 'Konto zablokowane'}
              />
            </div>

            <div className="min-w-0">
              <Link
                href={`/player?id=${user.id}`}
                className="font-bold text-text-900 text-base hover:underline truncate block"
              >
                {user.displayed_name}
              </Link>
              <span className="text-xs text-text-500 truncate block">
                @{user.id}
              </span>
            </div>
          </div>

          {/* Role badge: styled identically for all roles, clickable for non-admins */}
          {isTargetAdmin ? (
            <div
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border border-bg-400 bg-bg-300 shrink-0 ${roleInfo.textClass}`}
              title="Konto administratora"
            >
              <span>{roleInfo.label}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onToggleRole(user, nextRole)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-bg-400 bg-bg-300 hover:bg-bg-400 hover:border-bg-500 transition-colors cursor-pointer shrink-0 ${roleInfo.textClass}`}
              title={`Kliknij, aby zmienić rolę na: ${nextRoleName}`}
            >
              <span>{roleInfo.label}</span>
              <ArrowLeftRight className="w-3 h-3 text-text-500 shrink-0" />
            </button>
          )}
        </div>

        {/* Details: Email & Dates */}
        <div className="flex flex-col gap-1 text-xs text-text-700 border-t border-bg-300 pt-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-500">E-mail:</span>
            <span className="truncate text-right">{user.email || 'Brak'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-500">Ostatnie logowanie:</span>
            <span>{formatDate(user.last_login)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-text-500">Utworzono:</span>
            <span>{formatDate(user.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Cohesive Action Buttons */}
      <div className="pt-2 border-t border-bg-300">
        {isTargetAdmin ? (
          <div className="flex items-center justify-center gap-1.5 py-1.5 text-xs text-text-500 italic">
            <Shield className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>{isSelf ? 'Twoje konto administratora' : 'Konto administratora (chronione)'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
              onClick={() => onResetPassword(user)}
              title="Zresetuj hasło gracza"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Hasło</span>
            </Button>
            <Button
              variant="secondary"
              className="flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
              onClick={() => onOpenSessions(user)}
              title="Zarządzaj aktywnymi sesjami"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Sesje</span>
            </Button>
            <Button
              variant={isActive ? 'danger' : 'secondary'}
              className="flex-1 text-xs py-1.5 flex items-center justify-center gap-1.5"
              onClick={() => onToggleStatus(user)}
              title={isActive ? 'Zablokuj konto użytkownika' : 'Odblokuj konto użytkownika'}
            >
              {isActive ? (
                <>
                  <Ban className="w-3.5 h-3.5" />
                  <span>Zablokuj</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Odblokuj</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
