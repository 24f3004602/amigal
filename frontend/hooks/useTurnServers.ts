'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

const FALLBACK_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useTurnServers() {
  const [iceServers, setIceServers] = useState<RTCIceServer[]>(FALLBACK_ICE_SERVERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/v1/turn/credentials');
      const data = await res.json();

      if (data?.success && data.data?.servers) {
        setIceServers(data.data.servers);
        setError(null);
      } else {
        throw new Error('Invalid TURN response');
      }
    } catch (err) {
      console.error('Failed to fetch TURN servers:', err);
      setError('Using fallback STUN only. Some users may not connect.');
      setIceServers(FALLBACK_ICE_SERVERS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
  }, [fetchServers]);

  return { iceServers, loading, error, refetch: fetchServers };
}
