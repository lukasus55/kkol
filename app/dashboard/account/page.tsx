'use client';

import AccountTab from '../../../components/dashboard/AccountTab';
import { useUser } from '../../../components/dashboard/UserProvider';

export default function AccountPage() {
  const { user } = useUser();
  if (!user) return null;
  return <AccountTab user={user} />;
}
