import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Panel Gracza - Karwińska Olimpiada',
  description: 'Zarządzaj swoim kontem, przeglądaj kalendarz turniejów i bierz udział w ankietach.',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
