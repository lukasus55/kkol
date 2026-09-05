import type { Metadata } from 'next';
import { UserProvider } from '../../components/dashboard/UserProvider';
import DashboardLayoutClient from '../../components/dashboard/DashboardLayoutClient';

export const metadata: Metadata = {
  title: 'Panel Gracza - Karwińska Olimpiada',
  description: 'Zarządzaj swoim kontem, przeglądaj kalendarz turniejów i bierz udział w ankietach.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <DashboardLayoutClient>
        {children}
      </DashboardLayoutClient>
    </UserProvider>
  );
}
