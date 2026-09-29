'use client';

import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { useToast } from '../ui/ToastProvider';
import { usePollsData } from './polls/usePollsData';
import { PollRow } from './polls/PollRow';

export default function PollsTab({ user }: { user: any }) {
  const { addToast } = useToast();
  const { polls, tournaments, loading, refresh } = usePollsData(user);

  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState('');
  const [tournamentId, setTournamentId] = useState('');

  // Keep tournamentId synced when tournaments load
  const selectedTournamentId = tournamentId || (tournaments[0]?.id ?? '');

  const handleCreate = async () => {
    if (!name || !selectedTournamentId) {
      addToast({ type: 'error', message: 'Wypełnij wszystkie pola.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/poll_create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, tournament_id: selectedTournamentId })
      });
      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', message: 'Ankieta utworzona.' });
        setName('');
        refresh();
      } else {
        addToast({ type: 'error', message: data.error || 'Wystąpił błąd.' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Błąd krytyczny.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-0 pb-2 px-4 sm:px-8 pt-4 gap-6 sm:gap-8">
      {/* Create Poll Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full max-w-4xl mx-auto flex-shrink-0">
        <div className="flex-1 min-w-0">
          <Input
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Nazwa ankiety"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 sm:w-64 sm:flex-initial">
            <Select
              value={selectedTournamentId}
              onChange={setTournamentId}
              options={
                tournaments.length === 0
                  ? [{ value: '', label: 'Brak turniejów' }]
                  : tournaments.map((t) => ({ value: t.id, label: t.displayed_name || t.id }))
              }
            />
          </div>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={submitting || tournaments.length === 0}
            className="whitespace-nowrap"
          >
            Utwórz ankietę
          </Button>
        </div>
      </div>

      {/* Polls List */}
      <div className="flex flex-col gap-3 w-full max-w-4xl mx-auto overflow-y-auto custom-scrollbar flex-1 pb-4">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full bg-bg-200 rounded-md p-5 animate-pulse h-20" />
            ))}
          </div>
        ) : polls.length === 0 ? (
          <div className="text-center text-text-500 py-10 font-medium">
            Brak ankiet do wyświetlenia.
          </div>
        ) : (
          polls.map((poll) => <PollRow key={poll.id} poll={poll} />)
        )}
      </div>
    </div>
  );
}
