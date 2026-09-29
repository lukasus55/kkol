'use client';

import { Sparkles } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';

export default function AdminTriviaPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-900 tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-amber-400" />
          Ciekawostki Discord
        </h1>
        <p className="text-sm text-text-700 mt-1">
          Zarządzanie cotygodniowymi ciekawostkami publikowanymi przez bota na Discordzie.
        </p>
      </div>

      <Card>
        <CardTitle>Moduł w przygotowaniu</CardTitle>
        <p className="text-sm text-text-700">
          Tabela bazy danych, endpointy API oraz kafelkowa lista ciekawostek z obsługą dodawania i edycji zostaną wdrożone w Kroku 3 i Kroku 5.
        </p>
      </Card>
    </div>
  );
}
