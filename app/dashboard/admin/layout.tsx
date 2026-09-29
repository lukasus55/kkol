'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/dashboard/UserProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdminMode } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== 'admin' || !isAdminMode) {
        router.replace('/dashboard/summary');
      }
    }
  }, [user, loading, isAdminMode, router]);

  if (loading || !user || user.role !== 'admin' || !isAdminMode) {
    return null;
  }

  return <>{children}</>;
}
