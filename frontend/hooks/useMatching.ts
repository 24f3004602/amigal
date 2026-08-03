'use client';
import { useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { api } from '@/lib/api';
import type { MatchResult, FindMatchDto } from '@amigal/shared-types';

export function useMatchmaking() {
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const socket = useSocket();

  const startMatching = useCallback(
    async (dto: FindMatchDto): Promise<MatchResult | null> => {
      setStatus('searching');
      setError(null);

      try {
        const res = await api.post('/v1/match/find', dto);
        const data = await res.json();

        if (!data.success) {
          throw new Error(data.error?.message || 'Matching failed');
        }

        if (data.data?.status === 'matched') {
          setStatus('found');
          return data.data;
        }

        // If waiting, listen for socket event
        return new Promise((resolve) => {
          const handler = (matchData: any) => {
            setStatus('found');
            socket?.off('match-found', handler);
            resolve(matchData);
          };
          socket?.once('match-found', handler);
        });
      } catch (err: any) {
        setError(err.message || 'Failed to start matching');
        setStatus('error');
        return null;
      }
    },
    [socket]
  );

  const cancelMatching = useCallback(async () => {
    await api.delete('/v1/match/cancel');
    setStatus('idle');
  }, []);

  return { status, error, startMatching, cancelMatching };
}
