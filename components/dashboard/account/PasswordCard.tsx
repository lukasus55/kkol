'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { validatePassword } from '../../../lib/validatePassword';
import { Check, X } from 'lucide-react';
import { useToast } from '../../ui/ToastProvider';
import { ErrorPopup } from '../../ui/ErrorPopup';

export default function PasswordCard({ username }: { username: string }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [valInfo, setValInfo] = useState<any>(null);
  const [errorModal, setErrorModal] = useState('');
  const { addToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    if (!newPassword) {
      setValInfo(null);
      return;
    }

    // Check local requirements immediately (for typing responsiveness)
    const checkPass = async () => {
      const info = await validatePassword(newPassword);
      if (isMounted) setValInfo(info);
    };
    checkPass();

    return () => { isMounted = false; };
  }, [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (valInfo && valInfo.score === 0) {
      addToast({ type: 'error', message: 'Hasło nie spełnia wszystkich wymagań!' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword,
        })
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Pomyślnie zmieniono hasło.' });
        setOldPassword('');
        setNewPassword('');
      } else {
        const err = await res.json();
        setErrorModal(err.error || "Wystąpił nieznany błąd podczas zmiany hasła.");
      }
    } catch (error) {
      setErrorModal("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  const score = valInfo ? valInfo.score : 0;
  const req = valInfo?.requirements || { correctLenght: false, notNumbersOnly: false, notOnList: false };
  const allReqsMet = req.correctLenght && req.notNumbersOnly && req.notOnList;

  // Bar color based on score or if requirements met
  const barWidth = valInfo ? Math.max(15, (score / 4) * 100) : 0;
  const barColor = allReqsMet && score > 2 ? 'bg-accent-500' : (allReqsMet ? 'bg-yellow-500' : 'bg-[#a01010]');

  return (
    <>
      <ErrorPopup isOpen={!!errorModal} message={errorModal} onClose={() => setErrorModal('')} />
      <Card>
        <CardTitle>Zmień hasło</CardTitle>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative">
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={username || ''}
            className="absolute opacity-0 -left-[9999px]"
            aria-hidden="true"
            readOnly
            tabIndex={-1}
          />

          <div className="flex flex-col gap-4">
            <Input
              label="Obecne hasło"
              isPassword
              name="current_password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />

            <Input
              label="Nowe hasło"
              isPassword
              name="new_password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2 mt-2 border-t border-bg-400 pt-4 relative">
            <div className={`absolute top-0 left-0 h-0.5 transition-all duration-300 ${barColor}`} style={{ width: `${barWidth}%` }}></div>

            <div className="flex items-center gap-2 text-xs text-text-900">
              <span className={req.correctLenght ? "text-accent-500" : "text-danger-500"}>
                {req.correctLenght ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
              </span>
              Od 14 do 128 znaków włącznie.
            </div>
            <div className="flex items-center gap-2 text-xs text-text-900">
              <span className={req.notNumbersOnly ? "text-accent-500" : "text-danger-500"}>
                {req.notNumbersOnly ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
              </span>
              Nie składa się wyłącznie z cyfr.
            </div>
            <div className="flex items-center gap-2 text-xs text-text-900">
              <span className={req.notOnList ? "text-accent-500" : "text-danger-500"}>
                {req.notOnList ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3.5 h-3.5 stroke-[3]" />}
              </span>
              Nie jest na liście słabych i wykradzionych haseł.
            </div>
          </div>

          <div className="flex justify-end mt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
            >
              Zmień hasło
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
