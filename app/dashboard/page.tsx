'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '../../components/dashboard/DashboardNav';
import TournamentsTab from '../../components/dashboard/TournamentsTab';
import CalendarTab from '../../components/dashboard/CalendarTab';
import PollsTab from '../../components/dashboard/PollsTab';
import AccountTab from '../../components/dashboard/AccountTab';


export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'account' | 'tournaments' | 'calendar' | 'polls'>('account');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        router.push('/login?r=dashboard');
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="loader-global" id="loader-global">
        <div className="loader_spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="w-full bg-bg-100 flex justify-center">
      <div className="w-full grid grid-rows-[auto_1fr] md:grid-rows-1 grid-cols-1 md:grid-cols-[20rem_1fr] min-h-[calc(100vh-60px)]">
        <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} user={user} />

        <div className="w-full flex flex-col pb-10 overflow-hidden">
          {activeTab === 'account' && <AccountTab user={user} />}
          {activeTab === 'tournaments' && <TournamentsTab user={user} refreshUser={fetchUser} />}
          {activeTab === 'calendar' && <CalendarTab user={user} />}
          {activeTab === 'polls' && <PollsTab user={user} />}
        </div>
      </div>

      {/* TODO: Add Popups / Modals here later */}
    </main>
  );
}
