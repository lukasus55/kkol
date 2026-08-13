'use client';

import { useRouter } from 'next/navigation';
import { PlayerSearchBar } from '../../components/ui/PlayerSearchBar';

export function PlayerSearchWrapper() {
  const router = useRouter();

  return (
    <PlayerSearchBar 
      onSelect={(id) => {
        router.push(`/player/${id}`);
      }} 
      placeholder="Wpisz nazwę gracza..." 
    />
  );
}
