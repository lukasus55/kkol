'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { ConfirmationPopup } from '../../ui/ConfirmationPopup';
import { useToast } from '../../ui/ToastProvider';
import { ListRowSkeleton } from '../../ui/Skeleton';
import SessionItem from './SessionItem';
import type { PublicSessionItem } from '../../../pages/api/sessions';

export default function SessionsCard() {
  const [sessions, setSessions] = useState<PublicSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [targetSession, setTargetSession] = useState<PublicSessionItem | null>(null);
  const [confirmRevokeOthers, setConfirmRevokeOthers] = useState(false);

  const { addToast } = useToast();

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else if (res.status === 401) {
        window.location.href = '/login';
      } else {
        addToast({ type: 'error', message: 'Nie udało się pobrać aktywnych sesji.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevokeSingle = async () => {
    if (!targetSession) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/sessions?id=${encodeURIComponent(targetSession.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', message: data.message || 'Sesja została wylogowana.' });
        if (targetSession.is_current) {
          window.location.href = '/login';
        } else {
          setSessions(prev => prev.filter(s => s.id !== targetSession.id));
        }
      } else {
        addToast({ type: 'error', message: data.error || 'Nie udało się wylogować sesji.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas usuwania sesji.' });
    } finally {
      setActionLoading(false);
      setTargetSession(null);
    }
  };

  const handleRevokeOthers = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/sessions?others=true', { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', message: data.message || 'Wylogowano ze wszystkich pozostałych urządzeń.' });
        setSessions(prev => prev.filter(s => s.is_current));
      } else {
        addToast({ type: 'error', message: data.error || 'Nie udało się wylogować pozostałych sesji.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd podczas wylogowywania sesji.' });
    } finally {
      setActionLoading(false);
      setConfirmRevokeOthers(false);
    }
  };

  const otherSessionsCount = sessions.filter(s => !s.is_current).length;

  return (
    <Card>
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div>
          <CardTitle className="mb-0">Aktywne urządzenia i sesje</CardTitle>
          <p className="text-xs text-text-600 mt-1">
            Zarządzaj urządzeniami, na których jesteś aktualnie zalogowany.
          </p>
        </div>

        {otherSessionsCount > 0 && (
          <Button
            variant="secondary"
            onClick={() => setConfirmRevokeOthers(true)}
            disabled={actionLoading}
            className="text-xs py-1.5 px-3"
          >
            Wyloguj pozostałe urządzenia ({otherSessionsCount})
          </Button>
        )}
      </div>

      {loading ? (
        <ListRowSkeleton count={2} />
      ) : sessions.length === 0 ? (
        <div className="py-6 text-center text-sm text-text-600">
          Brak aktywnych sesji.
        </div>
      ) : (
        <div className="divide-y divide-bg-300">
          {sessions.map(session => (
            <SessionItem
              key={session.id}
              session={session}
              onRevoke={setTargetSession}
              isRevoking={actionLoading && targetSession?.id === session.id}
            />
          ))}
        </div>
      )}

      <ConfirmationPopup
        isOpen={Boolean(targetSession)}
        title={targetSession?.is_current ? "Wylogowanie" : "Zdalne wylogowanie"}
        message={
          targetSession?.is_current
            ? "Czy na pewno chcesz wylogować się z tego urządzenia?"
            : `Czy na pewno chcesz unieważnić sesję na urządzeniu <strong>${targetSession?.device_info || 'Nieznane'}</strong>?`
        }
        confirmText="Wyloguj"
        cancelText="Anuluj"
        onConfirm={handleRevokeSingle}
        onClose={() => setTargetSession(null)}
      />

      <ConfirmationPopup
        isOpen={confirmRevokeOthers}
        title="Wyloguj pozostałe urządzenia"
        message="Czy na pewno chcesz wylogować się ze wszystkich innych urządzeń? Pozostaniesz zalogowany tylko na tym urządzeniu."
        confirmText="Wyloguj pozostałe"
        cancelText="Anuluj"
        onConfirm={handleRevokeOthers}
        onClose={() => setConfirmRevokeOthers(false)}
      />
    </Card>
  );
}
