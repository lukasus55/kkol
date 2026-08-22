import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ranking - Karwińska Olimpiada',
  description: 'Sprawdź aktualny ranking zawodników Karwińskiej Olimpiady. Zobacz kto prowadzi w klasyfikacji generalnej.',
};

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
