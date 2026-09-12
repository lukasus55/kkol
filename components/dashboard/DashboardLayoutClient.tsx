'use client';

import { useUser } from './UserProvider';
import DashboardNav from './DashboardNav';

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <main className="w-full bg-bg-100 flex justify-center">
        <div className="w-full grid grid-rows-[auto_1fr] md:grid-rows-1 grid-cols-1 md:grid-cols-[20rem_1fr] min-h-[calc(100vh-64px)]">
          {/* Skeleton Sidebar */}
          <aside className="bg-bg-200 border-r border-bg-300 p-6 flex flex-col justify-between animate-pulse">
            <div className="space-y-6">
              {/* Logo / Header placeholder */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-bg-300" />
                <div className="h-5 bg-bg-300 rounded w-32" />
              </div>

              {/* Nav links skeleton */}
              <div className="space-y-3 pt-4">
                <div className="h-10 bg-bg-300 rounded-md w-full" />
                <div className="h-10 bg-bg-300/70 rounded-md w-full" />
                <div className="h-10 bg-bg-300/50 rounded-md w-full" />
                <div className="h-10 bg-bg-300/40 rounded-md w-full" />
              </div>
            </div>

            {/* User profile card skeleton */}
            <div className="flex items-center gap-3 pt-6 border-t border-bg-300/50">
              <div className="w-10 h-10 rounded-full bg-bg-300 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-3.5 bg-bg-300 rounded w-24" />
                <div className="h-2.5 bg-bg-300/60 rounded w-16" />
              </div>
            </div>
          </aside>

          {/* Skeleton Content Area */}
          <div className="p-6 md:p-10 space-y-6 animate-pulse">
            <div className="h-8 bg-bg-200 rounded w-48" />
            <div className="h-4 bg-bg-200/80 rounded w-72" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="h-44 bg-bg-200 rounded-md" />
              <div className="h-44 bg-bg-200 rounded-md" />
            </div>

            <div className="h-64 bg-bg-200 rounded-md" />
          </div>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main className="w-full bg-bg-100 flex justify-center">
      <div className="w-full grid grid-rows-[auto_1fr] md:grid-rows-1 grid-cols-1 md:grid-cols-[20rem_1fr] min-h-[calc(100vh-60px)]">
        <DashboardNav user={user} />
        
        <div className="w-full flex flex-col overflow-hidden">
          {children}
        </div>
      </div>

      {/* Popups / Modals placeholder */}
    </main>
  );
}
