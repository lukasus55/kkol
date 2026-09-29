'use client';

import { useState } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/ToastProvider';
import { useUser } from '../UserProvider';

export default function ProfilePictureCard({ currentPfpBase64 }: { currentPfpBase64: string | null }) {
  const { fetchUser } = useUser();
  const defaultSrc = '/img/default_pfp.webp';
  const initialSrc = currentPfpBase64 ? (currentPfpBase64.startsWith('data:image') ? currentPfpBase64 : `data:image/jpeg;base64,${currentPfpBase64}`) : defaultSrc;

  const [pfpSrc, setPfpSrc] = useState(initialSrc);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast({ type: 'error', message: 'Plik jest za duży. Maksymalny rozmiar to 2 MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPfpSrc(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    setSelectedFile(file);
  };

  const handleSave = async () => {
    if (!selectedFile) return;
    setLoading(true);

    try {
      let base64 = pfpSrc;
      if (!base64 || !base64.startsWith('data:image')) {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const res = await fetch('/api/upload_pfp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: base64,
        }),
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Pomyślnie zmieniono zdjęcie profilowe!' });
        setSelectedFile(null);
        await fetchUser?.();
      } else {
        const err = await res.json();
        addToast({ type: 'error', message: err.error || "Wystąpił błąd podczas przesyłania zdjęcia." });
      }
    } catch (error) {
      addToast({ type: 'error', message: "Błąd połączenia z serwerem." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardTitle>Zdjęcie profilowe</CardTitle>
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-bg-100 flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pfpSrc}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex items-center gap-4">
          <input
            type="file"
            id="pfp-upload"
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => document.getElementById('pfp-upload')?.click()}
          >
            Wybierz plik
          </Button>

          {selectedFile && (
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              isLoading={loading}
            >
              Zapisz nowe zdjęcie
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
