'use client';

import PollsTab from '../../../components/dashboard/PollsTab';
import { useUser } from '../../../components/dashboard/UserProvider';

export default function PollsPage() {
  const { user } = useUser();
  if (!user) return null;
  return <PollsTab user={user} />;
}
