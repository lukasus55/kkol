import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sezon 2024 - Karwińska Olimpiada',
  description: 'Archiwum pierwszej edycji z roku 2024. Zobacz historię, kalendarz, dyscypliny i statystyki gier z tego sezonu.',
};

export default function Season2024Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
