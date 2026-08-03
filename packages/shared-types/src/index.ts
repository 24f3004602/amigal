import { z } from 'zod';

// ==================== AUTH ====================
export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(50).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
export type LoginDto = z.infer<typeof LoginSchema>;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  subscriptionTier: string;
  videoChatsUsed: number;
  videoChatsLimit: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ==================== MATCHING ====================
export const FindMatchSchema = z.object({
  mode: z.enum(['text', 'video']),
  interests: z.array(z.string().max(30)).max(20).default([]),
  region: z.string().max(10).optional(),
});

export type FindMatchDto = z.infer<typeof FindMatchSchema>;

export interface MatchResult {
  status: 'matched' | 'waiting';
  roomId?: string;
  partnerId?: string;
  similarity?: number;
  message?: string;
}

// ==================== SIGNALING / WEBRTC ====================
export interface OfferPayload {
  roomId: string;
  offer: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  roomId: string;
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  roomId: string;
  candidate: RTCIceCandidateInit;
}

// ==================== CHAT ====================
export interface ChatMessage {
  id: string;
  text: string;
  senderId: string;
  timestamp: string;
  censored?: boolean;
}

// ==================== API ENVELOPE ====================
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: null | { code: number | string; message: string };
  meta?: { timestamp: string; path: string };
}

// ==================== SOCKET EVENTS ====================
export interface ServerToClientEvents {
  'match-found': (data: { roomId: string; partnerId: string; interests: string[] }) => void;
  'peer-joined': (data: { userId: string }) => void;
  offer: (data: { offer: RTCSessionDescriptionInit; senderId: string }) => void;
  answer: (data: { answer: RTCSessionDescriptionInit; senderId: string }) => void;
  'ice-candidate': (data: { candidate: RTCIceCandidateInit; senderId: string }) => void;
  'call-ended': (data: { endedBy: string }) => void;
  error: (data: { code: string; message: string }) => void;
}

export interface ClientToServerEvents {
  'join-room': (payload: { roomId: string }) => void;
  offer: (payload: OfferPayload) => void;
  answer: (payload: AnswerPayload) => void;
  'ice-candidate': (payload: IceCandidatePayload) => void;
  'end-call': (payload: { roomId: string }) => void;
}
