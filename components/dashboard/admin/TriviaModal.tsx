'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import type { Trivia } from '@/types/db';

interface TriviaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trivia: Trivia, isEdit: boolean) => void;
  triviaToEdit?: Trivia | null;
}

export function TriviaModal({ isOpen, onClose, onSuccess, triviaToEdit }: TriviaModalProps) {
  const { addToast } = useToast();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(triviaToEdit);

  useEffect(() => {
    if (isOpen) {
      setContent(triviaToEdit?.content || '');
      setError(null);
    }
  }, [isOpen, triviaToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = content.trim();
    if (trimmed.length < 5) {
      setError('Treść ciekawostki musi zawierać co najmniej 5 znaków.');
      return;
    }

    setLoading(true);
    try {
      if (isEdit && triviaToEdit) {
        const res = await fetch('/api/admin/trivia', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: triviaToEdit.id,
            content: trimmed,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Nie udało się zaktualizować ciekawostki.');
          return;
        }
        addToast({ message: 'Ciekawostka została zaktualizowana.', type: 'success' });
        onSuccess(data.trivia, true);
      } else {
        const res = await fetch('/api/admin/trivia', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: trimmed }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Nie udało się dodać ciekawostki.');
          return;
        }
        addToast({ message: 'Ciekawostka została dodana do bazy.', type: 'success' });
        onSuccess(data.trivia, false);
      }
      onClose();
    } catch {
      setError('Wystąpił błąd podczas zapisywania ciekawostki.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Edycja ciekawostki #${triviaToEdit?.id}` : 'Nowa ciekawostka Discord'}
      maxWidth="max-w-lg"
      height="h-auto"
    >
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 flex flex-col gap-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-danger-500 text-xs p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text-700">
              Treść ciekawostki (min. 5 znaków)
            </label>
            <span className="text-xs text-text-500 font-medium">
              {content.trim().length} znaków
            </span>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Wpisz ciekawostkę dotyczącą ligi, graczy, turniejów lub zasad gry..."
            rows={5}
            className="w-full bg-bg-200 text-text-900 border border-bg-400 rounded-md p-3 text-sm focus:outline-none focus:border-text-900 transition-colors placeholder:text-text-500 resize-y"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-bg-300">
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Anuluj
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            {isEdit ? 'Zapisz zmiany' : 'Dodaj ciekawostkę'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
