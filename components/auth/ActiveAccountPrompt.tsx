'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '../ui/Button';

interface ActiveUser {
  id: string;
  displayed_name?: string;
  role?: string | null;
}

interface ActiveAccountPromptProps {
  user: ActiveUser;
  appId?: string | null;
  redirectUri?: string | null;
  destination?: string;
  onSwitchAccount: () => void;
}

export function ActiveAccountPrompt({
  user,
  appId,
  redirectUri,
  destination = 'dashboard',
  onSwitchAccount,
}: ActiveAccountPromptProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleContinue = async () => {
    setLoading(true);
    setErrorMsg(null);

    // If there is an external redirect URL, authorize and exchange token
    if (redirectUri) {
      try {
        const res = await fetch('/api/auth/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appId: appId || 'kkol_main' }),
        });

        if (res.ok) {
          const data = await res.json();
          const targetUrl = new URL(redirectUri);
          targetUrl.searchParams.set('token', data.token);
          window.location.href = targetUrl.toString();
          return;
        } else {
          setErrorMsg('Błąd autoryzacji sesji. Zaloguj się ponownie.');
          setLoading(false);
        }
      } catch {
        setErrorMsg('Błąd połączenia z serwerem autoryzacji.');
        setLoading(false);
      }
      return;
    }

    // Otherwise, redirect to dashboard or requested internal destination
    router.push(`/${destination}`);
  };

  const displayName = user.displayed_name || user.id;

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-bg-300 rounded-md p-4 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-full bg-bg-400 text-text-900 flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-xs text-text-500 block">Jesteś zalogowany jako:</span>
          <p className="text-text-900 font-semibold truncate text-sm">
            {displayName}
          </p>
          <span className="text-xs text-text-500 block truncate">@{user.id}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="text-danger-500 text-xs font-medium">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-2.5 pt-2">
        <Button
          variant="primary"
          onClick={handleContinue}
          isLoading={loading}
          className="w-full justify-between px-4 py-2.5"
        >
          <span>Kontynuuj jako {displayName}</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <Button
          variant="secondary"
          onClick={onSwitchAccount}
          disabled={loading}
          className="w-full justify-center px-4 py-2"
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          <span>Zaloguj się na inne konto</span>
        </Button>
      </div>
    </div>
  );
}
