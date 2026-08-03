'use client';
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io(API_URL, {
      withCredentials: true,
      auth: { token: 'from-cookie' },
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, []);

  return socketRef;
}
