import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Wydarzenia - Karwińska Olimpiada',
  description: 'Przeglądaj pełną historię turniejów, wydarzeń i mistrzostw Karwińskiej Olimpiady.',
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
