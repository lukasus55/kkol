'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card } from '../../components/ui/Card';
import { SsoAppBanner } from '../../components/auth/SsoAppBanner';
import { LoginForm } from '../../components/auth/LoginForm';
import { ActiveAccountPrompt } from '../../components/auth/ActiveAccountPrompt';
import { AuthHelpModal, type HelpType } from '../../components/auth/AuthHelpModal';

interface AuthenticatedUser {
  id: string;
  displayed_name?: string;
  role?: string | null;
}

function LoginView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUri = searchParams?.get('redirect_uri') || searchParams?.get('redirect_url') || null;
  const appId = searchParams?.get('app_id') || searchParams?.get('appId') || null;
  const rParam = searchParams?.get('r');
  const destination = rParam ? decodeURIComponent(rParam) : 'dashboard';

  const [activeUser, setActiveUser] = useState<AuthenticatedUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [helpType, setHelpType] = useState<HelpType>(null);

  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setActiveUser(data.user);
            // If user is already authenticated and this is NOT an SSO external redirect, go to dashboard
            if (!redirectUri) {
              router.push(`/${destination.replace(/^\//, '')}`);
              return;
            }
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setCheckingAuth(false);
      }
    }

    checkCurrentSession();
  }, [redirectUri, destination, router]);

  const handleSwitchAccount = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.dispatchEvent(new Event('auth-changed'));
    } catch {
      // Ignore
    }
    setActiveUser(null);
  };

  return (
    <div className="min-h-screen bg-bg-100 flex flex-col items-center justify-center p-4">
      <Card className="max-w-[440px] p-8">
        <div className="flex flex-col items-center mb-6">
          <Link href="/" className="transition-opacity hover:opacity-85 mb-3 inline-block">
            <img
              src="/img/logos/kol-logo-horizontal.svg"
              alt="Karwińska Olimpiada"
              className="h-8 sm:h-9 w-auto"
            />
          </Link>
          {!redirectUri && !appId && (
            <span className="text-xs text-text-500 font-medium">
              Portal zawodnika
            </span>
          )}
        </div>

        {checkingAuth ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-text-500">Sprawdzanie stanu sesji...</span>
          </div>
        ) : activeUser && redirectUri ? (
          <div>
            <SsoAppBanner appId={appId} redirectUri={redirectUri} />
            <ActiveAccountPrompt
              user={activeUser}
              appId={appId}
              redirectUri={redirectUri}
              destination={destination}
              onSwitchAccount={handleSwitchAccount}
            />
          </div>
        ) : (
          <div>
            {(redirectUri || appId) && (
              <SsoAppBanner appId={appId} redirectUri={redirectUri} />
            )}
            <LoginForm
              appId={appId}
              redirectUri={redirectUri}
              destination={destination}
              onOpenHelp={setHelpType}
            />
          </div>
        )}
      </Card>

      <div className="mt-6 text-center text-xs text-text-500">
        <span>2026 Karwińska Olimpiada&trade;</span>
      </div>

      <AuthHelpModal type={helpType} onClose={() => setHelpType(null)} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-bg-100 flex items-center justify-center text-text-500 text-sm">
          Ładowanie...
        </div>
      }
    >
      <LoginView />
    </Suspense>
  );
}
