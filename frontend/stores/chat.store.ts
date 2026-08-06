import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type MessageType = 'text' | 'markdown' | 'code' | 'image' | 'file' | 'gif';

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface ChatMessage {
  id: string;
  roomId: string;
  text: string;
  type: MessageType;
  senderId: string;
  senderName: string;
  senderAvatar?: string | null;
  timestamp: number;
  editedAt?: number;
  deleted?: boolean;
  replyTo?: string; // parent message id
  reactions: Reaction[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  readBy: string[];
}

export interface TypingUser {
  userId: string;
  name: string;
  timestamp: number;
}

interface ChatState {
  messages: Record<string, ChatMessage[]>; // roomId -> messages
  typing: Record<string, TypingUser[]>;     // roomId -> typing users
  threads: Record<string, ChatMessage[]>;   // parentId -> replies
  unreadCounts: Record<string, number>;     // roomId -> count
  activeThread: string | null;              // parent message id
  searchQuery: string;
  searchResults: ChatMessage[];
  draftMessages: Record<string, string>;    // roomId -> draft text

  // Actions
  addMessage: (roomId: string, message: ChatMessage) => void;
  editMessage: (roomId: string, messageId: string, newText: string) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  addReaction: (roomId: string, messageId: string, emoji: string, userId: string) => void;
  removeReaction: (roomId: string, messageId: string, emoji: string, userId: string) => void;
  setTyping: (roomId: string, user: TypingUser) => void;
  clearTyping: (roomId: string, userId: string) => void;
  markRead: (roomId: string, userId: string, messageIds: string[]) => void;
  setActiveThread: (parentId: string | null) => void;
  addReply: (parentId: string, reply: ChatMessage) => void;
  setDraft: (roomId: string, text: string) => void;
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: ChatMessage[]) => void;
  loadMessages: (roomId: string, messages: ChatMessage[]) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: {},
      typing: {},
      threads: {},
      unreadCounts: {},
      activeThread: null,
      searchQuery: '',
      searchResults: [],
      draftMessages: {},

      addMessage: (roomId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: [...(state.messages[roomId] || []), message],
          },
          unreadCounts: {
            ...state.unreadCounts,
            [roomId]: (state.unreadCounts[roomId] || 0) + 1,
          },
        })),

      editMessage: (roomId, messageId, newText) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: state.messages[roomId]?.map((m) =>
              m.id === messageId ? { ...m, text: newText, editedAt: Date.now() } : m
            ) || [],
          },
        })),

      deleteMessage: (roomId, messageId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: state.messages[roomId]?.map((m) =>
              m.id === messageId ? { ...m, deleted: true, text: '' } : m
            ) || [],
          },
        })),

      addReaction: (roomId, messageId, emoji, userId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: state.messages[roomId]?.map((m) => {
              if (m.id !== messageId) return m;
              const existing = m.reactions.find((r) => r.emoji === emoji);
              if (existing) {
                if (!existing.userIds.includes(userId)) {
                  existing.userIds.push(userId);
                }
                return m;
              }
              return { ...m, reactions: [...m.reactions, { emoji, userIds: [userId] }] };
            }) || [],
          },
        })),

      removeReaction: (roomId, messageId, emoji, userId) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: state.messages[roomId]?.map((m) => {
              if (m.id !== messageId) return m;
              return {
                ...m,
                reactions: m.reactions
                  .map((r) =>
                    r.emoji === emoji ? { ...r, userIds: r.userIds.filter((id) => id !== userId) } : r
                  )
                  .filter((r) => r.userIds.length > 0),
              };
            }) || [],
          },
        })),

      setTyping: (roomId, user) =>
        set((state) => {
          const existing = state.typing[roomId] || [];
          const filtered = existing.filter((u) => u.userId !== user.userId);
          return {
            typing: {
              ...state.typing,
              [roomId]: [...filtered, user],
            },
          };
        }),

      clearTyping: (roomId, userId) =>
        set((state) => ({
          typing: {
            ...state.typing,
            [roomId]: (state.typing[roomId] || []).filter((u) => u.userId !== userId),
          },
        })),

      markRead: (roomId, userId, messageIds) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [roomId]: state.messages[roomId]?.map((m) =>
              messageIds.includes(m.id) && !m.readBy.includes(userId)
                ? { ...m, readBy: [...m.readBy, userId] }
                : m
            ) || [],
          },
          unreadCounts: {
            ...state.unreadCounts,
            [roomId]: 0,
          },
        })),

      setActiveThread: (parentId) => set({ activeThread: parentId }),

      addReply: (parentId, reply) =>
        set((state) => ({
          threads: {
            ...state.threads,
            [parentId]: [...(state.threads[parentId] || []), reply],
          },
        })),

      setDraft: (roomId, text) =>
        set((state) => ({
          draftMessages: { ...state.draftMessages, [roomId]: text },
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),

      loadMessages: (roomId, messages) =>
        set((state) => ({
          messages: { ...state.messages, [roomId]: messages },
        })),
    }),
    {
      name: 'amigal-chat',
      partialize: (state) => ({ draftMessages: state.draftMessages }),
    }
  )
);
