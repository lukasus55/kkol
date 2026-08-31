'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '../../ui/ToastProvider';
import { Button } from '../../ui/Button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Check } from 'lucide-react';
import WeeklyTimeGrid, { TimeBlock } from './WeeklyTimeGrid';

export default function MyAvailability({ user }: { user: any }) {
  const { addToast } = useToast();
  
  const [mode, setMode] = useState<'routine' | 'specific_week'>('routine');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  });

  const [defaults, setDefaults] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRequests, setActiveRequests] = useState(0);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/availability_get');
      if (res.ok) {
        const data = await res.json();
        setDefaults(data.defaults || []);
        setOverrides(data.overrides || []);
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Nie udało się pobrać dostępności.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const parseHour = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
  };

  const formatHour = (hourObj: number) => {
    const h = Math.floor(hourObj);
    const m = Math.round((hourObj % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const getWeekDateStrings = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      dates.push(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    }
    return dates;
  };

  const currentBlocks = useMemo(() => {
    if (mode === 'routine') {
      return defaults.map(d => ({
        id: d.id,
        dayIndex: d.day_of_week - 1,
        startHour: parseHour(d.start_time),
        endHour: parseHour(d.end_time),
        status: d.status
      }));
    } else {
      const weekDates = getWeekDateStrings();
      const blocks: TimeBlock[] = [];
      
      for (let i = 0; i < 7; i++) {
        const dateStr = weekDates[i];
        const dayOverrides = overrides.filter(o => o.specific_date.split('T')[0] === dateStr);
        
        if (dayOverrides.length > 0) {
          dayOverrides.forEach(o => {
            // We ignore dummy 00:00 blocks that were used just to signify "empty override"
            if (o.start_time === '00:00:00' && o.end_time === '00:00:00') return;
            blocks.push({
              id: o.id,
              dayIndex: i,
              startHour: parseHour(o.start_time),
              endHour: parseHour(o.end_time),
              status: o.status,
              isOverride: true
            });
          });
        } else {
          // fallback to defaults for this day
          const dayDefaults = defaults.filter(d => d.day_of_week === i + 1);
          dayDefaults.forEach(d => {
            blocks.push({
              id: 'def-' + d.id,
              dayIndex: i,
              startHour: parseHour(d.start_time),
              endHour: parseHour(d.end_time),
              status: d.status,
              isOverride: false
            });
          });
        }
      }
      return blocks;
    }
  }, [mode, defaults, overrides, currentWeekStart]);

  const hasOverridesMap = useMemo(() => {
    const map: Record<number, boolean> = {};
    if (mode === 'specific_week') {
      const weekDates = getWeekDateStrings();
      for (let i = 0; i < 7; i++) {
        map[i] = overrides.some(o => o.specific_date.split('T')[0] === weekDates[i]);
      }
    }
    return map;
  }, [mode, overrides, currentWeekStart]);

  const handleSaveRoutine = async (blocks: TimeBlock[]) => {
    setActiveRequests(prev => prev + 1);
    // Optimistic update
    setDefaults(blocks.map(b => ({
      id: b.id,
      day_of_week: b.dayIndex + 1,
      start_time: formatHour(b.startHour) + ':00',
      end_time: formatHour(b.endHour) + ':00',
      status: b.status
    })));

    try {
      const apiBlocks = blocks.map(b => ({
        day_of_week: b.dayIndex + 1,
        start_time: formatHour(b.startHour),
        end_time: formatHour(b.endHour),
        status: b.status
      }));
      
      const res = await fetch('/api/availability_bulk_defaults', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: apiBlocks })
      });
      
      if (!res.ok) {
        addToast({ type: 'error', message: 'Błąd zapisywania.' });
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Błąd zapisywania.' });
    } finally {
      setActiveRequests(prev => prev - 1);
    }
  };

  const handleSaveDayOverride = async (dateStr: string, blocks: TimeBlock[], revertToRoutine: boolean) => {
    setActiveRequests(prev => prev + 1);
    
    // Optimistic update
    setOverrides(prev => {
      const filtered = prev.filter(o => o.specific_date.split('T')[0] !== dateStr);
      if (revertToRoutine) return filtered;
      
      const newOverrides = blocks.map(b => ({
        id: b.id,
        specific_date: dateStr + 'T00:00:00.000Z',
        start_time: formatHour(b.startHour) + ':00',
        end_time: formatHour(b.endHour) + ':00',
        status: b.status
      }));
      // If there are no blocks but not revertToRoutine, it means an empty override (00:00) should be created
      if (newOverrides.length === 0) {
         newOverrides.push({
           id: 'empty-' + Date.now(),
           specific_date: dateStr + 'T00:00:00.000Z',
           start_time: '00:00:00',
           end_time: '00:00:00',
           status: 'available'
         });
      }
      return [...filtered, ...newOverrides];
    });

    try {
      const apiBlocks = blocks.map(b => ({
        start_time: formatHour(b.startHour),
        end_time: formatHour(b.endHour),
        status: b.status
      }));

      const res = await fetch('/api/availability_bulk_overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: dateStr, blocks: apiBlocks, revertToRoutine })
      });

      if (!res.ok) {
        addToast({ type: 'error', message: 'Błąd zapisywania wyjątków.' });
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Błąd zapisywania.' });
    } finally {
      setActiveRequests(prev => prev - 1);
    }
  };

  if (loading && defaults.length === 0) return <div className="p-4 text-text-500">Ładowanie interfejsu...</div>;

  return (
    <div className="flex flex-col h-full overflow-hidden p-0 gap-0">
      
      <div className="flex-1 overflow-hidden">
        <WeeklyTimeGrid 
          mode={mode}
          weekStartDate={mode === 'specific_week' ? currentWeekStart : null}
          initialBlocks={currentBlocks}
          hasOverridesMap={hasOverridesMap}
          onSaveRoutine={handleSaveRoutine}
          onSaveDayOverride={handleSaveDayOverride}
          isLoading={activeRequests > 0}
          headerLeft={
            <div className="flex items-center gap-4">
              <div className="flex bg-bg-300 p-1 rounded-md">
                <button 
                  onClick={() => setMode('routine')} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold transition-colors ${mode === 'routine' ? 'bg-bg-100 text-text-900 shadow-sm' : 'text-text-500 hover:text-text-900 hover:bg-bg-200'}`}
                >
                  <Clock className="w-4 h-4" /> Szablon Tygodnia
                </button>
                <button 
                  onClick={() => setMode('specific_week')} 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-bold transition-colors ${mode === 'specific_week' ? 'bg-bg-100 text-text-900 shadow-sm' : 'text-text-500 hover:text-text-900 hover:bg-bg-200'}`}
                >
                  <CalendarIcon className="w-4 h-4" /> Konkretny Tydzień
                </button>
              </div>
              <span className="text-sm font-medium text-text-500 hidden lg:inline">
                {mode === 'routine' ? 'Przeciągnij myszką, aby tworzyć i edytować bloki.' : 'Edytujesz wyjątki dla konkretnych dat.'}
              </span>
            </div>
          }
          headerRight={
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-sm font-bold text-text-500">
                 {activeRequests > 0 ? (
                   <>
                     <div className="w-4 h-4 border-2 border-text-400 border-t-transparent rounded-full animate-spin" />
                     <span>Zapisywanie...</span>
                   </>
                 ) : (
                   <span className="flex items-center gap-1"><Check className="w-4 h-4 opacity-70" /> Zapisane</span>
                 )}
              </div>
              {mode === 'specific_week' && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      const d = new Date(currentWeekStart);
                      d.setDate(d.getDate() - 7);
                      setCurrentWeekStart(d);
                    }}
                    className="p-1 bg-bg-300 rounded hover:bg-bg-400 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-bold text-text-900 min-w-[110px] text-center text-sm">
                    {currentWeekStart.toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })} - 
                    {new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('pl-PL', { month: 'short', day: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => {
                      const d = new Date(currentWeekStart);
                      d.setDate(d.getDate() + 7);
                      setCurrentWeekStart(d);
                    }}
                    className="p-1 bg-bg-300 rounded hover:bg-bg-400 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          }
        />
      </div>

    </div>
  );
}
