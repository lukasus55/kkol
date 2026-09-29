'use client';

import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export type HelpType = 'no-account' | 'forgot-password' | null;

interface AuthHelpModalProps {
  type: HelpType;
  onClose: () => void;
}

export function AuthHelpModal({ type, onClose }: AuthHelpModalProps) {
  const isOpen = type !== null;

  const content = {
    'no-account': {
      title: 'Nie masz konta?',
      description:
        'Konta są tworzone i przypisywane wyłącznie zawodnikom biorącym udział w zmaganiach Karwińskiej Olimpiady. ' +
        'Organizator turnieju przekazuje indywidualne dane dostępowe przed startem sezonu. Rejestracja publiczna nie jest dostępna.',
    },
    'forgot-password': {
      title: 'Zapomniałeś hasła?',
      description:
        'Aby zresetować hasło lub odzyskać dostęp do konta, skontaktuj się bezpośrednio z administratorem systemu lub organizatorem turnieju.',
    },
  };

  const current = type ? content[type] : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={current?.title || ''}
      maxWidth="max-w-md"
      height="h-auto"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Rozumiem
          </Button>
        </div>
      }
    >
      <p className="text-text-700 text-sm leading-relaxed">
        {current?.description}
      </p>
    </Modal>
  );
}
