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
        className={`bg-dashboard-bg border border-dashboard-stroke rounded-xl shadow-2xl w-full flex flex-col h-[650px] max-h-[95vh] sm:max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200 ${maxWidth}`}
      >
        <div className="p-5 border-b border-dashboard-stroke flex justify-between items-center bg-dashboard-bg-s2 flex-shrink-0">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto bg-dashboard-bg flex-1 custom-scrollbar">
          {children}
        </div>

        {footer && (
          <div className="p-5 border-t border-dashboard-stroke bg-dashboard-bg-s2 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
