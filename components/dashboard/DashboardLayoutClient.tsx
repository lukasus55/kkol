'use client';

import { useUser } from './UserProvider';
import DashboardNav from './DashboardNav';

export default function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <main className="w-full bg-bg-100 flex justify-center">
        <div className="w-full grid grid-rows-[auto_1fr] md:grid-rows-1 grid-cols-1 md:grid-cols-[20rem_1fr] min-h-[calc(100vh-60px)]">
          {/* Skeleton Navigation (mirrors DashboardNav on mobile & desktop) */}
          <nav className="w-full md:w-auto h-auto md:h-[calc(100vh-64px)] md:sticky md:top-16 z-[40]">
            {/* Mobile Top Bar Skeleton */}
            <div className="md:hidden w-full bg-bg-200 border-b border-bg-300 px-4 py-3.5 flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <div className="h-3.5 bg-bg-300 rounded w-12" />
                <div className="h-4 bg-bg-300 rounded w-28" />
              </div>
              <div className="h-3.5 bg-bg-300 rounded w-10" />
            </div>

            {/* Desktop Sidebar Skeleton */}
            <div className="hidden md:grid bg-bg-200 w-full h-full md:grid-rows-[1fr_auto] md:grid-cols-1 border-r border-bg-300 animate-pulse">
              {/* Nav links skeleton matching DashboardNav exact dimensions */}
              <div className="p-4 w-full h-full flex flex-col gap-1 overflow-y-auto custom-scrollbar">
                {/* 1. Podsumowanie (active styling) */}
                <div className="flex items-center w-full h-9 gap-3 rounded-md px-3 bg-bg-300">
                  <div className="w-4 h-4 rounded bg-bg-400 shrink-0" />
                  <div className="h-4 bg-bg-400 rounded w-28" />
                </div>

                {/* 2. Konto */}
                <div className="flex items-center w-full h-9 gap-3 rounded-md px-3">
                  <div className="w-4 h-4 rounded bg-bg-300 shrink-0" />
                  <div className="h-4 bg-bg-300 rounded w-16" />
                </div>

                {/* 3. Turnieje */}
                <div className="flex items-center w-full h-9 gap-3 rounded-md px-3">
                  <div className="w-4 h-4 rounded bg-bg-300 shrink-0" />
                  <div className="h-4 bg-bg-300 rounded w-20" />
                </div>

                {/* 4. Kalendarz */}
                <div className="flex items-center justify-between w-full h-9 rounded-md px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-bg-300 shrink-0" />
                    <div className="h-4 bg-bg-300 rounded w-20" />
                  </div>
                  <div className="w-3.5 h-3.5 rounded bg-bg-300 shrink-0" />
                </div>

                {/* 5. Głosowania */}
                <div className="flex items-center w-full h-9 gap-3 rounded-md px-3">
                  <div className="w-4 h-4 rounded bg-bg-300 shrink-0" />
                  <div className="h-4 bg-bg-300 rounded w-24" />
                </div>
              </div>

              {/* Bottom user profile card matching DashboardNav */}
              <div className="grid p-4 w-full bg-bg-300 h-24 grid-cols-[auto_1fr_auto] grid-rows-1 gap-x-4 items-center">
                <div className="w-12 h-12 rounded-full bg-bg-400 shrink-0" />

                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="h-4 bg-bg-400 rounded w-24" />
                  <div className="h-3 bg-bg-400 rounded w-16" />
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-bg-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-bg-400" />
                  <div className="w-1.5 h-1.5 rounded-full bg-bg-400" />
                </div>
              </div>
            </div>
          </nav>

          {/* Content Area placeholder while user auth initializes */}
          <div className="w-full flex flex-col overflow-hidden bg-bg-100" />
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
