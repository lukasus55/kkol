'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/ToastProvider';
import { TournamentSettingsTab } from './TournamentSettingsTab';
import { TournamentPlayersTab } from './TournamentPlayersTab';
import { ConfirmationPopup } from '../../ui/ConfirmationPopup';
import { CheckCircle2, MinusCircle } from 'lucide-react';

interface TournamentEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: any;
  userRole: string;
  onSuccess: () => void; // call to refresh parent list
}

export function TournamentEditorModal({ isOpen, onClose, tournament, userRole, onSuccess }: TournamentEditorModalProps) {
  const [activeTab, setActiveTab] = useState<'players' | 'settings'>('players');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const [confirmConfig, setConfirmConfig] = useState<{ isOpen: boolean, title: string, message: string, onConfirm: () => void, confirmText?: string }>({
    isOpen: false, title: '', message: '', onConfirm: () => { }
  });

  const [players, setPlayers] = useState<any[]>([]);

  const [info, setInfo] = useState({
    tournament_id: tournament.id,
    displayed_name: tournament.displayed_name,
    displayed_date: tournament.details?.displayed_date || '',
    end_date: tournament.details?.end_date || '',
    finished: tournament.finished || false
  });

  const [tier, setTier] = useState(tournament.details?.tier || 'C');

  const isOwner = userRole === 'owner';

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tournament_editor_details?tournamentId=${tournament.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlayers(data.members || []);
        setCurrentUserId(data.current_user_id || null);
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Nie udało się pobrać danych turnieju.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen, tournament.id]);

  const requestConfirm = (title: string, message: string, onConfirm: () => void, confirmText = "Zatwierdź") => {
    setConfirmConfig({ isOpen: true, title, message, onConfirm, confirmText });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const results = players.map(p => ({
        player_id: p.id,
        position: p.position === '' || p.position === null ? null : parseInt(p.position, 10),
        total_points: p.total_points === '' || p.total_points === null ? null : parseFloat(p.total_points)
      }));

      const res = await fetch('/api/tournament_save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournament_id: tournament.id,
          results,
          tournament_info: {
            displayed_name: info.displayed_name.trim(),
            displayed_date: info.displayed_date.trim(),
            end_date: info.end_date,
            finished: info.finished
          }
        })
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Zapisano zmiany w turnieju.' });
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        addToast({ type: 'error', message: err.error || 'Błąd podczas zapisywania.' });
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setSaving(false);
    }
  };

  const handleKick = (playerId: string) => {
    requestConfirm(
      "Wyrzuć gracza",
      `Czy na pewno chcesz wyrzucić gracza <b>${playerId}</b> z turnieju? Usunie to wszystkie jego wyniki.`,
      async () => {
        try {
          const res = await fetch('/api/tournament_kick_player', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tournament_id: tournament.id, player_id: playerId })
          });
          if (res.ok) {
            addToast({ type: 'success', message: `Wyrzucono gracza ${playerId}.` });
            fetchData();
          } else {
            addToast({ type: 'error', message: 'Błąd podczas wyrzucania gracza.' });
          }
        } catch (e) { }
      },
      "Wyrzuć"
    );
  };

  const handleRoleChange = (playerId: string, currentRole: string) => {
    const action = currentRole === 'manager' ? 'demote' : 'promote';
    const newRole = currentRole === 'manager' ? 'gracz' : 'manager';
    requestConfirm(
      "Zmień rolę",
      `Czy na pewno chcesz zmienić rolę gracza <b>${playerId}</b> na ${newRole}?`,
      async () => {
        try {
          const res = await fetch('/api/tournament_update_organizer_role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tournament_id: tournament.id, target_player_id: playerId, action })
          });
          if (res.ok) {
            addToast({ type: 'success', message: `Pomyślnie zmieniono uprawnienia gracza ${playerId}.` });
            fetchData();
          } else {
            addToast({ type: 'error', message: 'Błąd podczas zmiany uprawnień.' });
          }
        } catch (e) { }
      }
    );
  };

  const handleAttendanceChange = async (playerId: string) => {
    try {
      const res = await fetch('/api/tournament_toggle_attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournament.id, target_player_id: playerId })
      });
      if (res.ok) {
        addToast({ type: 'success', message: 'Zaktualizowano status obecności.' });
        fetchData();
      } else {
        addToast({ type: 'error', message: 'Błąd podczas zmiany statusu obecności.' });
      }
    } catch (e) { }
  };

  const handleAddPlayer = async (playerId: string) => {
    try {
      const res = await fetch('/api/tournament_add_player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournament.id, new_player_id: playerId })
      });
      if (res.ok) {
        addToast({ type: 'success', message: `Dodano gracza ${playerId}.` });
        fetchData();
      } else {
        const err = await res.json();
        addToast({ type: 'error', message: err.error || 'Nie udało się dodać gracza.' });
      }
    } catch (e) { }
  };

  const handleTierChange = async (newTier: string) => {
    try {
      const res = await fetch('/api/tournament_change_tier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournament_id: tournament.id, new_tier: newTier })
      });
      if (res.ok) {
        setTier(newTier);
        onSuccess();
        addToast({ type: 'success', message: `Zmieniono tier na ${newTier}.` });
      }
    } catch (e) { }
  };

  const handleDelete = () => {
    requestConfirm(
      "Usuń Turniej",
      `CZY NA PEWNO CHCESZ USUNĄĆ TURNIEJ <b>${tournament.displayed_name}</b>? To całkowicie usunie wszystkie jego wyniki.`,
      async () => {
        try {
          const res = await fetch('/api/tournament_delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tournament_id: tournament.id })
          });
          if (res.ok) {
            addToast({ type: 'success', message: 'Usunięto turniej.' });
            onSuccess();
          } else {
            addToast({ type: 'error', message: 'Błąd podczas usuwania turnieju.' });
          }
        } catch (e) { }
      },
      "Usuń trwale"
    );
  };

  const Footer = (
    <div className="flex justify-between items-center w-full">
      <div className="text-sm text-text-700">
        {activeTab === 'players' ? `${players.length} uczestników` : ''}
      </div>
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onClose}>Anuluj</Button>
        <Button variant="primary" onClick={handleSave} isLoading={saving}>Zapisz zmiany</Button>
      </div>
    </div>
  );

  return (
    <>
      <ConfirmationPopup
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        confirmText={confirmConfig.confirmText}
        onClose={() => setConfirmConfig({ ...confirmConfig, isOpen: false })}
      />

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex gap-4 items-center">
            <span>Edytuj: {tournament.displayed_name}</span>

            <button
              onClick={() => setInfo({ ...info, finished: !info.finished })}
              className="flex items-center justify-center gap-2 w-[130px] py-1.5 rounded-md border transition-all duration-300 ml-4 border-bg-400 bg-bg-300 hover:bg-bg-200"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                <CheckCircle2 className={`absolute transition-all duration-500 text-accent-500 w-4 h-4 ${info.finished ? 'opacity-0 scale-50 rotate-90' : 'opacity-100 scale-100 rotate-0'}`} />
                <MinusCircle className={`absolute transition-all duration-500 text-gray-500 w-4 h-4 ${info.finished ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'}`} />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-text-700">
                {info.finished ? "Zakończony" : "W trakcie"}
              </span>
            </button>

            <div className="flex bg-bg-100 border border-bg-400 rounded-md p-1 ml-auto text-sm font-normal">
              <button
                className={`px-4 py-1.5 rounded-sm transition-colors ${activeTab === 'players' ? 'bg-bg-300 text-text-900' : 'text-text-700 hover:text-text-900'}`}
                onClick={() => setActiveTab('players')}
              >
                Uczestnicy
              </button>
              <button
                className={`px-4 py-1.5 rounded-sm transition-colors ${activeTab === 'settings' ? 'bg-bg-300 text-text-900' : 'text-text-700 hover:text-text-900'}`}
                onClick={() => setActiveTab('settings')}
              >
                Ustawienia
              </button>
            </div>
          </div>
        }
        footer={Footer}
      >
        {loading ? (
          <div className="flex justify-center py-12 text-text-700">Wczytywanie...</div>
        ) : (
          <div className="pt-2 h-full">
            {activeTab === 'players' ? (
              <TournamentPlayersTab
                players={players}
                setPlayers={setPlayers}
                isOwner={isOwner}
                currentUserId={currentUserId}
                onKick={handleKick}
                onRoleChange={handleRoleChange}
                onAttendanceChange={handleAttendanceChange}
                onAddPlayer={handleAddPlayer}
              />
            ) : (
              <TournamentSettingsTab
                info={info}
                setInfo={setInfo}
                tier={tier}
                onTierChange={handleTierChange}
                isOwner={isOwner}
                globalRole={userRole}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
