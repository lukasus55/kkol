'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import type { HelpType } from './AuthHelpModal';

interface LoginFormProps {
  appId?: string | null;
  redirectUri?: string | null;
  destination?: string;
  onOpenHelp: (type: HelpType) => void;
}

export function LoginForm({
  appId,
  redirectUri,
  destination = 'dashboard',
  onOpenHelp,
}: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          appId: appId || 'kkol_main',
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        window.dispatchEvent(new Event('auth-changed'));

        if (redirectUri) {
          try {
            const targetUrl = new URL(redirectUri);
            if (data.token) {
              targetUrl.searchParams.set('token', data.token);
            }
            window.location.href = targetUrl.toString();
            return;
          } catch {
            // If redirectUri is not an absolute valid URL, fall back to router push
          }
        }

        router.push(`/${destination.replace(/^\//, '')}`);
        router.refresh();
      } else {
        if (response.status === 403) {
          setErrorMessage('To konto zostało zablokowane.');
        } else if (response.status === 401) {
          setErrorMessage('Niepoprawna nazwa użytkownika lub hasło.');
        } else {
          setErrorMessage(data?.error || 'Błąd logowania. Spróbuj ponownie.');
        }
        setLoading(false);
      }
    } catch {
      setErrorMessage('Błąd połączenia z serwerem logowania.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Input
        label="Nazwa użytkownika"
        id="username"
        name="username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        autoComplete="username"
      />

      <Input
        label="Hasło"
        id="password"
        name="current_password"
        type="password"
        isPassword={true}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      {errorMessage && (
        <div className="text-danger-500 text-xs font-medium">
          {errorMessage}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <div className="flex flex-col gap-1 text-xs text-accent-500">
          <button
            type="button"
            onClick={() => onOpenHelp('no-account')}
            className="text-left hover:underline focus:outline-none"
          >
            Nie masz konta?
          </button>
          <button
            type="button"
            onClick={() => onOpenHelp('forgot-password')}
            className="text-left hover:underline focus:outline-none"
          >
            Zapomniałeś hasła?
          </button>
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="px-6 py-2"
        >
          Zaloguj się
        </Button>
      </div>
    </form>
  );
}
