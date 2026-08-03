'use client';
import { create } from 'zustand';

interface ChatState {
  roomId: string | null;
  partnerId: string | null;
  partnerName: string | null;
  mode: 'text' | 'video';
  messages: Array<{
    id: string;
    text: string;
    sender: 'me' | 'partner';
    timestamp: number;
  }>;
  isTyping: boolean;
  sessionId: string | null;
  sharedInterests: string[];
  startTime: number | null;
  elapsed: number;
  setRoom: (
    roomId: string,
    partnerId: string,
    partnerName: string,
    mode: 'text' | 'video',
    sessionId: string,
    sharedInterests: string[]
  ) => void;
  addMessage: (msg: {
    id: string;
    text: string;
    sender: 'me' | 'partner';
    timestamp: number;
  }) => void;
  setTyping: (typing: boolean) => void;
  setElapsed: (elapsed: number) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  roomId: null,
  partnerId: null,
  partnerName: null,
  mode: 'text',
  messages: [],
  isTyping: false,
  sessionId: null,
  sharedInterests: [],
  startTime: null,
  elapsed: 0,
  setRoom: (roomId, partnerId, partnerName, mode, sessionId, sharedInterests) =>
    set({
      roomId,
      partnerId,
      partnerName,
      mode,
      sessionId,
      sharedInterests,
      startTime: Date.now(),
      messages: [],
      elapsed: 0,
      isTyping: false,
    }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  setTyping: (isTyping) => set({ isTyping }),
  setElapsed: (elapsed) => set({ elapsed }),
  reset: () =>
    set({
      roomId: null,
      partnerId: null,
      partnerName: null,
      mode: 'text',
      messages: [],
      isTyping: false,
      sessionId: null,
      sharedInterests: [],
      startTime: null,
      elapsed: 0,
    }),
}));
