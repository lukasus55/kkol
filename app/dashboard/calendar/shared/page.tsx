'use client';
import { useUser } from '../../../../components/dashboard/UserProvider';
import SharedAvailability from '../../../../components/dashboard/availability/SharedAvailability';

export default function SharedAvailabilityPage() {
  const { user } = useUser();

  if (!user) return null;

  return <SharedAvailability user={user} />;
}