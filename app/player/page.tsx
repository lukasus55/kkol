import { redirect } from 'next/navigation';
import { PlayerSearchWrapper } from './PlayerSearchWrapper';

export const metadata = {
  title: 'Wyszukaj gracza - Karwińska Olimpiada',
  description: 'Wyszukaj profil i statystyki zawodnika Karwińskiej Olimpiady.',
};

interface PageProps {
  searchParams: Promise<{ id?: string }>;
}

export default async function PlayerPage({ searchParams }: PageProps) {
  const params = await searchParams;
  if (params.id) {
    redirect(`/player/${params.id}`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <div className="w-full max-w-lg flex flex-col items-center space-y-6">
        <h1 className="text-3xl font-bold text-text-900 text-center">Wyszukaj gracza</h1>
        <div className="w-full relative z-50">
          <PlayerSearchWrapper />
        </div>
      </div>
    </div>
  );
}
