'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';

export default function PollsTab({ user }: { user: any }) {
  const router = useRouter();
  const { addToast } = useToast();
  const [polls, setPolls] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [tournamentId, setTournamentId] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, pRes] = await Promise.all([
        fetch('/api/tournaments_active'),
        fetch('/api/polls')
      ]);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTournaments(tData);
        if (tData.length > 0 && !tournamentId) setTournamentId(tData[0].id);
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        const filteredPolls = pData.filter((poll: any) => {
          const isPlayer = !!user?.tournaments?.[poll.tournament_id];
          const isOrganizer = !!user?.organizer_roles?.[poll.tournament_id];
          const isAdmin = user?.role === 'admin';
          return isAdmin || isPlayer || isOrganizer;
        });
        setPolls(filteredPolls);
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Błąd pobierania danych.' });
    }
  };

  const handleCreate = async () => {
    if (!name || !tournamentId) {
      addToast({ type: 'error', message: 'Wypełnij wszystkie pola.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/poll_create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tournament_id: tournamentId })
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', message: 'Ankieta utworzona.' });
        setName('');
        fetchData();
      } else {
        addToast({ type: 'error', message: data.error || 'Wystąpił błąd.' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Błąd krytyczny.' });
    } finally {
      setLoading(false);
    }
  };

  const getRelativeTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 30) return `${Math.floor(diffDays / 30)} miesięcy`;
    if (diffDays > 0) return `${diffDays} dni`;
    if (diffDays === 0) return 'Dzisiaj';
    if (diffDays < 0) return 'Zakończona';
    return '';
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 pb-2 px-8 pt-4 gap-8">

      {/* Create Poll Bar */}
      <div className="flex items-center gap-4 w-full max-w-4xl mx-auto flex-shrink-0">
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Nazwa"
          />
        </div>
        <div className="w-64">
          <Select
            value={tournamentId}
            onChange={setTournamentId}
            options={tournaments.length === 0
              ? [{ value: '', label: 'Brak turniejów' }]
              : tournaments.map(t => ({ value: t.id, label: t.displayed_name || t.id }))
            }
          />
        </div>
        <Button variant="primary" onClick={handleCreate} disabled={loading || tournaments.length === 0}>
          Utwórz ankietę
        </Button>
      </div>

      {/* Polls List */}
      <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto overflow-y-auto custom-scrollbar flex-1 pb-4">
        {polls.map(poll => (
          <div
            key={poll.id}
            onClick={() => router.push(`/poll/${poll.id}`)}
            className="flex items-center justify-between bg-bg-200 rounded-lg p-5 hover:bg-bg-300 transition-colors cursor-pointer group"
          >
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-text-900 text-[15px] transition-colors underline-offset-4 group-hover:underline">{poll.name}</span>
              <span className="text-text-700 text-[13px]">{poll.tournament_id}</span>
            </div>
            <div className="text-text-500 text-sm font-medium">
              {poll.end_date ? getRelativeTime(poll.end_date) : 'Bez terminu'}
            </div>
          </div>
        ))}
        {polls.length === 0 && (
          <div className="text-center text-text-500 py-10 font-medium">Brak ankiet do wyświetlenia.</div>
        )}
      </div>

    </div>
  );
}
