'use client';

import SummaryTab from '../../../components/dashboard/SummaryTab';
import { useUser } from '../../../components/dashboard/UserProvider';

export default function SummaryPage() {
  const { user } = useUser();
  if (!user) return null;
  return <SummaryTab user={user} />;
}
