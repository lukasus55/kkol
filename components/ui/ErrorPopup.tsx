'use client';

import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button } from './Button';

interface ErrorPopupProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function ErrorPopup({ isOpen, message, onClose }: ErrorPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-bg-100 border border-bg-400 rounded-xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-start gap-4 p-6">
          <div className="flex-shrink-0 p-3 bg-red-500/10 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div className="flex-1 mt-1">
            <h3 className="text-lg font-bold text-text-900 mb-2">Błąd</h3>
            <p className="text-text-700 text-sm leading-relaxed">
              {message}
            </p>
          </div>
        </div>
        <div className="bg-bg-200 p-4 flex justify-end">
          <Button variant="primary" onClick={onClose} className="!bg-red-500 hover:!bg-red-600 !text-white">
            Rozumiem
          </Button>
        </div>
      </div>
    </div>
  );
}
