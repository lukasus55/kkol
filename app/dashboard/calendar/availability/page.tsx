'use client';

import MyAvailability from '../../../../components/dashboard/availability/MyAvailability';
import { useUser } from '../../../../components/dashboard/UserProvider';

export default function AvailabilityPage() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="h-full w-full p-4 overflow-hidden">
      <div className="bg-bg-200 rounded-md p-4 h-full w-full flex flex-col">
        <MyAvailability user={user} />
      </div>
    </div>
  );
}
