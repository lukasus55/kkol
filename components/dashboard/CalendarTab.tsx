'use client';

import { useState, useEffect, useCallback } from 'react';
import { Maximize2 } from 'lucide-react';
import { useToast } from '../ui/ToastProvider';
import MyAvailability from './availability/MyAvailability';
import FullCalendar from './calendar/FullCalendar';

export default function CalendarTab({ user }: { user: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const { addToast } = useToast();

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await fetch(`/api/events?player=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        const upcoming = data
          .filter((e: any) => new Date(e.start) >= new Date())
          .sort((a: any, b: any) => new Date(a.start).getTime() - new Date(b.start).getTime());
        setEvents(upcoming);
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Nie udało się pobrać nadchodzących wydarzeń.' });
    } finally {
      setLoadingEvents(false);
    }
  }, [user.id, addToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="flex flex-col md:flex-row h-full min-h-0 w-full p-4 gap-4 bg-bg-100 overflow-hidden">
      
      <div className={`flex-shrink-0 flex flex-col bg-bg-200 rounded-md p-4 overflow-hidden border-none transition-all duration-300 ${isCalendarExpanded ? 'w-full' : 'w-full md:w-80'}`}>
        <div className="flex justify-between items-center mb-4 border-b border-bg-400 pb-2">
          <h3 className="text-lg font-bold text-text-900">Nadchodzące Wydarzenia</h3>
          <button 
            onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}
            className="p-1 hover:bg-bg-300 rounded text-text-500 hover:text-text-900 transition-colors"
            title={isCalendarExpanded ? "Zwiń kalendarz" : "Powiększ kalendarz (edycja)"}
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
        
        {isCalendarExpanded ? (
          <FullCalendar user={user} onCollapse={() => {
            setIsCalendarExpanded(false);
            fetchEvents();
          }} />
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto custom-scrollbar h-full pr-1">
            {loadingEvents ? (
              <p className="text-text-500 text-sm">Ładowanie wydarzeń...</p>
            ) : events.length === 0 ? (
              <p className="text-text-500 text-sm italic">Brak nadchodzących wydarzeń.</p>
            ) : (
              events.map((evt, idx) => {
                const eventDate = new Date(evt.start);
                const dateStr = eventDate.toLocaleDateString('pl-PL');
                const timeStr = eventDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
                const isMajor = evt.extendedProps?.is_major;

                return (
                  <div key={idx} className="p-3 rounded-md border border-bg-400 bg-bg-100 flex flex-col">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isMajor ? 'bg-text-400' : 'bg-text-700'}`} title={isMajor ? "Główne Wydarzenie" : "Mniejsze Wydarzenie"} />
                      <span className="font-bold text-text-900 truncate">{evt.title}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs font-semibold text-text-500 pl-[18px]">
                      <span>{dateStr}</span>
                      <span>{timeStr}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {!isCalendarExpanded && (
        <div className="flex-1 flex flex-col bg-bg-200 rounded-md p-0 overflow-hidden border-none transition-all duration-300">
          <div className="flex-1 overflow-hidden p-4">
             <MyAvailability user={user} />
          </div>
        </div>
      )}
    </div>
  );
}
