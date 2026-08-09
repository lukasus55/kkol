import React, { useState, useEffect } from 'react';
import { Modal } from '../../ui/Modal';
import { useToast } from '../../ui/ToastProvider';

interface TournamentEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: any;
}

export function TournamentEventsModal({ isOpen, onClose, tournament }: TournamentEventsModalProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?tournament=${tournament.id}&format=list`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data || []);
      } else {
        addToast({ type: 'error', message: 'Nie udało się pobrać wydarzeń.' });
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setLoading(false);
    }
  };

  const getRelativeStatus = (eventDate: string) => {
    const date = new Date(eventDate);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Zakończone';
    if (diffDays === 0) return 'Dzisiaj';
    return `Za ${diffDays} dni`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Wydarzenia: ${tournament?.displayed_name || tournament?.id}`}
    >
      <div className="text-text-700 text-sm mb-4">
        Lista wydarzeń przypisanych do tego turnieju.
      </div>
      <div className="flex flex-col gap-3 min-h-[150px] max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {loading ? (
          <div className="text-center text-text-700 py-8">Ładowanie wydarzeń...</div>
        ) : events.length === 0 ? (
          <div className="text-center text-text-700 py-8">Brak wydarzeń dla tego turnieju.</div>
        ) : (
          events
            .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
            .map(event => (
              <div
                key={event.id}
                className={`flex items-center justify-between p-4 rounded-md border ${event.is_major
                  ? 'bg-accent-500/10 border-accent-500/30'
                  : 'bg-bg-300 border-bg-400'
                  }`}
              >
                <div className="flex flex-col gap-1">
                  <span className="font-bold text-text-900 text-sm">{event.name}</span>
                  <span className="text-text-700 text-xs">
                    {new Date(event.event_date).toLocaleDateString('pl-PL')}
                  </span>
                </div>
                <div className="text-text-700 text-xs font-medium">
                  {getRelativeStatus(event.event_date)}
                </div>
              </div>
            ))
        )}
      </div>
    </Modal>
  );
}
