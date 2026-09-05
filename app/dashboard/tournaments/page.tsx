'use client';

import TournamentsTab from '../../../components/dashboard/TournamentsTab';
import { useUser } from '../../../components/dashboard/UserProvider';

export default function TournamentsPage() {
  const { user, fetchUser } = useUser();
  if (!user) return null;
  return <TournamentsTab user={user} refreshUser={fetchUser} />;
}
