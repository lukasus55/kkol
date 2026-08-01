'use client';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const duration = toast.duration || 5000;

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onRemove]);

  const variants = {
    success: {
      bg: 'bg-dashboard-bg-s3 border-dashboard-stroke',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      progress: 'bg-green-500'
    },
    error: {
      bg: 'bg-dashboard-bg-s3 border-dashboard-stroke',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      progress: 'bg-red-500'
    },
    warning: {
      bg: 'bg-dashboard-bg-s3 border-dashboard-stroke',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      progress: 'bg-yellow-500'
    },
    info: {
      bg: 'bg-dashboard-bg-s3 border-dashboard-stroke',
      icon: <Info className="w-5 h-5 text-blue-500" />,
      progress: 'bg-blue-500'
    }
  };

  const current = variants[toast.type];

  return (
    <div className={`relative flex flex-col overflow-hidden border rounded-md shadow-lg pointer-events-auto animate-in slide-in-from-bottom-5 fade-in duration-300 ${current.bg}`}>
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{current.icon}</div>
        <div className="flex-1 text-sm font-medium text-white break-words">
          {toast.message}
        </div>
        <button 
          onClick={onRemove}
          className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="w-full h-1 bg-black/40">
        <div 
          className={`h-full ${current.progress}`} 
          style={{ 
            animation: `toast-progress ${duration}ms linear forwards` 
          }} 
        />
      </div>
    </div>
  );
}
