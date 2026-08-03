import { create } from 'zustand';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'partner' | 'system';
  timestamp: number;
}

interface ChatState {
  roomId: string | null;
  partnerId: string | null;
  partnerName: string;
  mode: 'text' | 'video';
  socketRoom: string | null;
  interests: string[];
  messages: Message[];
  isTyping: boolean;
  reset: () => void;
  setRoom: (roomId: string, partnerId: string, partnerName: string, mode: 'text' | 'video', socketRoom: string, interests: string[]) => void;
  addMessage: (msg: Message) => void;
  setTyping: (typing: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  roomId: null,
  partnerId: null,
  partnerName: '',
  mode: 'text',
  socketRoom: null,
  interests: [],
  messages: [],
  isTyping: false,
  reset: () => set({ roomId: null, partnerId: null, partnerName: '', mode: 'text', socketRoom: null, interests: [], messages: [], isTyping: false }),
  setRoom: (roomId, partnerId, partnerName, mode, socketRoom, interests) =>
    set({ roomId, partnerId, partnerName, mode, socketRoom, interests }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setTyping: (typing) => set({ isTyping: typing }),
}));
