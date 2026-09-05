'use client';

import MyAvailability from '../../../../components/dashboard/availability/MyAvailability';
import { useUser } from '../../../../components/dashboard/UserProvider';

export default function AvailabilityPage() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="h-full w-full flex flex-col bg-bg-200">
      <MyAvailability user={user} />
    </div>
  );
}
