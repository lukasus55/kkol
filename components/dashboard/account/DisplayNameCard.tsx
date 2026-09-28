'use client';

import { useState } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/ToastProvider';

export default function DisplayNameCard({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSave = async () => {
    const newName = name.trim();
    if (!newName) {
      addToast({ type: 'warning', message: 'Nazwa nie może być pusta.' });
      return;
    }
    if (newName === currentName) {
      addToast({ type: 'info', message: 'To jest już twoja aktualna nazwa.' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/change_name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newName })
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Pomyślnie zmieniono nazwę!' });
      } else {
        const err = await res.json();
        addToast({ type: 'error', message: err.error || "Nie udało się zmienić nazwy." });
      }
    } catch (error) {
      addToast({ type: 'error', message: "Błąd połączenia z serwerem." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardTitle>Wyświetlana nazwa</CardTitle>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Wpisz nową nazwę..."
          />
        </div>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading || name.trim() === currentName}
        >
          {loading ? 'Zapisywanie...' : 'Zapisz'}
        </Button>
      </div>
    </Card>
  );
}
