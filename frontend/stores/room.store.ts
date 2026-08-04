import { create } from 'zustand';

export type RoomRole = 'host' | 'co-host' | 'participant' | 'viewer';
export type RoomStatus = 'waiting' | 'active' | 'ended';

export interface RoomParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: RoomRole;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isRaisingHand: boolean;
  joinedAt: number;
}

export interface Poll {
  id: string;
  question: string;
  options: { id: string; text: string; votes: string[] }[];
  isAnonymous: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: number;
}

export interface WhiteboardStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: 'pen' | 'eraser' | 'line' | 'rect' | 'circle';
}

interface RoomState {
  roomId: string | null;
  status: RoomStatus;
  mode: 'text' | 'video';
  participants: RoomParticipant[];
  polls: Poll[];
  whiteboard: WhiteboardStroke[];
  isRecording: boolean;
  isLocked: boolean;
  waitingUsers: RoomParticipant[];
  spotlightUserId: string | null;
  layout: 'grid' | 'spotlight' | 'sidebar';
  chatPinned: boolean;

  // Actions
  setRoom: (roomId: string, mode: 'text' | 'video') => void;
  setStatus: (status: RoomStatus) => void;
  addParticipant: (p: RoomParticipant) => void;
  removeParticipant: (id: string) => void;
  updateParticipant: (id: string, updates: Partial<RoomParticipant>) => void;
  setRole: (id: string, role: RoomRole) => void;
  setSpotlight: (id: string | null) => void;
  setLayout: (layout: RoomState['layout']) => void;
  toggleRecording: () => void;
  toggleLock: () => void;
  addToWaiting: (p: RoomParticipant) => void;
  removeFromWaiting: (id: string) => void;
  addPoll: (poll: Poll) => void;
  votePoll: (pollId: string, optionId: string, userId: string) => void;
  closePoll: (pollId: string) => void;
  addStroke: (stroke: WhiteboardStroke) => void;
  clearWhiteboard: () => void;
  setChatPinned: (pinned: boolean) => void;
  reset: () => void;
}

const initialState = {
  roomId: null,
  status: 'waiting' as RoomStatus,
  mode: 'video' as const,
  participants: [],
  polls: [],
  whiteboard: [],
  isRecording: false,
  isLocked: false,
  waitingUsers: [],
  spotlightUserId: null,
  layout: 'grid' as const,
  chatPinned: false,
};

export const useRoomStore = create<RoomState>((set, get) => ({
  ...initialState,

  setRoom: (roomId, mode) => set({ roomId, mode, status: 'active' }),
  setStatus: (status) => set({ status }),
  
  addParticipant: (p) => set((s) => ({ participants: [...s.participants, p] })),
  removeParticipant: (id) => set((s) => ({ participants: s.participants.filter((p) => p.id !== id) })),
  updateParticipant: (id, updates) =>
    set((s) => ({
      participants: s.participants.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),
  setRole: (id, role) => get().updateParticipant(id, { role }),
  
  setSpotlight: (id) => set({ spotlightUserId: id }),
  setLayout: (layout) => set({ layout }),
  toggleRecording: () => set((s) => ({ isRecording: !s.isRecording })),
  toggleLock: () => set((s) => ({ isLocked: !s.isLocked })),
  
  addToWaiting: (p) => set((s) => ({ waitingUsers: [...s.waitingUsers, p] })),
  removeFromWaiting: (id) => set((s) => ({ waitingUsers: s.waitingUsers.filter((u) => u.id !== id) })),
  
  addPoll: (poll) => set((s) => ({ polls: [...s.polls, poll] })),
  votePoll: (pollId, optionId, userId) =>
    set((s) => ({
      polls: s.polls.map((poll) => {
        if (poll.id !== pollId) return poll;
        return {
          ...poll,
          options: poll.options.map((opt) =>
            opt.id === optionId ? { ...opt, votes: [...opt.votes, userId] } : opt
          ),
        };
      }),
    })),
  closePoll: (pollId) =>
    set((s) => ({
      polls: s.polls.map((p) => (p.id === pollId ? { ...p, isActive: false } : p)),
    })),
  
  addStroke: (stroke) => set((s) => ({ whiteboard: [...s.whiteboard, stroke] })),
  clearWhiteboard: () => set({ whiteboard: [] }),
  setChatPinned: (chatPinned) => set({ chatPinned }),
  reset: () => set(initialState),
}));
