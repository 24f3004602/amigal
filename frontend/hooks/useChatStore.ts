import { create } from 'zustand';

interface ChatState {
  roomId: string | null;
  partnerId: string | null;
  partnerName: string;
  mode: 'text' | 'video';
  socketRoom: string | null;
  interests: string[];
  reset: () => void;
  setRoom: (roomId: string, partnerId: string, partnerName: string, mode: 'text' | 'video', socketRoom: string, interests: string[]) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  roomId: null,
  partnerId: null,
  partnerName: '',
  mode: 'text',
  socketRoom: null,
  interests: [],
  reset: () => set({ roomId: null, partnerId: null, partnerName: '', mode: 'text', socketRoom: null, interests: [] }),
  setRoom: (roomId, partnerId, partnerName, mode, socketRoom, interests) => 
    set({ roomId, partnerId, partnerName, mode, socketRoom, interests }),
}));
