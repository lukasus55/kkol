import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sezon 2025 - Karwińska Olimpiada',
  description: 'Archiwum edycji z roku 2025. Przejrzyj kalendarz, dyscypliny i statystyki gier z tego sezonu.',
};

export default function Season2025Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
