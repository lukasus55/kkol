import React from 'react';
import { CatanMapClient } from './CatanMapClient';

export const metadata = {
  title: 'Interaktywna mapa Catana - Karwińska Olimpiada',
  description: 'Sprawdź szczegóły pól, wymaganą ilość oczek i procentowe szanse.',
};

export default function CatanMapPage() {
  return (
    <main className="w-full">
      <CatanMapClient />
    </main>
  );
}
