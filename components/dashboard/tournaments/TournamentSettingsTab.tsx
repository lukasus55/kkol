'use client';

import React from 'react';
import { Input } from '../../ui/Input';
import { Button } from '../../ui/Button';
import { Tooltip } from '../../ui/Tooltip';

interface SettingsProps {
  info: any;
  setInfo: (info: any) => void;
  tier: string;
  onTierChange: (newTier: string) => void;
  isOwner: boolean;
  globalRole: string;
  onDelete: () => void;
}

export function TournamentSettingsTab({ info, setInfo, tier, onTierChange, isOwner, globalRole, onDelete }: SettingsProps) {

  return (
    <div className="flex flex-col gap-6 max-w-xl mx-auto w-full pb-8">

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text-700">Wyświetlana nazwa</label>
        <Input
          value={info.displayed_name || ''}
          onChange={(e) => setInfo({ ...info, displayed_name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-700">Data (Tekst)</label>
          <Input
            value={info.displayed_date || ''}
            onChange={(e) => setInfo({ ...info, displayed_date: e.target.value })}
            placeholder="np. Maj 2026"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-text-700">Data zakończenia</label>
          <Input
            type="datetime-local"
            value={info.end_date ? info.end_date.slice(0, 16) : ''}
            onChange={(e) => setInfo({ ...info, end_date: e.target.value })}
          />
        </div>
      </div>

      {isOwner && (
        <div className="flex flex-col gap-1.5 mt-4 pt-4 border-t border-bg-400">
          <label className="text-sm font-semibold text-text-700">Tier Turnieju</label>
          <div className="flex gap-2">
            {['S', 'A', 'B', 'C'].map((t) => {
              const isDisabled = t === 'S' && globalRole !== 'admin';

              const btn = (
                <button
                  key={t}
                  disabled={isDisabled}
                  onClick={() => onTierChange(t)}
                  className={`w-10 h-10 rounded-md font-bold transition-colors border ${tier === t
                    ? 'bg-accent-500 border-accent-500 text-black'
                    : 'bg-bg-100 border-bg-400 text-text-900 hover:bg-bg-200'
                    } ${isDisabled ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                >
                  {t}
                </button>
              );

              return isDisabled ? (
                <Tooltip key={t} content="Tylko administrator może ustawić ten tier" position="top">
                  {btn}
                </Tooltip>
              ) : btn;
            })}
          </div>
        </div>
      )}

      {isOwner && (
        <div className="mt-8 p-4 border border-red-900/50 bg-red-950/20 rounded-md">
          <h4 className="text-red-500 font-bold mb-2">Strefa Niebezpieczna</h4>
          <p className="text-sm text-text-700 mb-4">Usunięcie turnieju jest nieodwracalne. Usunie wszystkie wyniki i przypisania graczy.</p>
          <Button variant="primary" className="!bg-red-500 hover:!bg-red-600 !text-white w-full" onClick={onDelete}>
            Usuń ten turniej
          </Button>
        </div>
      )}

    </div>
  );
}
