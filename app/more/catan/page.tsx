import React from 'react';
import { CatanMapClient } from './CatanMapClient';

export const metadata = {
  title: 'Olimpiada Karwińska - Mapa catana',
  description: 'Mapa do gry catan.',
};

export default function CatanMapPage() {
  return (
    <main className="w-full">
      <CatanMapClient />
    </main>
  );
}
