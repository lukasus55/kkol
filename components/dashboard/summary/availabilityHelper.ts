import { LiveAvailabilityStatus } from './types';

export function computeLiveStatus(
  playerId: string,
  defaults: any[],
  overrides: any[],
  now: Date = new Date()
): LiveAvailabilityStatus {
  const currentDayStr = now.toISOString().split('T')[0];
  const currentDayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
  const currentHourNum = now.getHours() + now.getMinutes() / 60;

  const playerOverrides = overrides.filter(
    (o) => o.player_id === playerId && o.specific_date?.split('T')[0] === currentDayStr
  );

  if (playerOverrides.length > 0) {
    const activeOverride = playerOverrides.find((o) => {
      if (o.start_time === '00:00:00' && o.end_time === '00:00:00') return false;
      const [sh, sm] = (o.start_time || '0:0').split(':').map(Number);
      const [eh, em] = (o.end_time || '0:0').split(':').map(Number);
      const shNum = sh + (sm || 0) / 60;
      const ehNum = eh + (em || 0) / 60;
      return currentHourNum >= shNum && currentHourNum < ehNum;
    });

    if (activeOverride) return activeOverride.status as LiveAvailabilityStatus;
    return 'unavailable';
  }

  const playerDefaults = defaults.filter(
    (d) => d.player_id === playerId && d.day_of_week === currentDayOfWeek
  );

  if (playerDefaults.length > 0) {
    const activeDefault = playerDefaults.find((d) => {
      const [sh, sm] = (d.start_time || '0:0').split(':').map(Number);
      const [eh, em] = (d.end_time || '0:0').split(':').map(Number);
      const shNum = sh + (sm || 0) / 60;
      const ehNum = eh + (em || 0) / 60;
      return currentHourNum >= shNum && currentHourNum < ehNum;
    });

    if (activeDefault) return activeDefault.status as LiveAvailabilityStatus;
    return 'unavailable';
  }

  return 'unavailable';
}

export function getStatusDetails(status: LiveAvailabilityStatus) {
  switch (status) {
    case 'available':
      return {
        label: 'Dostępny',
        dotClass: 'bg-emerald-400',
        textClass: 'text-emerald-400 font-semibold'
      };
    case 'maybe':
      return {
        label: 'Być może',
        dotClass: 'bg-amber-400',
        textClass: 'text-amber-400 font-semibold'
      };
    case 'unavailable':
    default:
      return {
        label: 'Niedostępny',
        dotClass: 'bg-text-500',
        textClass: 'text-text-500 font-medium'
      };
  }
}

export async function fetchAvailabilitySummary(user: any): Promise<{
  userStatus: LiveAvailabilityStatus;
  friends: import('./types').SummaryFriendAvailability[];
}> {
  try {
    const [ownRes, sharedRes] = await Promise.all([
      fetch('/api/availability_get').catch(() => null),
      fetch('/api/availability_shared').catch(() => null)
    ]);

    let userStatus: LiveAvailabilityStatus = 'unavailable';
    if (ownRes && ownRes.ok) {
      const ownData = await ownRes.json();
      userStatus = computeLiveStatus(user.id, ownData.defaults || [], ownData.overrides || []);
    }

    let friends: import('./types').SummaryFriendAvailability[] = [];
    if (sharedRes && sharedRes.ok) {
      const sharedData = await sharedRes.json();
      const rawFriends = sharedData.friends || [];
      const defaults = sharedData.defaults || [];
      const overrides = sharedData.overrides || [];

      friends = rawFriends.map((f: any) => ({
        id: f.id,
        displayed_name: f.displayed_name,
        pfpSrc: f.pfp_base64
          ? (f.pfp_base64.startsWith('data:image') ? f.pfp_base64 : 'data:image/jpeg;base64,' + f.pfp_base64)
          : '/img/default_pfp.webp',
        status: computeLiveStatus(f.id, defaults, overrides)
      }));

      const priority: Record<LiveAvailabilityStatus, number> = {
        available: 0,
        maybe: 1,
        unavailable: 2
      };
      friends.sort((a, b) => (priority[a.status] ?? 2) - (priority[b.status] ?? 2));
    }

    return { userStatus, friends };
  } catch {
    return { userStatus: 'unavailable', friends: [] };
  }
}
