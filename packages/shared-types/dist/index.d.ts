import { z } from 'zod';
export declare const RegisterSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    displayName?: string | undefined;
}, {
    email: string;
    password: string;
    displayName?: string | undefined;
}>;
export declare const LoginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
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
export declare const FindMatchSchema: z.ZodObject<{
    mode: z.ZodEnum<["text", "video"]>;
    interests: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    region: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mode: "text" | "video";
    interests: string[];
    region?: string | undefined;
}, {
    mode: "text" | "video";
    interests?: string[] | undefined;
    region?: string | undefined;
}>;
export type FindMatchDto = z.infer<typeof FindMatchSchema>;
export interface MatchResult {
    status: 'matched' | 'waiting';
    roomId?: string;
    partnerId?: string;
    similarity?: number;
    message?: string;
}
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
export interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    timestamp: string;
    censored?: boolean;
}
export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: null | {
        code: number | string;
        message: string;
    };
    meta?: {
        timestamp: string;
        path: string;
    };
}
export interface ServerToClientEvents {
    'match-found': (data: {
        roomId: string;
        partnerId: string;
        interests: string[];
    }) => void;
    'peer-joined': (data: {
        userId: string;
    }) => void;
    offer: (data: {
        offer: RTCSessionDescriptionInit;
        senderId: string;
    }) => void;
    answer: (data: {
        answer: RTCSessionDescriptionInit;
        senderId: string;
    }) => void;
    'ice-candidate': (data: {
        candidate: RTCIceCandidateInit;
        senderId: string;
    }) => void;
    'call-ended': (data: {
        endedBy: string;
    }) => void;
    'chat-message': (data: {
        roomId: string;
        text: string;
        senderId: string;
        timestamp: string;
    }) => void;
    typing: (data: {
        roomId: string;
        name: string;
    }) => void;
    'stop-typing': (data: {
        roomId: string;
        name: string;
    }) => void;
    reaction: (data: {
        emoji: string;
    }) => void;
    error: (data: {
        code: string;
        message: string;
    }) => void;
}
export interface ClientToServerEvents {
    'join-room': (payload: {
        roomId: string;
    }) => void;
    offer: (payload: OfferPayload) => void;
    answer: (payload: AnswerPayload) => void;
    'ice-candidate': (payload: IceCandidatePayload) => void;
    'end-call': (payload: {
        roomId: string;
    }) => void;
    'chat-message': (payload: {
        roomId: string;
        text: string;
        senderId: string;
        senderName?: string | null;
        senderAvatar?: string | null;
    }) => void;
    typing: (payload: {
        roomId: string;
        name: string;
    }) => void;
    'stop-typing': (payload: {
        roomId: string;
    }) => void;
    reaction: (payload: {
        emoji: string;
    }) => void;
}
