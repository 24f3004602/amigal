'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

export function useMatching(mode: 'text' | 'video', onMatchFound: (data: any) => void) {
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [queuePosition, setQueuePosition] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startMatching = useCallback(
    async (interests: string[]) => {
      setStatus('searching');
      setError(null);

      try {
        const res = await api.post('/match/find', { interests, mode });
        const data = await res.json();

        if (data.status === 'matched') {
          setStatus('found');
          onMatchFound(data);
          return;
        }

        // Polling for match
        intervalRef.current = setInterval(async () => {
          try {
            const meRes = await api.get('/auth/me');
            if (meRes.ok) {
              // Match found via Socket.io instead — this is a fallback
            }
          } catch {}
        }, 2000);
      } catch (err: any) {
        setError(err.message || 'Failed to start matching');
        setStatus('error');
      }
    },
    [mode, onMatchFound]
  );

  const cancelMatching = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    await api.delete('/match/cancel');
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { status, queuePosition, error, startMatching, cancelMatching };
}
