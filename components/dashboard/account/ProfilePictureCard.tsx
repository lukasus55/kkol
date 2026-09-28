'use client';

import { useState } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/ToastProvider';

export default function ProfilePictureCard({ currentPfpBase64 }: { currentPfpBase64: string | null }) {
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

    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    try {
      const res = await fetch('/api/upload_pfp', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        addToast({ type: 'success', message: 'Pomyślnie zmieniono zdjęcie profilowe!' });
        setSelectedFile(null);
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
