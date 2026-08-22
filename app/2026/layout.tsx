import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sezon 2026 - Karwińska Olimpiada',
  description: 'Odkryj wszystkie informacje o najnowszym sezonie 2026: kalendarz, dyscypliny i statystyki gier z tej edycji.',
};

export default function Season2026Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
