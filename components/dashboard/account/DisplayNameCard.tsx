'use client';

import { useState } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/ToastProvider';
import { ErrorPopup } from '../../ui/ErrorPopup';

export default function DisplayNameCard({ currentName }: { currentName: string }) {
  const [name, setName] = useState(currentName || '');
  const [loading, setLoading] = useState(false);
  const [errorModal, setErrorModal] = useState('');
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
        // NOTE: In the future, emit an event to refresh the navbar's user object here
      } else {
        const err = await res.json();
        setErrorModal(err.error || "Nie udało się zmienić nazwy.");
      }
    } catch (error) {
      setErrorModal("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ErrorPopup isOpen={!!errorModal} message={errorModal} onClose={() => setErrorModal('')} />
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
    </>
  );
}
