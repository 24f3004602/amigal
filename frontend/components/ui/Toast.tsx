// components/ui/Toast.tsx
'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-success/30 bg-success/10 text-success',
  error: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning: 'border-warning/30 bg-warning/10 text-warning',
  info: 'border-info/30 bg-info/10 text-info',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const toast = React.useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    setTimeout(() => remove(id), duration);
  }, []);

  const success = React.useCallback((m: string, d?: number) => toast(m, 'success', d), [toast]);
  const error = React.useCallback((m: string, d?: number) => toast(m, 'error', d), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3" role="region" aria-live="polite" aria-label="Notifications">
            <AnimatePresence>
              {toasts.map((t) => {
                const Icon = icons[t.type];
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    className={cn(
                      'flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-md',
                      styles[t.type],
                      'bg-background/80'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <p className="text-sm font-medium">{t.message}</p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(t.id)}
                      aria-label="Dismiss notification"
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
