'use client';

import { useEffect, useState } from 'react';
import { Calendar, Loader2, Clock } from 'lucide-react';

interface EventItem {
  id: number | string;
  tournament_id: string;
  creator_id: string;
  event_date: string;
  end_date?: string | null;
  name: string;
  is_major: boolean;
}

interface Tournament {
  id: string;
  displayed_name: string;
  page_exists: boolean;
  page_url?: string | null;
}

export default function HeroUpcomingEventWidget() {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUpcomingEvent() {
      try {
        const [eRes, tRes] = await Promise.all([
          fetch('/api/events?upcoming=true&format=list&limit=1'),
          fetch('/api/tournaments')
        ]);
        const eventsData = await eRes.json();
        const tournamentsData = await tRes.json();

        if (Array.isArray(eventsData) && eventsData.length > 0) {
          const firstEvent = eventsData[0];
          setEvent(firstEvent);

          if (tournamentsData && firstEvent.tournament_id) {
            setTournament(tournamentsData[firstEvent.tournament_id] || null);
          }
        }
      } catch (err) {
        console.error('Failed to load upcoming event for hero widget:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUpcomingEvent();
  }, []);

  const formatEventDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('pl-PL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full bg-bg-200 rounded-md p-4 sm:p-5 flex flex-col justify-between">
      {/* Header without link */}
      <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-bg-300">
        <Calendar className="w-4 h-4 text-white" />
        <h2 className="text-sm sm:text-base font-bold text-white tracking-wide leading-tight">
          Najbliższe Wydarzenie
        </h2>
      </div>

      {/* Content: purely informational without links */}
      {loading ? (
        <div className="py-3 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-text-500 animate-spin" />
        </div>
      ) : !event ? (
        <div className="py-2.5 text-center text-text-500 text-xs sm:text-sm">
          Brak zaplanowanych nadchodzących wydarzeń.
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 py-1">
          {/* Nazwa wydarzenia + Major + Turniej */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-bold text-white truncate max-w-full">
                {event.name}
              </span>
              {event.is_major && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 bg-bg-300 text-text-700 border border-bg-400">
                  Major
                </span>
              )}
            </div>

            {/* Przypisany turniej */}
            <div className="text-xs text-text-500 mt-0.5 truncate">
              {tournament?.displayed_name || event.tournament_id}
            </div>
          </div>

          {/* Data wydarzenia */}
          <div className="flex items-center gap-1.5 shrink-0 text-text-500 text-xs font-medium self-start sm:self-center">
            <Clock className="w-3.5 h-3.5 text-text-700 shrink-0" />
            <span className="whitespace-nowrap">{formatEventDate(event.event_date)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
