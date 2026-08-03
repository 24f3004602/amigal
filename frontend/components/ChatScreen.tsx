'use client';

import { useEffect, useRef, useState } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { Send, PhoneOff, Shield, Volume2, VolumeX, Smile } from 'lucide-react';

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

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-hidden">
      <div className="fixed top-0 left-0 w-full h-full grid-bg opacity-30" />
      
      {/* Header */}
      <div className="relative z-10 glass border-b border-white/10 px-4 md:px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-cyan-500/20">
            {partnerName?.[0] || 'S'}
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm md:text-base">{partnerName || 'Stranger'}</h3>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
              <span className="text-xs text-white/40">{connected ? 'Connected' : 'Connecting...'}</span>
              {typing && <span className="text-xs text-cyan-400 animate-pulse ml-2">typing...</span>}
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
          <button 
            onClick={handleEnd} 
            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:scale-105 transition-all"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-6 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/20">
            <Smile className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Say hello to start the conversation</p>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.senderId === 'system' ? 'justify-center' : msg.senderId === partnerId ? 'justify-start' : 'justify-end'}`}
          >
            {msg.senderId === 'system' ? (
              <span className="text-xs text-white/30 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                {msg.text}
              </span>
            ) : (
              <div className={`max-w-[75%] md:max-w-[60%] group`}>
                <div
                  className={`px-5 py-3 rounded-2xl ${
                    msg.senderId === partnerId
                      ? 'glass text-white rounded-tl-sm border-white/10'
                      : 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-400/20 text-white rounded-tr-sm'
                  }`}
                >
                  <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
                </div>
                <span className={`text-[10px] text-white/20 mt-1 block ${msg.senderId === partnerId ? 'text-left' : 'text-right'}`}>
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            )}
          </div>
        ))}
        
        {typing && (
          <div className="flex justify-start">
            <div className="glass rounded-2xl rounded-tl-sm px-5 py-3 border border-white/10">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="relative z-10 glass border-t border-white/10 px-4 py-4 shrink-0">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
            className="input-field flex-1 py-3 px-5"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-all disabled:opacity-30 disabled:hover:scale-100"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
