'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Footer from '../../components/Footer';

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  
  const [answerTitle, setAnswerTitle] = useState('');
  const [answerContent, setAnswerContent] = useState<React.ReactNode>(null);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/me');
        if (res.ok) {
          const rParam = searchParams.get('r');
          const destination = rParam ? decodeURIComponent(rParam) : 'dashboard';
          router.push(`/${destination}`);
        }
      } catch (err) {
        console.error(err);
      }
    };
    checkAuth();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const rParam = searchParams.get('r');
        const destination = rParam ? decodeURIComponent(rParam) : 'dashboard';
        router.push(`/${destination}`);
      } else {
        setError(true);
        setLoading(false);
      }
    } catch (err) {
      console.error('Network error:', err);
      alert('Something went wrong communicating with the server.');
      setLoading(false);
    }
  };

  const handleNoAccount = () => {
    setAnswerTitle('Nie masz konta?');
    setAnswerContent(
      'Konta posiadają jedynie gracze uczestniczący w turniejach KKOL. Organizator powinien przekazać dane do logowania. Nie ma możliwości samodzielnego założenia konta.'
    );
    setShowAnswer(true);
  };

  const handleForgot = () => {
    setAnswerTitle('Zapomniałeś hasła?');
    setAnswerContent(
      <>
        Skontaktuj się z administratorem.{' '}
        <Link href="/contact" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
          Lista kontaktów.
        </Link>
      </>
    );
    setShowAnswer(true);
  };

  return (
    <>
      <header className="login_header">
        <div className="title_section">
          <img
            src="/img/logos/olympic-logo-transparent.svg"
            style={{ width: '4rem', height: '4rem' }}
            alt="Logo"
          />
          <div className="title_text">
            <div className="title_line">Karwińska</div>
            <div className="title_line">Olimpiada</div>
          </div>
        </div>
      </header>

      <main className="login_main">
        <div className="login_container">
          <div className="login_card" style={{ position: 'relative' }}>
            {loading && (
              <div className="loader-global loader-global_transparent">
                <div className="loader"></div>
              </div>
            )}
            
            <h1>Zaloguj się</h1>
            <form onSubmit={handleSubmit} className="login_form">
              <div className="input_group">
                <label htmlFor="username">Nazwa użytkownika</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  placeholder="Wprowadź nazwę użytkownika"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="input_group">
                <label htmlFor="password">Hasło</label>
                <input
                  type="password"
                  id="password"
                  name="current_password"
                  placeholder="Wprowadź swoje hasło"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {!error && <div className="login_failed hiddenInstant">Niepoprawna nazwa użytkownika lub hasło</div>}
              {error && <div className="login_failed">Niepoprawna nazwa użytkownika lub hasło</div>}

              <div className="card_footer">
                <div className="disclaimer">
                  <button type="button" className="btn_question" onClick={handleNoAccount}>
                    Nie masz konta?
                  </button>
                  <button type="button" className="btn_question" onClick={handleForgot}>
                    Zapomniałeś hasła?
                  </button>
                </div>
                <button type="submit" className="btn_primary" disabled={loading}>
                  Zaloguj się
                </button>
              </div>
            </form>
          </div>

          {showAnswer && (
            <div className="login_card answer_card">
              <div className="answer_title">{answerTitle}</div>
              <span className="answer_content">{answerContent}</span>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <Footer />
      </footer>
    </>
  );
}
