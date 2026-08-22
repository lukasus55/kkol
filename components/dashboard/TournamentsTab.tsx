'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TournamentRow } from './tournaments/TournamentRow';
import { useToast } from '../ui/ToastProvider';
import { ErrorPopup } from '../ui/ErrorPopup';

export default function TournamentsTab({ user }: { user: any }) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTournamentId, setNewTournamentId] = useState('');
  const [creating, setCreating] = useState(false);
  const [errorModal, setErrorModal] = useState('');
  const { addToast } = useToast();

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments?player=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const arr = Object.values(data);
        setTournaments(arr);
      }
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const canAdd = user.role === 'admin' || user.role === 'organizer';
  const organizerRoles = user.organizer_roles || {};

  const handleCreate = async () => {
    const id = newTournamentId.trim().replaceAll(' ', '_');
    if (!id) {
      addToast({ type: 'warning', message: "Proszę wpisać ID dla nowego turnieju." });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/tournament_create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: id })
      });
      if (res.ok) {
        addToast({ type: 'success', message: "Pomyślnie utworzono turniej: " + id });
        setNewTournamentId('');
        fetchTournaments(); // Refresh the list without page reload!
      } else {
        const err = await res.json();
        setErrorModal(err.error || "Wystąpił błąd podczas tworzenia turnieju.");
      }
    } catch (error) {
      setErrorModal("Błąd połączenia z serwerem.");
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <ErrorPopup
        isOpen={!!errorModal}
        message={errorModal}
        onClose={() => setErrorModal('')}
      />
      <div className="w-full flex justify-center py-12 px-6">
        <div className="flex flex-col gap-6 w-full max-w-[700px]">

          {canAdd && (
            <div className="flex items-center gap-4 bg-bg-200 p-4 rounded-md">
              <div className="flex-1">
                <Input
                  placeholder="ID nowego turnieju..."
                  value={newTournamentId}
                  onChange={(e) => setNewTournamentId(e.target.value)}
                />
              </div>
              <Button variant="primary" onClick={handleCreate} isLoading={creating}>
                Stwórz turniej
              </Button>
            </div>
          )}

          {loading && tournaments.length === 0 ? (
            <div className="text-center text-text-700 py-8">Ładowanie turniejów...</div>
          ) : (
            <div className={`rounded-md divide-y divide-bg-400 bg-bg-200 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              {tournaments.length === 0 ? (
                <div className="p-8 text-center text-text-700">
                  Brak przypisanych turniejów.
                </div>
              ) : (
                tournaments.map((t: any) => {
                  const rawRole = organizerRoles[t.id];
                  const userRole = (rawRole === 'owner' || rawRole === 'manager') ? rawRole : 'gracz';

                  return (
                    <TournamentRow
                      key={t.id}
                      tournament={t}
                      userRole={userRole}
                      onRefresh={fetchTournaments}
                    />
                  );
                })
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}
