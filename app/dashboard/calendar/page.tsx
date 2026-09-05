'use client';

import FullCalendar from '../../../components/dashboard/calendar/FullCalendar';
import { useUser } from '../../../components/dashboard/UserProvider';

export default function CalendarPage() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="h-full w-full p-4 overflow-hidden">
      <div className="bg-bg-200 rounded-md p-4 h-full w-full">
        <FullCalendar user={user} onCollapse={() => {}} />
      </div>
    </div>
  );
}
