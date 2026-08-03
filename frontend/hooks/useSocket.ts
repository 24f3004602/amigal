'use client';
import { useSocketContext } from '@/components/providers/SocketProvider';

export function useSocket() {
  return useSocketContext();
}
