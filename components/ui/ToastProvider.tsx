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
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [isLeaving, setIsLeaving] = useState(false);
  const duration = toast.duration || 5000;

  const handleRemove = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  }, [removeToast, toast.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleRemove();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, handleRemove]);

  const variants = {
    success: {
      bg: 'bg-bg-300 border-bg-400',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      progress: 'bg-green-500'
    },
    error: {
      bg: 'bg-bg-300 border-bg-400',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      progress: 'bg-red-500'
    },
    warning: {
      bg: 'bg-bg-300 border-bg-400',
      icon: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
      progress: 'bg-yellow-500'
    },
    info: {
      bg: 'bg-bg-300 border-bg-400',
      icon: <Info className="w-5 h-5 text-blue-500" />,
      progress: 'bg-blue-500'
    }
  };

  const current = variants[toast.type];

  return (
    <div className={`relative flex flex-col overflow-hidden border rounded-md shadow-lg pointer-events-auto transition-all duration-300 ease-in-out ${isLeaving ? 'opacity-0 -translate-x-full' : 'animate-toast-in'} ${current.bg}`}>
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 mt-0.5">{current.icon}</div>
        <div className="flex-1 text-sm font-medium text-text-900 break-words">
          {toast.message}
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 text-gray-400 hover:text-text-900 transition-colors"
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
