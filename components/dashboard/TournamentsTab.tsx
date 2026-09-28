'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { TournamentRow } from './tournaments/TournamentRow';
import { useToast } from '../ui/ToastProvider';

export default function TournamentsTab({ user, refreshUser }: { user: any, refreshUser?: () => void }) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTournamentId, setNewTournamentId] = useState('');
  const [creating, setCreating] = useState(false);
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

  const canAdd = user?.role === 'admin' || user?.role === 'organizer';

  const handleCreate = async () => {
    const id = newTournamentId.trim().toLowerCase();
    if (!id) {
      addToast({ type: 'warning', message: "Wpisz ID turnieju." });
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
        refreshUser?.(); // Also refresh the global user state so organizer_roles updates
      } else {
        const err = await res.json();
        addToast({ type: 'error', message: err.error || "Wystąpił błąd podczas tworzenia turnieju." });
      }
    } catch (error) {
      addToast({ type: 'error', message: "Błąd połączenia z serwerem." });
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  return (
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
            <Button
              variant="primary"
              onClick={handleCreate}
              isLoading={creating}
              disabled={!newTournamentId.trim()}
            >
              Dodaj turniej
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {loading ? (
            <div className="text-center py-12 text-text-700">Ładowanie turniejów...</div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-12 text-text-700">Brak dostępnych turniejów.</div>
          ) : (
            tournaments.map((t) => (
              <TournamentRow
                key={t.id}
                tournament={t}
                userRole={user.role}
                onRefresh={() => {
                  fetchTournaments();
                  refreshUser?.();
                }}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}
