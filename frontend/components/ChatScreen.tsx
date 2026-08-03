'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Send, PhoneOff, Flag, Shield, Volume2, VolumeX } from 'lucide-react';

interface Props {
  onEnd: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ChatScreen({ onEnd }: Props) {
  const { roomId, partnerId, partnerName, mode, socketRoom, interests, reset } = useChatStore();
  const [messages, setMessages] = useState<{ text: string; senderId: string; timestamp: string }[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (!socketRoom) return;

    const socket = io(API_URL, { withCredentials: true });
    socketRef.current = socket;

    socket.emit('join-room', { roomId: socketRoom });

    socket.on('connect', () => setConnected(true));
    socket.on('peer-joined', () => {
      setMessages((prev) => [...prev, { text: 'Stranger joined the room', senderId: 'system', timestamp: new Date().toISOString() }]);
    });

    socket.on('chat-message', (data: any) => {
      setMessages((prev) => [...prev, data]);
      setTyping(false);
    });

    socket.on('typing', (data: any) => {
      if (data.senderId !== partnerId) return;
      setTyping(data.isTyping);
    });

    socket.on('call-ended', () => {
      setMessages((prev) => [...prev, { text: 'Stranger left the room', senderId: 'system', timestamp: new Date().toISOString() }]);
      setTimeout(onEnd, 1500);
    });

    return () => {
      socket.disconnect();
    };
  }, [socketRoom, partnerId, onEnd]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = () => {
    if (!input.trim() || !socketRef.current) return;
    socketRef.current.emit('chat-message', { roomId: socketRoom, text: input });
    setInput('');
    socketRef.current.emit('typing', { roomId: socketRoom, isTyping: false });
  };

  const handleTyping = (val: string) => {
    setInput(val);
    if (socketRef.current && val.length > 0) {
      socketRef.current.emit('typing', { roomId: socketRoom, isTyping: true });
    }
  };

  const handleEnd = async () => {
    if (socketRef.current) {
      socketRef.current.emit('end-call', { roomId: socketRoom });
    }
    await api.post('/sessions/end', { roomId });
    reset();
    onEnd();
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative">
      <div className="fixed top-0 left-0 w-full h-full grid-bg opacity-30" />
      
      {/* Header */}
      <div className="relative z-10 glass border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-sm font-bold">
            {partnerName?.[0] || 'S'}
          </div>
          <div>
            <h3 className="font-semibold text-white">{partnerName || 'Stranger'}</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="text-xs text-white/40">{connected ? 'Connected' : 'Connecting...'}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {interests.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs text-white/60">{interests.slice(0, 2).join(', ')}</span>
            </div>
          )}
          <button onClick={() => setMuted(!muted)} className="p-2 rounded-xl hover:bg-white/10 transition-colors text-white/60">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button onClick={handleEnd} className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.senderId === 'system' ? 'justify-center' : msg.senderId === partnerId ? 'justify-start' : 'justify-end'}`}
          >
            {msg.senderId === 'system' ? (
              <span className="text-xs text-white/30 px-4 py-2 rounded-full bg-white/5">{msg.text}</span>
            ) : (
              <div
                className={`max-w-[70%] px-5 py-3 rounded-2xl ${
                  msg.senderId === partnerId
                    ? 'glass text-white rounded-tl-sm'
                    : 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/20 text-white rounded-tr-sm'
                }`}
              >
                <p className="text
