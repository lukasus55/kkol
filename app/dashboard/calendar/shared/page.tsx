'use client';
import { useUser } from '../../../../components/dashboard/UserProvider';
import SharedAvailability from '../../../../components/dashboard/availability/SharedAvailability';

export default function SharedAvailabilityPage() {
  const { user, loading } = useUser();

  if (loading || !user) {
    return <div className="p-8 text-text-500">Ładowanie...</div>;
  }

  return <SharedAvailability user={user} />;
}