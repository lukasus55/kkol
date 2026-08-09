import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/ToastProvider';
import { NumberInput } from '../../ui/NumberInput';
import { Select } from '../../ui/Select';
import { ConfirmationPopup } from '../../ui/ConfirmationPopup';

type EventEditorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData?: any;
  onSuccess: () => void;
  user: any;
};

const formatForInput = (dateObj: Date) => {
  if (!dateObj || isNaN(dateObj.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = dateObj.getFullYear();
  const m = pad(dateObj.getMonth() + 1);
  const d = pad(dateObj.getDate());
  const h = pad(dateObj.getHours());
  const min = pad(dateObj.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
};

export function EventEditorModal({ isOpen, onClose, mode, initialData, onSuccess, user }: EventEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'results'>('details');
  const { addToast } = useToast();

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [isMajor, setIsMajor] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Results State
  const [results, setResults] = useState<any[]>([]);

  // Metadata
  const [tournaments, setTournaments] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('details');
      fetchTournaments();

      if (mode === 'edit' && initialData) {
        setName(initialData.title || '');
        setTournamentId(initialData.extendedProps?.tournament_id || '');
        setIsMajor(initialData.extendedProps?.is_major || false);
        setStartDate(formatForInput(new Date(initialData.start)));
        setEndDate(initialData.end ? formatForInput(new Date(initialData.end)) : '');
        fetchResults(initialData.id);
      } else {
        setName('');
        setTournamentId('');
        setIsMajor(false);
        setStartDate(initialData?.start ? formatForInput(new Date(initialData.start)) : formatForInput(new Date()));
        setEndDate('');
        setResults([]);
      }
    }
  }, [isOpen, mode, initialData]);

  const fetchTournaments = async () => {
    setFetching(true);
    try {
      const res = await fetch('/api/tournaments_active');
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
        if (mode === 'create' && data.length > 0) {
          setTournamentId(data[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Nie udało się pobrać turniejów.' });
    } finally {
      setFetching(false);
    }
  };

  const fetchResults = async (eventId: string) => {
    try {
      const res = await fetch(`/api/event_results?id=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setResults(data[0].results);
        } else {
          setResults([]);
        }
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Nie udało się pobrać wyników.' });
    }
  };

  const handleSaveDetails = async () => {
    if (!name || !tournamentId || !startDate) {
      addToast({ type: 'error', message: 'Wypełnij wszystkie wymagane pola.' });
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'create' ? '/api/event_create' : '/api/event_update';
      const payload = mode === 'create'
        ? { name, tournament_id: tournamentId, is_major: isMajor, start_date: new Date(startDate).toISOString(), end_date: endDate ? new Date(endDate).toISOString() : null }
        : { id: initialData.id, name, is_major: isMajor, start_date: new Date(startDate).toISOString(), end_date: endDate ? new Date(endDate).toISOString() : null };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', message: mode === 'create' ? 'Utworzono wydarzenie!' : 'Zapisano wydarzenie!' });
        onSuccess();
        onClose();
      } else {
        addToast({ type: 'error', message: data.error || 'Wystąpił błąd.' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Wystąpił krytyczny błąd.' });
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/event_delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: initialData.id })
      });

      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', message: 'Usunięto wydarzenie!' });
        onSuccess();
        onClose();
      } else {
        addToast({ type: 'error', message: data.error || 'Wystąpił błąd.' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Wystąpił błąd.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResults = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/event_update_results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_id: initialData.id,
          results: results.map(r => ({
            player_id: r.player_id,
            position: r.position === '' ? null : Number(r.position),
            points: r.points === '' ? null : Number(r.points)
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        addToast({ type: 'success', message: 'Zapisano wyniki!' });
        onSuccess();
      } else {
        addToast({ type: 'error', message: data.error || 'Wystąpił błąd.' });
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Wystąpił błąd.' });
    } finally {
      setLoading(false);
    }
  };

  const updateResult = (index: number, field: 'position' | 'points', value: string) => {
    const newResults = [...results];
    newResults[index] = { ...newResults[index], [field]: value };
    setResults(newResults);
  };

  if (!isOpen) return null;

  const footer = (
    <div className="flex justify-end items-center gap-2">
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        Anuluj
      </Button>
      {mode === 'edit' && activeTab === 'details' && (
        <Button variant="danger" onClick={() => setConfirmOpen(true)} disabled={loading}>
          Usuń
        </Button>
      )}
      <Button variant="primary" onClick={activeTab === 'details' ? handleSaveDetails : handleSaveResults} disabled={loading}>
        {mode === 'create' ? 'Utwórz' : 'Zapisz Zmiany'}
      </Button>
    </div>
  );

  return (
    <>
      <ConfirmationPopup
        isOpen={confirmOpen}
        title="Usuń wydarzenie"
        message="Czy na pewno chcesz trwale usunąć to wydarzenie? Ta akcja jest nieodwracalna."
        confirmText="Usuń"
        onConfirm={executeDelete}
        onClose={() => setConfirmOpen(false)}
      />
      <Modal isOpen={isOpen} onClose={onClose} title={mode === 'create' ? 'Utwórz Nowe Wydarzenie' : 'Edytuj Wydarzenie'} footer={footer}>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-bg-400 pb-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'details' ? 'bg-bg-300 text-text-900' : 'text-text-900 hover:bg-bg-200'}`}
          >
            Szczegóły
          </button>
          {mode === 'edit' && (
            <button
              onClick={() => setActiveTab('results')}
              className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-colors ${activeTab === 'results' ? 'bg-bg-300 text-text-900' : 'text-text-900 hover:bg-bg-200'}`}
            >
              Wyniki
            </button>
          )}
        </div>

        <div className="flex-1 pr-2 custom-scrollbar min-h-[300px]">
          {activeTab === 'details' ? (
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-text-700 text-center">Nazwa Wydarzenia:</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Wprowadź nazwę..." className="text-center" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-700 text-center">ID Turnieju:</label>
                  <Select
                    value={tournamentId}
                    onChange={setTournamentId}
                    disabled={mode === 'edit' || fetching}
                    options={fetching
                      ? [{ value: '', label: 'Ładowanie...' }]
                      : tournaments.length === 0
                        ? [{ value: '', label: 'Brak dostępnych turniejów' }]
                        : tournaments.map(t => ({ value: t.id, label: `${t.displayed_name} (${t.id})` }))
                    }
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-700 text-center">Ważność:</label>
                  <Select
                    value={isMajor ? 'true' : 'false'}
                    onChange={val => setIsMajor(val === 'true')}
                    options={[
                      { value: 'false', label: 'Małe wydarzenie' },
                      { value: 'true', label: 'Główne wydarzenie' }
                    ]}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-700 text-center">Początek:</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="bg-bg-300 border border-bg-400 rounded p-2 text-center text-text-900 outline-none focus:border-accent-500 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-text-700 text-center">Koniec (Opcjonalne):</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="bg-bg-300 border border-bg-400 rounded p-2 text-center text-text-900 outline-none focus:border-accent-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-bg-400">
                    <th className="p-3 text-text-700 font-semibold">Gracz</th>
                    <th className="p-3 text-text-700 font-semibold text-center w-24">Pozycja</th>
                    <th className="p-3 text-text-700 font-semibold text-center w-24">Punkty</th>
                  </tr>
                </thead>
                <tbody>
                  {results.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-text-500">Brak graczy przypisanych do tego turnieju.</td></tr>
                  ) : (
                    results.map((r, idx) => (
                      <tr key={r.player_id} className="border-b border-bg-400/50 hover:bg-bg-200 transition-colors">
                        <td className="p-3 font-semibold text-text-900">{r.displayed_name}</td>
                        <td className="p-3 text-center">
                          <NumberInput
                            value={r.position ?? ''}
                            onChange={e => updateResult(idx, 'position', e.target.value)}
                            placeholder="-"
                            className="w-16 mx-auto"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <NumberInput
                            value={r.points ?? ''}
                            onChange={e => updateResult(idx, 'points', e.target.value)}
                            placeholder="-"
                            className="w-16 mx-auto"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
