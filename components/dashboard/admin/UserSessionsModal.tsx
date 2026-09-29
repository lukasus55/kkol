'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Laptop, Smartphone, Globe, LogOut, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import type { UserItem } from './UserCard';

interface SessionItem {
  id: string;
  ip_address: string | null;
  device_info: string | null;
  app_id: string;
  created_at: string;
  last_active_at: string;
  expires_at: string;
}

interface UserSessionsModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UserSessionsModal({ user, isOpen, onClose }: UserSessionsModalProps) {
  const { addToast } = useToast();
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/sessions?player_id=${encodeURIComponent(user.id)}`);
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      } else {
        const data = await res.json();
        addToast({ type: 'error', message: data.error || 'Nie udało się pobrać sesji.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setLoading(false);
    }
  }, [user, addToast]);

  useEffect(() => {
    if (isOpen && user) {
      fetchSessions();
    }
  }, [isOpen, user, fetchSessions]);

  if (!user) return null;

  const handleRevokeSingle = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user.id, session_id: sessionId }),
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Sesja została unieważniona.' });
        fetchSessions();
      } else {
        const data = await res.json();
        addToast({ type: 'error', message: data.error || 'Nie udało się unieważnić sesji.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeAll = async () => {
    setActionLoading('all');
    try {
      const res = await fetch('/api/admin/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_id: user.id, all: true }),
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Wszystkie sesje użytkownika zostały unieważnione.' });
        fetchSessions();
      } else {
        const data = await res.json();
        addToast({ type: 'error', message: data.error || 'Nie udało się unieważnić sesji.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Sesje: ${user.displayed_name} (@${user.id})`}
      maxWidth="max-w-xl"
      height="h-[550px]"
    >
      <div className="p-4 sm:p-6 flex flex-col gap-4 h-full overflow-hidden">
        {/* Top summary & Bulk Action */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-bg-300">
          <span className="text-sm text-text-700">
            Aktywne urządzenia: <strong className="text-text-900">{sessions.length}</strong>
          </span>

          {sessions.length > 0 && (
            <Button
              variant="danger"
              className="text-xs py-1.5"
              onClick={handleRevokeAll}
              isLoading={actionLoading === 'all'}
            >
              Wyloguj ze wszystkich
            </Button>
          )}
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-bg-200 rounded-md animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center bg-bg-200 rounded-md border border-bg-300">
              <p className="text-sm text-text-700 font-medium">Brak aktywnych sesji</p>
              <p className="text-xs text-text-500 mt-1">Użytkownik nie jest obecnie zalogowany na żadnym urządzeniu.</p>
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className="bg-bg-200 rounded-md p-3.5 border border-bg-300 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-bg-300 rounded-md shrink-0 text-text-700 mt-0.5">
                    {sess.device_info?.toLowerCase().includes('phone') ||
                    sess.device_info?.toLowerCase().includes('android') ||
                    sess.device_info?.toLowerCase().includes('ios') ? (
                      <Smartphone className="w-4 h-4" />
                    ) : (
                      <Laptop className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0 text-xs">
                    <span className="font-semibold text-text-900 text-sm truncate">
                      {sess.device_info || 'Nieznane urządzenie'}
                    </span>
                    <span className="text-text-500 flex items-center gap-1 mt-0.5">
                      <Globe className="w-3 h-3 shrink-0" />
                      {sess.ip_address || 'Nieznane IP'}
                    </span>
                    <span className="text-text-700 mt-1">
                      Ostatnia aktywność: {formatDate(sess.last_active_at)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="danger"
                  className="text-xs py-1 px-2.5 shrink-0"
                  onClick={() => handleRevokeSingle(sess.id)}
                  isLoading={actionLoading === sess.id}
                >
                  Wyloguj
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end pt-3 border-t border-bg-300">
          <Button variant="secondary" onClick={onClose}>
            Zamknij
          </Button>
        </div>
      </div>
    </Modal>
  );
}
