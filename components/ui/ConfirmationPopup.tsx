'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmationPopupProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmationPopup({ 
  isOpen, 
  title = "Potwierdzenie", 
  message, 
  confirmText = "Zatwierdź", 
  cancelText = "Anuluj", 
  onConfirm, 
  onClose 
}: ConfirmationPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-dashboard-bg border border-dashboard-stroke rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 p-6">
          <div className="flex-shrink-0 p-3 bg-yellow-500/10 rounded-full">
            <AlertTriangle className="w-8 h-8 text-yellow-500" />
          </div>
          <div className="flex-1 mt-1">
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-dashboard-text-s2 text-sm leading-relaxed" dangerouslySetInnerHTML={{__html: message}}></p>
          </div>
        </div>
        <div className="bg-dashboard-bg-s2 p-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>{cancelText}</Button>
          <Button variant="primary" onClick={() => { onConfirm(); onClose(); }}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}
