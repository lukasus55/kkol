'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../ui/ToastProvider';
import { Input } from '../../ui/Input';
import { Search, X, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import WeeklyTimeGrid, { TimeBlock } from './WeeklyTimeGrid';

export default function SharedAvailability({ user }: { user: any }) {
  const { addToast } = useToast();
  
  const [friends, setFriends] = useState<any[]>([]);
  const [defaults, setDefaults] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const fetchShared = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/availability_shared');
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setDefaults(data.defaults || []);
        setOverrides(data.overrides || []);
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Nie udało się pobrać dostępności innych.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchShared();
  }, [fetchShared]);

  const currentStatuses = useMemo(() => {
    const now = new Date();
    const currentDayStr = now.toISOString().split('T')[0];
    const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
    const currentHourNum = now.getHours() + (now.getMinutes() / 60);

    const statuses: Record<string, 'available' | 'maybe' | 'unavailable' | 'unknown'> = {};

    friends.forEach(f => {
      const todayOverrides = overrides.filter(o => o.player_id === f.id && o.specific_date.split('T')[0] === currentDayStr);
      let status: any = null;

      if (todayOverrides.length > 0) {
        const activeOverride = todayOverrides.find(o => {
          const [sh, sm] = o.start_time.split(':').map(Number);
          const [eh, em] = o.end_time.split(':').map(Number);
          const shNum = sh + sm/60;
          const ehNum = eh + em/60;
          return currentHourNum >= shNum && currentHourNum < ehNum;
        });
        if (activeOverride) status = activeOverride.status;
        else status = 'unavailable'; 
      } else {
        const todayDefaults = defaults.filter(d => d.player_id === f.id && d.day_of_week === currentDayOfWeek);
        const activeDefault = todayDefaults.find(d => {
          const [sh, sm] = d.start_time.split(':').map(Number);
          const [eh, em] = d.end_time.split(':').map(Number);
          const shNum = sh + sm/60;
          const ehNum = eh + em/60;
          return currentHourNum >= shNum && currentHourNum < ehNum;
        });
        if (activeDefault) status = activeDefault.status;
        else status = 'unavailable';
      }

      statuses[f.id] = status || 'unknown';
    });

    return statuses;
  }, [friends, defaults, overrides]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return friends;
    return friends.filter(f => f.displayed_name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [friends, searchQuery]);

  const parseHour = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m / 60);
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

  const selectedUserBlocks = useMemo(() => {
    if (!selectedUserId) return [];
    
    const weekDates = getWeekDateStrings();
    const blocks: TimeBlock[] = [];
    
    for (let i = 0; i < 7; i++) {
      const dateStr = weekDates[i];
      const dayOverrides = overrides.filter(o => o.player_id === selectedUserId && o.specific_date.split('T')[0] === dateStr);
      
      if (dayOverrides.length > 0) {
        dayOverrides.forEach(o => {
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
        const dayDefaults = defaults.filter(d => d.player_id === selectedUserId && d.day_of_week === i + 1);
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
  }, [selectedUserId, currentWeekStart, defaults, overrides]);

  const hasOverridesMap = useMemo(() => {
    if (!selectedUserId) return {};
    const map: Record<number, boolean> = {};
    const weekDates = getWeekDateStrings();
    for (let i = 0; i < 7; i++) {
      map[i] = overrides.some(o => o.player_id === selectedUserId && o.specific_date.split('T')[0] === weekDates[i]);
    }
    return map;
  }, [selectedUserId, overrides, currentWeekStart]);

  if (loading && friends.length === 0) {
    return <div className="p-4 text-text-500">Ładowanie interfejsu...</div>;
  }

  const selectedUser = friends.find(f => f.id === selectedUserId);

  if (selectedUserId && selectedUser) {
    return (
      <div className="flex flex-col h-full overflow-hidden p-0 gap-0">
        <div className="flex-1 overflow-hidden">
          <WeeklyTimeGrid 
            mode="specific_week"
            weekStartDate={currentWeekStart}
            initialBlocks={selectedUserBlocks}
            hasOverridesMap={hasOverridesMap}
            readOnly={true}
            headerLeft={
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedUserId(null)}
                  className="flex items-center justify-center p-2 rounded hover:bg-bg-300 text-text-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-bg-200 border border-bg-400 overflow-hidden">
                    <img
                      src={selectedUser.pfp_base64 ? (selectedUser.pfp_base64.startsWith('data:image') ? selectedUser.pfp_base64 : 'data:image/jpeg;base64,' + selectedUser.pfp_base64) : '/img/default_pfp.webp'}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-bold text-text-900">{selectedUser.displayed_name}</span>
                </div>
              </div>
            }
            headerRight={
              <div className="flex items-center gap-6">
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
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6 w-full max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-900">Dostępność Innych</h1>
      </div>
      
      <div className="relative w-full max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-500">
          <Search className="w-5 h-5" />
        </div>
        <Input 
          className="pl-10 pr-10 py-2.5 w-full bg-bg-200 border-bg-300 text-text-900 placeholder-text-500 rounded-md focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
          placeholder="Szukaj gracza..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button 
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-500 hover:text-text-700"
            onClick={() => setSearchQuery('')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col border border-bg-300 rounded-md overflow-hidden bg-bg-100">
        {friends.length === 0 && !loading && (
          <div className="p-8 text-center text-text-500">Nie ma obecnie innych graczy w Twoich aktywnych turniejach.</div>
        )}
        
        {filteredFriends.map(f => {
          const status = currentStatuses[f.id];
          const statusText = status === 'available' ? 'Dostępny' : status === 'maybe' ? 'Być może' : status === 'unavailable' ? 'Niedostępny' : 'Nieznany';
          const statusColors = status === 'available' ? 'bg-green-500/20 text-green-700 border-green-500/30' : 
                               status === 'maybe' ? 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30' : 
                               'bg-red-500/10 text-red-700 border-red-500/20';
          const dotColor = status === 'available' ? 'bg-green-500' : status === 'maybe' ? 'bg-yellow-500' : 'bg-red-500';

          return (
            <button
              key={f.id}
              onClick={() => setSelectedUserId(f.id)}
              className="flex items-center justify-between p-4 border-b border-bg-300 last:border-0 hover:bg-bg-200 transition-colors text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-bg-300 border border-bg-400 overflow-hidden flex-shrink-0">
                  <img
                    src={f.pfp_base64 ? (f.pfp_base64.startsWith('data:image') ? f.pfp_base64 : 'data:image/jpeg;base64,' + f.pfp_base64) : '/img/default_pfp.webp'}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-text-900">{f.displayed_name}</span>
                </div>
              </div>
              
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusColors} text-sm font-semibold`}>
                <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
                {statusText}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
