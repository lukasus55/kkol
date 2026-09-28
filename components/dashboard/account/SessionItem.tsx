'use client';

import React from 'react';
import { Button } from '../../ui/Button';
import { formatSessionDate } from './sessionUtils';
import type { PublicSessionItem } from '../../../pages/api/sessions';

interface SessionItemProps {
  session: PublicSessionItem;
  onRevoke: (session: PublicSessionItem) => void;
  isRevoking: boolean;
}

export default function SessionItem({ session, onRevoke, isRevoking }: SessionItemProps) {
  const displayIp = session.ip_address ? session.ip_address.replace(/^::ffff:/, '') : null;

  return (
    <div className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-text-900 text-sm">
            {session.device_info || 'Nieznane urządzenie'}
          </span>
          {session.is_current && (
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
              To urządzenie
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-text-600 flex-wrap">
          {displayIp && <span>IP: {displayIp}</span>}
          {displayIp && <span>•</span>}
          <span>Ostatnia aktywność: {formatSessionDate(session.last_active_at)}</span>
          {session.app_id !== 'kkol_main' && (
            <>
              <span>•</span>
              <span className="text-primary-400">Aplikacja: {session.app_id}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex sm:justify-end shrink-0">
        <Button
          variant={session.is_current ? 'secondary' : 'danger'}
          onClick={() => onRevoke(session)}
          isLoading={isRevoking}
          disabled={isRevoking}
          className="text-xs py-1.5 px-3 whitespace-nowrap"
        >
          {session.is_current ? 'Wyloguj się' : 'Wyloguj'}
        </Button>
      </div>
    </div>
  );
}
