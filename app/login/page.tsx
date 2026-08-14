'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const [answerTitle, setAnswerTitle] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowAnswer(false);
      }
    };
    if (showAnswer) {
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [showAnswer]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const rParam = searchParams?.get('r');
          const destination = rParam ? decodeURIComponent(rParam) : 'dashboard';
          router.push(`/${destination}`);
        }
      } catch (err) {}
    };
    checkAuth();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    setShowAnswer(false);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const rParam = searchParams?.get('r');
        const destination = rParam ? decodeURIComponent(rParam) : 'dashboard';
        router.push(`/${destination}`);
      } else {
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      alert('Błąd komunikacji z serwerem.');
      setLoading(false);
    }
  };

  const handleNoAccount = () => {
    setAnswerTitle('Nie masz konta?');
    setAnswerContent('Konta posiadają jedynie gracze uczestniczący w turniejach KKOL. Organizator powinien przekazać dane do logowania. Nie ma możliwości samodzielnego założenia konta.');
    setShowAnswer(true);
  };

  const handleForgot = () => {
    setAnswerTitle('Zapomniałeś hasła?');
    setAnswerContent('Skontaktuj się z administratorem.');
    setShowAnswer(true);
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-bg-200 flex flex-col relative font-sans">
      <header className="absolute top-0 left-0 p-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <img 
              src="/img/logos/kol-logo-horizontal.svg" 
              alt="Karwińska Olimpiada Logo" 
              className="h-16 w-auto cursor-pointer"
            />
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-[480px] shadow-xl pt-10 !rounded-xl border-bg-400">
          <h1 className="text-2xl font-bold mb-8 text-text-900">Zaloguj się</h1>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

            <div className={`text-danger-500 text-sm font-medium transition-opacity ${!error ? 'opacity-0 h-0' : 'opacity-100 h-auto'}`}>
              Niepoprawna nazwa użytkownika lub hasło
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col gap-1 text-[13px] text-accent-500 font-medium">
                <button type="button" onClick={handleNoAccount} className="text-left hover:text-accent-600 transition-colors">Nie masz konta?</button>
                <button type="button" onClick={handleForgot} className="text-left hover:text-accent-600 transition-colors">Zapomniałeś hasła?</button>
              </div>
              
              <Button 
                type="submit" 
                variant="primary"
                isLoading={loading} 
                className="!px-6 !py-2.5 !rounded-lg"
              >
                Zaloguj się
              </Button>
            </div>
          </form>
        </Card>

        {showAnswer && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAnswer(false);
            }}
          >
            <Card className="max-w-[500px] shadow-2xl p-8 relative !rounded-xl">
              <button 
                onClick={() => setShowAnswer(false)} 
                className="absolute top-4 right-4 text-text-500 hover:text-text-900 transition-colors text-xl font-bold"
              >
                ✕
              </button>
              <h3 className="text-xl font-bold mb-4 text-text-900">{answerTitle}</h3>
              <p className="text-text-700 leading-relaxed">{answerContent}</p>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg-200 flex items-center justify-center text-text-500 font-medium">Ładowanie...</div>}>
      <LoginForm />
    </Suspense>
  );
}
