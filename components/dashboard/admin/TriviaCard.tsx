'use client';

import React, { useState } from 'react';
import { CheckCircle2, Clock, Copy, Check, Pencil, Trash2, RotateCcw, Send } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import type { Trivia } from '@/types/db';

interface TriviaCardProps {
  trivia: Trivia;
  onEdit: (trivia: Trivia) => void;
  onDelete: (trivia: Trivia) => void;
  onToggleUsed: (trivia: Trivia) => void;
}

export function TriviaCard({ trivia, onEdit, onDelete, onToggleUsed }: TriviaCardProps) {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(trivia.content);
      setCopied(true);
      addToast({ message: 'Treść ciekawostki skopiowana do schowka', type: 'info' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast({ message: 'Nie udało się skopiować do schowka', type: 'error' });
    }
  };

  const formatDate = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';

  const formatDateTime = (d?: string | Date | null) =>
    d ? new Date(d).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  return (
    <div className="bg-bg-200 rounded-md p-4 sm:p-5 flex flex-col justify-between gap-4 border border-bg-300 hover:border-bg-400 transition-colors">
      <div className="flex flex-col gap-3">
        {/* Header: Status badge & ID / Copy */}
        <div className="flex items-center justify-between gap-2">
          {trivia.is_used ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-bg-400 bg-bg-300 text-emerald-400 shrink-0"
              title={trivia.used_at ? `Opublikowano: ${formatDateTime(trivia.used_at)}` : 'Opublikowana'}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Opublikowana</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border border-bg-400 bg-bg-300 text-amber-400 shrink-0"
              title="Oczekuje na wysłanie na Discordzie"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>W kolejce</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-500 font-semibold">#{trivia.id}</span>
            <Button
              variant="secondary"
              className="py-1 px-2 text-xs flex items-center gap-1 border-bg-400"
              onClick={handleCopy}
              title="Skopiuj treść do schowka"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline text-emerald-400">Skopiowano</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kopiuj</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Content */}
        <p className="text-text-900 text-sm sm:text-base leading-relaxed whitespace-pre-wrap select-text">
          {trivia.content}
        </p>

        {trivia.is_used && trivia.used_at && (
          <div className="text-xs text-text-500 italic">
            Opublikowano na Discordzie: {formatDateTime(trivia.used_at)}
          </div>
        )}
      </div>

      {/* Footer: Date & Cohesive Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-bg-300">
        <span className="text-xs text-text-500">
          Dodano: {formatDate(trivia.created_at)}
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            onClick={() => onToggleUsed(trivia)}
            title={trivia.is_used ? 'Cofnij status do oczekujących' : 'Oznacz ciekawostkę jako wysłaną na Discordzie'}
          >
            {trivia.is_used ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                <span>Cofnij do kolejki</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Oznacz wysłaną</span>
              </>
            )}
          </Button>

          <Button
            variant="secondary"
            className="text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            onClick={() => onEdit(trivia)}
            title="Edytuj treść ciekawostki"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Edytuj</span>
          </Button>

          <Button
            variant="danger"
            className="text-xs py-1.5 px-2.5 flex items-center gap-1.5"
            onClick={() => onDelete(trivia)}
            title="Usuń tę ciekawostkę"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Usuń</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
