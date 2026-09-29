'use client';

import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { UserItem } from './UserCard';

interface ResetPasswordModalProps {
  user: UserItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ResetPasswordModal({ user, isOpen, onClose, onSuccess }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleGeneratePassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
    let generated = '';
    for (let i = 0; i < 16; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(generated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 14) {
      setError('Hasło musi mieć co najmniej 14 znaków.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          new_password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Nie udało się zresetować hasła.');
        return;
      }

      setNewPassword('');
      onSuccess();
      onClose();
    } catch {
      setError('Błąd połączenia z serwerem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reset hasła użytkownika"
      maxWidth="max-w-md"
      height="h-auto"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-danger-500 text-xs p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="text-sm text-text-700">
          Ustawiasz nowe hasło dla gracza{' '}
          <strong className="text-text-900">{user.displayed_name}</strong> (@{user.id}).
          Wszystkie aktywne sesje tego konta zostaną natychmiast unieważnione.
        </div>

        <div className="flex flex-col gap-1.5">
          <Input
            label="Nowe hasło (min. 14 znaków)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
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

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-bg-300 mt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Anuluj
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Zapisz nowe hasło
          </Button>
        </div>
      </form>
    </Modal>
  );
}
