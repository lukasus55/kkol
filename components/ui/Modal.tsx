import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  footer?: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-3xl', footer }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => modalRef.current?.focus(), 10);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 outline-none"
    >
      <div
        className={`bg-bg-100 rounded-xl shadow-2xl w-full flex flex-col h-[650px] max-h-[95vh] sm:max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 ${maxWidth}`}
      >
        <div className="p-4 sm:p-5 flex justify-between items-start sm:items-center gap-3 bg-bg-200 flex-shrink-0 border-b border-bg-300">
          <div className="text-lg sm:text-xl font-bold text-text-900 flex-1 min-w-0">{title}</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-text-900 transition-colors p-1.5 rounded-md hover:bg-bg-300 shrink-0 mt-0.5 sm:mt-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-bg-100 flex-1 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="p-5 bg-bg-200 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
