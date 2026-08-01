'use client';

import { useState, useRef } from 'react';
import { Card, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';

export default function ProfilePictureCard({ currentPfpBase64 }: { currentPfpBase64: string | null }) {
  const defaultSrc = '/img/default_pfp.webp';
  const initialSrc = currentPfpBase64 ? (currentPfpBase64.startsWith('data:image') ? currentPfpBase64 : `data:image/jpeg;base64,${currentPfpBase64}`) : defaultSrc;
  
  const [pfpSrc, setPfpSrc] = useState(initialSrc);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert("Plik jest za duży! Maksymalny rozmiar to 5MB.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      setPfpSrc(URL.createObjectURL(selectedFile));
      setFile(selectedFile);
    }
  };

  const handleSave = () => {
    if (!file) return;
    setLoading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;

      try {
        const res = await fetch('/api/upload_pfp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image_base64: base64String })
        });

        if (res.ok) {
          window.location.reload();
        } else {
          const err = await res.json();
          alert(err.error || "Błąd podczas przesyłania zdjęcia.");
        }
      } catch (error) {
        alert("Błąd połączenia z serwerem.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardTitle>Zdjęcie profilowe</CardTitle>
      <div className="flex items-center gap-6">
        <img 
          src={pfpSrc} 
          alt="Avatar" 
          className="w-16 h-16 rounded-full object-cover border border-white/20" 
        />
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept="image/png, image/jpeg, image/webp" 
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            id="pfp_upload"
          />
          <Button 
            variant="tertiary" 
            onClick={() => fileInputRef.current?.click()}
          >
            Wybierz plik
          </Button>
          
          {file && (
            <Button 
              variant="primary" 
              onClick={handleSave} 
              isLoading={loading}
            >
              Zapisz
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
