'use client';

import type { ServerToClientEvents, ClientToServerEvents } from '@amigal/shared-types';
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// The value is wrapped in an object so `undefined` (no provider above us) stays
// distinguishable from `{ socket: null }` (provider mounted, not connected yet).
// The socket is only created in an effect, so it is null during SSR/prerender
// and on the first client render — that is not an error.
const SocketContext = createContext<{ socket: AppSocket | null } | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }): JSX.Element {
  const [socket, setSocket] = useState<AppSocket | null>(null);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const s = io(`${API_URL}/signaling`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(s);

    return (): void => {
      s.disconnect();
    };
  }, []);

  const value = useMemo((): { socket: AppSocket | null } => ({ socket }), [socket]);

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

/** Returns the socket, or null until it connects. Callers must null-check. */
export const useSocketContext = (): AppSocket | null => {
  const ctx = useContext(SocketContext);
  if (!ctx) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return ctx.socket;
};
