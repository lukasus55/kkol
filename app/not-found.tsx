import React from 'react';
import Link from 'next/link';
import { Home } from 'lucide-react';

export const metadata = {
  title: 'Nie znaleziono strony (404) - Karwińska Olimpiada',
  description: 'Przepraszamy, ale strona, której szukasz, nie istnieje.',
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4 font-sans text-center">
      <div className="w-full max-w-lg bg-bg-100 rounded-md p-10 shadow-sm flex flex-col items-center">
        
        <div className="text-8xl font-black text-accent-500 mb-6 drop-shadow-md">
          404
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-wide text-text-900 mb-4">
          Zgubiliśmy się...
        </h1>
        
        <p className="text-text-600 mb-8 max-w-md">
          Wygląda na to, że strona, której szukasz, została usunięta, zmieniła swój adres lub nigdy nie istniała. 
        </p>
        
        <Link 
          href="/"
          className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-bold py-3 px-6 rounded-md transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <Home className="w-5 h-5" />
          Wróć na stronę główną
        </Link>
        
      </div>
    </div>
  );
}
