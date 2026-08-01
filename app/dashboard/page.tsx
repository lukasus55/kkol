'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNav from '../../components/dashboard/DashboardNav';
import TournamentsTab from '../../components/dashboard/TournamentsTab';
import CalendarTab from '../../components/dashboard/CalendarTab';
import PollsTab from '../../components/dashboard/PollsTab';
import AccountTab from '../../components/dashboard/AccountTab';

import '../../public/css/dashboard/dashboard.css';
import '../../public/css/dashboard/account.css';
import '../../public/css/dashboard/tournaments.css';
import '../../public/css/dashboard/calendar.css';
import '../../public/css/dashboard/polls.css';

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'account' | 'tournaments' | 'calendar' | 'polls'>('account');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Authenticate and fetch user data
    const fetchUser = async () => {
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
    };
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="loader-global" id="loader-global">
        <div className="loader_spinner"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="main">
      <div className="dashboard">
        <DashboardNav activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
        
        <div className="content">
          {activeTab === 'account' && <AccountTab user={user} />}
          {activeTab === 'tournaments' && <TournamentsTab user={user} />}
          {activeTab === 'calendar' && <CalendarTab user={user} />}
          {activeTab === 'polls' && <PollsTab user={user} />}
        </div>
      </div>
      
      {/* TODO: Add Popups / Modals here later */}
    </main>
  );
}
