'use client';

import { useState } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';

export default function DisplayNameCard({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const newName = name.trim();
    if (!newName) return alert("Nazwa nie może być pusta.");
    if (newName === currentName) return alert("To jest już twoja aktualna nazwa.");

    setLoading(true);
    try {
      const res = await fetch('/api/change_name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_name: newName })
      });

      if (res.ok) window.location.reload();
      else {
        const err = await res.json();
        alert(err.error || "Nie udało się zmienić nazwy.");
      }
    } catch (error) {
      alert("Błąd połączenia z serwerem.");
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
          isLoading={loading}
        >
          Zmień
        </Button>
      </div>
    </Card>
  );
}
