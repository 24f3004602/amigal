'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

export function useMatching(mode: 'text' | 'video', onMatchFound: (data: any) => void) {
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        }
        // If 'waiting', Socket.io will emit 'match-found' later
      } catch (err: any) {
        setError(err.message || 'Failed to start matching');
        setStatus('error');
      }
    },
    [mode, onMatchFound]
  );

  const cancelMatching = useCallback(async () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    await api.delete('/match/cancel');
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { status, error, startMatching, cancelMatching };
}
