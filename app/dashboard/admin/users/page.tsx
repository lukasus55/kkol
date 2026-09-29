'use client';

import { Users } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';

export default function AdminUsersPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold text-text-900 tracking-tight flex items-center gap-2.5">
          <Users className="w-6 h-6 text-amber-400" />
          Zarządzanie Użytkownikami
        </h1>
        <p className="text-sm text-text-700 mt-1">
          Przegląd kont ligowych, edycja ról i tworzenie nowych graczy.
        </p>
      </div>

      <Card>
        <CardTitle>Moduł w przygotowaniu</CardTitle>
        <p className="text-sm text-text-700">
          Pełna lista użytkowników, wyszukiwarka, zarządzanie rolami i formularz tworzenia kont zostaną wdrożone w Kroku 4.
        </p>
      </Card>
    </div>
  );
}
