'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'partner';
  timestamp: number;
}

export function ChatPanel({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: Math.random().toString(36).slice(2),
      text: input.trim(),
      sender: 'me',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
    setInput('');
    // Simulate partner typing then reply
    setTimeout(() => setIsTyping(true), 500);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).slice(2),
          text: 'Thanks for the message! This is a demo reply.',
          sender: 'partner',
          timestamp: Date.now(),
        },
      ]);
    }, 2500);
  };

  return (
    <div className="flex h-full flex-col glass-strong rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Chat</h3>
          <span className="text-xs text-muted-foreground">({messages.length})</span>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Chat options">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn('flex gap-3', msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row')}
            >
              <Avatar fallback={msg.sender === 'me' ? 'You' : 'P'} size="sm" />
              <div className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                msg.sender === 'me'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              )}>
                <p>{msg.text}</p>
                <span className="mt-1 block text-[10px] opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 pl-1">
            <Avatar fallback="P" size="sm" />
            <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
            </div>
          </motion.div>
        )}

        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground py-12">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Say hello to start the conversation</p>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" aria-label="Add attachment">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            className="flex-1"
          />
          <Button variant="ghost" size="icon-sm" aria-label="Add emoji">
            <Smile className="h-4 w-4" />
          </Button>
          <Button size="icon-sm" onClick={send} disabled={!input.trim()} aria-label="Send message">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
