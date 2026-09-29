'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateUserModal({ isOpen, onClose, onCreated }: CreateUserModalProps) {
  const [id, setId] = useState('');
  const [displayedName, setDisplayedName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('player');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = [
    { value: 'player', label: 'Gracz' },
    { value: 'organizer', label: 'Organizator' },
  ];

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 16; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = id.trim().toLowerCase();
    if (!/^[a-z0-9_-]{3,32}$/.test(cleanId)) {
      setError('ID (login) może zawierać tylko małe litery, cyfry, myślnik i podkreślnik (3-32 znaki).');
      return;
    }

    if (displayedName.trim().length < 2) {
      setError('Wyświetlana nazwa musi mieć co najmniej 2 znaki.');
      return;
    }

    if (password.length < 14) {
      setError('Hasło musi mieć co najmniej 14 znaków.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cleanId,
          displayed_name: displayedName.trim(),
          password,
          role,
          email: email.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Nie udało się utworzyć użytkownika.');
        return;
      }

      // Reset and close
      setId('');
      setDisplayedName('');
      setPassword('');
      setRole('player');
      setEmail('');
      onCreated();
      onClose();
    } catch {
      setError('Wystąpił błąd połączenia z serwerem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dodaj nowego użytkownika"
      maxWidth="max-w-lg"
      height="h-auto"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-danger-500 text-xs p-3 rounded-md">
            {error}
          </div>
        )}

        <Input
          label="ID użytkownika (login unikalny)"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="np. jan_kowalski"
          required
        />

        <Input
          label="Wyświetlana nazwa"
          value={displayedName}
          onChange={(e) => setDisplayedName(e.target.value)}
          placeholder="np. Jan Kowalski"
          required
        />

        <div className="flex flex-col gap-1.5">
          <Input
            label="Hasło (min. 14 znaków)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Wpisz lub wygeneruj hasło..."
            isPassword
            required
          />
          <Button
            type="button"
            variant="secondary"
            className="text-xs self-start flex items-center gap-1.5 py-1 px-2.5"
            onClick={handleGeneratePassword}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Wygeneruj losowe hasło</span>
          </Button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-normal text-text-700">Rola</label>
          <Select value={role} onChange={setRole} options={roleOptions} />
        </div>

        <Input
          label="Adres e-mail (opcjonalny)"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="np. gracz@kkol.pl"
        />

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-bg-300 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Anuluj
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Utwórz konto
          </Button>
        </div>
      </form>
    </Modal>
  );
}
