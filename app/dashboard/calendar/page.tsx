'use client';

import FullCalendar from '../../../components/dashboard/calendar/FullCalendar';
import { useUser } from '../../../components/dashboard/UserProvider';

export default function CalendarPage() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="h-full w-full flex flex-col bg-bg-200">
      <FullCalendar user={user} onCollapse={() => {}} />
    </div>
  );
}
