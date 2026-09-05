'use client';

import { useUser } from './UserProvider';
import DashboardNav from './DashboardNav';

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

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
        <DashboardNav user={user} />
        
        <div className="w-full flex flex-col pb-10 overflow-hidden">
          {children}
        </div>
      </div>

      {/* Popups / Modals placeholder */}
    </main>
  );
}
