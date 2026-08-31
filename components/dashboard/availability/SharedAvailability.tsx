'use client';
import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../ui/ToastProvider';

const DAYS = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

const STATUS_MAP: Record<string, string> = {
  'available': 'Dostępny',
  'maybe': 'Być może',
  'unavailable': 'Niedostępny'
};

export default function SharedAvailability({ user }: { user: any }) {
  const { addToast } = useToast();
  const [friends, setFriends] = useState<any[]>([]);
  const [defaults, setDefaults] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShared = useCallback(async () => {
    try {
      const res = await fetch('/api/availability_shared');
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setDefaults(data.defaults || []);
        setOverrides(data.overrides || []);
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Nie udało się pobrać udostępnionej dostępności.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchShared();
  }, [fetchShared]);

  if (loading) return <div className="text-text-500 p-4">Ładowanie dostępności znajomych...</div>;

  if (friends.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center h-full opacity-70">
        <p className="text-xl font-bold text-text-900 mb-2">Brak aktywnych turniejów</p>
        <p className="text-text-500 max-w-md">Możesz zobaczyć dostępność tylko tych graczy, z którymi dzielisz aktywny, nieukończony turniej.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar p-2">
      <h3 className="text-xl font-bold text-text-900 mb-2">Dostępność Znajomych</h3>
      
      <div className="flex flex-col gap-8">
        {friends.map(friend => {
          const friendDefaults = defaults.filter(d => d.player_id === friend.id).sort((a,b) => a.day_of_week - b.day_of_week);
          const friendOverrides = overrides.filter(o => o.player_id === friend.id).sort((a,b) => new Date(a.specific_date).getTime() - new Date(b.specific_date).getTime());
          
          return (
            <div key={friend.id} className="bg-bg-100 rounded-md p-5 border border-bg-400">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-300">
                  {friend.pfp_base64 ? (
                    <img src={friend.pfp_base64} alt={friend.displayed_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-500 text-lg font-bold">
                      {friend.displayed_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-lg text-text-900">{friend.displayed_name}</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-sm font-bold text-text-500 uppercase tracking-wider mb-2 border-b border-bg-400 pb-1">Tygodniowa Rutyna</h5>
                  {friendDefaults.length === 0 ? (
                    <p className="text-text-500 text-sm">Brak domyślnego harmonogramu.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {friendDefaults.map(d => (
                        <li key={d.id} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-text-900">{DAYS[d.day_of_week - 1]}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-text-700">{d.start_time.substring(0,5)} - {d.end_time.substring(0,5)}</span>
                            <div className={`w-2.5 h-2.5 rounded-full ${d.status === 'available' ? 'bg-green-500' : d.status === 'maybe' ? 'bg-yellow-500' : 'bg-red-500'}`} title={STATUS_MAP[d.status]}></div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h5 className="text-sm font-bold text-text-500 uppercase tracking-wider mb-2 border-b border-bg-400 pb-1">Nadchodzące Wyjątki</h5>
                  {friendOverrides.length === 0 ? (
                    <p className="text-text-500 text-sm">Brak konkretnych wyjątków.</p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {friendOverrides.map(o => (
                        <li key={o.id} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-text-900">{new Date(o.specific_date).toLocaleDateString('pl-PL')}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-text-700">{o.start_time.substring(0,5)} - {o.end_time.substring(0,5)}</span>
                            <div className={`w-2.5 h-2.5 rounded-full ${o.status === 'available' ? 'bg-green-500' : o.status === 'maybe' ? 'bg-yellow-500' : 'bg-red-500'}`} title={STATUS_MAP[o.status]}></div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
