'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';
import { useToast } from '../ui/ToastProvider';
import { EventEditorModal } from './calendar/EventEditorModal';

const MONTH_NAMES = ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"];
const DAY_NAMES = ["pon.", "wt.", "śr.", "czw.", "pt.", "sob.", "niedz."];

export default function CalendarTab({ user }: { user: any }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week'>('month');
  const { addToast } = useToast();

  const [modalState, setModalState] = useState<{ isOpen: boolean, mode: 'create' | 'edit', initialData: any }>({
    isOpen: false,
    mode: 'create',
    initialData: null
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events?player=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (e) {
      console.error(e);
      addToast({ type: 'error', message: 'Nie udało się pobrać wydarzeń z kalendarza.' });
    } finally {
      setLoading(false);
    }
  }, [user.id, addToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // 0 = Sun, 1 = Mon. Convert to Mon=0, Sun=6
    let startingDayOfWeek = firstDay.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const grid = [];

    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      grid.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      grid.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    const remaining = 42 - grid.length;
    for (let i = 1; i <= remaining; i++) {
      grid.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return grid;
  };

  const [dragState, setDragState] = useState<{ eventId: string | null; hoveredDate: Date | null }>({
    eventId: null,
    hoveredDate: null,
  });

  const getTransparentImage = () => {
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    return img;
  };

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault();
    setDragState({ eventId: null, hoveredDate: null });

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;

      const data = JSON.parse(dataStr);
      const eventId = data.id;
      const originalDateString = data.start;

      if (!eventId || !originalDateString) return;

      const originalDate = new Date(originalDateString);

      // Normalize targetDate to midnight
      const targetMidnight = new Date(targetDate);
      targetMidnight.setHours(0, 0, 0, 0);

      // Normalize originalDate to midnight
      const originalMidnight = new Date(originalDate);
      originalMidnight.setHours(0, 0, 0, 0);

      const diffTime = targetMidnight.getTime() - originalMidnight.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return;

      const evt = events.find(ev => ev.id === eventId);
      if (!evt) return;

      const newStart = new Date(new Date(evt.start).getTime() + diffDays * 24 * 60 * 60 * 1000);
      const newEnd = evt.end ? new Date(new Date(evt.end).getTime() + diffDays * 24 * 60 * 60 * 1000) : null;

      // Optimistic update
      setEvents(prev => prev.map(ev =>
        ev.id === eventId
          ? { ...ev, start: newStart.toISOString(), end: newEnd ? newEnd.toISOString() : null }
          : ev
      ));

      const res = await fetch('/api/event_update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: evt.id,
          name: evt.title,
          is_major: evt.extendedProps?.is_major,
          start_date: newStart.toISOString(),
          end_date: newEnd ? newEnd.toISOString() : null
        })
      });
      if (!res.ok) {
        addToast({ type: 'error', message: 'Nie udało się przenieść wydarzenia.' });
        fetchEvents();
      } else {
        addToast({ type: 'success', message: 'Przeniesiono wydarzenie.' });
      }
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', message: 'Wystąpił błąd przy przenoszeniu.' });
      fetchEvents();
    }
  };

  const grid = getMonthGrid();
  const today = new Date();

  return (
    <div className="flex flex-col w-full h-[calc(100vh-80px)] pb-6">

      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-bg-100 flex-shrink-0">
        <button
          onClick={handleToday}
          className="px-4 py-1.5 rounded-md bg-bg-300 border border-bg-400 text-sm font-medium text-text-900 hover:text-text-900 hover:bg-bg-200 transition-colors"
        >
          Dzisiaj
        </button>

        <div className="flex items-center gap-6">
          <button onClick={handlePrevMonth} className="p-1.5 rounded-full text-text-700 hover:text-text-900 hover:bg-bg-200 transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>

          <h2 className="text-xl font-bold w-48 text-center text-text-900 capitalize tracking-wide">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button onClick={handleNextMonth} className="p-1.5 rounded-full text-text-700 hover:text-text-900 hover:bg-bg-200 transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="w-20"></div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 px-6 overflow-hidden min-h-0">
        <div className="w-full h-full border border-bg-400 rounded-lg overflow-hidden bg-bg-100 shadow-lg flex flex-col">

          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-bg-400 bg-bg-300/50 flex-shrink-0">
            {DAY_NAMES.map((day, idx) => (
              <div key={idx} className="py-2.5 text-center text-xs font-bold text-text-900 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 grid-rows-6 relative flex-1 min-h-0">
            {loading && grid.length === 42 && (
              <div className="absolute inset-0 bg-bg-100/40 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none"></div>
            )}

            {grid.map((cell, idx) => {
              const isToday = cell.date.toDateString() === today.toDateString();

              const dayEvents = events.filter(e => {
                const eventDate = new Date(e.start);
                return eventDate.toDateString() === cell.date.toDateString();
              }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

              const renderEventCard = (evt: any, isClone: boolean = false) => {
                const eventDate = new Date(evt.start);
                const timeStr = eventDate.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
                const isMajor = evt.extendedProps?.is_major;
                const isBeingDragged = dragState.eventId === evt.id;

                const isFadedOriginal = isBeingDragged && !isClone;

                return (
                  <Tooltip key={isClone ? `clone-${evt.id}` : evt.id} content={`${timeStr} - ${evt.title}`} position="top" forceHidden={isBeingDragged}>
                    <div
                      draggable={!isClone}
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData('text/plain', JSON.stringify({ id: evt.id, start: evt.start }));
                        // Delay state update so the browser can take a visual snapshot of the solid element first
                        setTimeout(() => {
                          setDragState({ eventId: evt.id, hoveredDate: null });
                        }, 0);
                      }}
                      onDragEnd={() => {
                        setDragState({ eventId: null, hoveredDate: null });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isClone) {
                          setModalState({ isOpen: true, mode: 'edit', initialData: evt });
                        }
                      }}
                      className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-[11px] cursor-grab active:cursor-grabbing transition-all overflow-hidden ${isFadedOriginal
                        ? 'opacity-0'
                        : isMajor
                          ? 'bg-bg-200'
                          : 'bg-bg-200'
                        } ${isClone ? 'opacity-80 shadow-lg border-accent-500/50' : !isFadedOriginal ? 'hover:brightness-125' : ''}`}
                    >
                      {isFadedOriginal ? (
                        <>
                          <span className="font-semibold flex-shrink-0 text-text-700">{timeStr}</span>
                          <span className="text-text-700 truncate font-medium ml-0.5 flex-1 text-left">{evt.title}</span>
                        </>
                      ) : (
                        <>
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 shadow-sm ${isMajor ? 'bg-text-900' : 'bg-text-500'}`} />
                          <span className={`font-semibold flex-shrink-0 text-text-700`}>
                            {timeStr}
                          </span>
                          <span className="text-text-900 truncate font-medium ml-0.5 flex-1 text-left">
                            {evt.title}
                          </span>
                        </>
                      )}
                    </div>
                  </Tooltip>
                );
              };

              return (
                <div
                  key={idx}
                  onClick={() => {
                    const dateObj = new Date(cell.date);
                    dateObj.setHours(12, 0, 0, 0);
                    setModalState({ isOpen: true, mode: 'create', initialData: { start: dateObj } });
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragState.eventId && dragState.hoveredDate?.getTime() !== cell.date.getTime()) {
                      setDragState(prev => ({ ...prev, hoveredDate: cell.date }));
                    }
                  }}
                  onDrop={(e) => handleDrop(e, cell.date)}
                  className={`min-h-0 h-full p-1.5 border-r border-b border-bg-400 transition-colors [&:nth-child(7n)]:border-r-0 [&:nth-last-child(-n+7)]:border-b-0 cursor-pointer overflow-hidden
                    ${!cell.isCurrentMonth ? 'bg-bg-300/30' : 'bg-bg-100'} 
                    ${isToday ? 'bg-accent-500/5' : ''} 
                    ${dragState.hoveredDate?.getTime() === cell.date.getTime() ? 'bg-bg-200 ring-1 ring-inset ring-accent-500/30' : ''}
                    hover:bg-bg-300/50 group flex flex-col`}
                >
                  <div className="flex justify-end mb-1 flex-shrink-0">
                    <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isToday
                      ? 'bg-accent-500'
                      : cell.isCurrentMonth
                        ? 'text-text-900 group-hover:text-text-900'
                        : 'text-bg-400'
                      }`}>
                      {cell.date.getDate()}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1 pr-0.5">
                    {dayEvents.map(evt => renderEventCard(evt, false))}

                    {/* Render ghost clone if this cell is hovered and the event isn't already from this cell */}
                    {dragState.hoveredDate?.toDateString() === cell.date.toDateString() && dragState.eventId && (() => {
                      const draggedEvt = events.find(e => e.id === dragState.eventId);
                      if (!draggedEvt || new Date(draggedEvt.start).toDateString() === cell.date.toDateString()) return null;
                      return renderEventCard(draggedEvt, true);
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <EventEditorModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        mode={modalState.mode}
        initialData={modalState.initialData}
        onSuccess={() => fetchEvents()}
        user={user}
      />
    </div>
  );
}
