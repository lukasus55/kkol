'use client';

import { useState, useEffect } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { validatePassword } from '../../../lib/validatePassword';

export default function PasswordCard({ username }: { username: string }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [valInfo, setValInfo] = useState<any>(null);

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
      alert("Hasło nie spełnia wszystkich wymagań!");
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
        alert("Pomyślnie zmieniono hasło.");
        setOldPassword('');
        setNewPassword('');
      } else {
        const err = await res.json();
        alert(err.error || "Wystąpił nieznany błąd podczas zmiany hasła.");
      }
    } catch (error) {
      alert("Błąd połączenia z serwerem.");
    } finally {
      setLoading(false);
    }
  };

  const score = valInfo ? valInfo.score : 0;
  const req = valInfo?.requirements || { correctLenght: false, notNumbersOnly: false, notOnList: false };
  const allReqsMet = req.correctLenght && req.notNumbersOnly && req.notOnList;

  // Bar color based on score or if requirements met
  const barWidth = valInfo ? Math.max(15, (score / 4) * 100) : 0;
  const barColor = allReqsMet && score > 2 ? 'bg-dashboard-primary' : (allReqsMet ? 'bg-yellow-500' : 'bg-[#a01010]');

  return (
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

        <div className="flex flex-col gap-2 mt-2 border-t border-dashboard-stroke pt-4 relative">
          <div className={`absolute top-0 left-0 h-0.5 transition-all duration-300 ${barColor}`} style={{ width: `${barWidth}%` }}></div>
          
          <div className="flex items-center gap-2 text-xs text-white">
            <span className={req.correctLenght ? "text-dashboard-primary font-bold" : "text-dashboard-danger font-bold"}>
              {req.correctLenght ? '✔' : '✖'}
            </span>
            Od 14 do 128 znaków włącznie.
          </div>
          <div className="flex items-center gap-2 text-xs text-white">
            <span className={req.notNumbersOnly ? "text-dashboard-primary font-bold" : "text-dashboard-danger font-bold"}>
              {req.notNumbersOnly ? '✔' : '✖'}
            </span>
            Nie składa się wyłącznie z cyfr.
          </div>
          <div className="flex items-center gap-2 text-xs text-white">
            <span className={req.notOnList ? "text-dashboard-primary font-bold" : "text-dashboard-danger font-bold"}>
              {req.notOnList ? '✔' : '✖'}
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
  );
}
