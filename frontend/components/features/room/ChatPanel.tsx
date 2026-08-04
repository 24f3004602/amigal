'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useChatStore } from '@/stores/chat.store';
import { useAuth } from '@/hooks/useAuth';
import { ChatMessageItem } from '@/components/features/chat/ChatMessageItem';
import { MessageInput } from '@/components/features/chat/MessageInput';
import { TypingIndicator } from '@/components/features/chat/TypingIndicator';
import { ThreadPanel } from '@/components/features/chat/ThreadPanel';
import { ChatSearch } from '@/components/features/chat/ChatSearch';
import { useSocket } from '@/hooks/useSocket';
import { Search, MoreVertical, Bell, BellOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatPanelProps {
  roomId: string;
  onNewMessage?: () => void;
}

export function ChatPanel({ roomId, onNewMessage }: ChatPanelProps) {
  const socket = useSocket();
  const { user } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string } | null>(null);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const messages = useChatStore((s) => s.messages[roomId] || []);
  const activeThread = useChatStore((s) => s.activeThread);
  const unreadCount = useChatStore((s) => s.unreadCounts[roomId] || 0);
  const { markRead } = useChatStore();

  // Auto-scroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  // Mark read on mount
  useEffect(() => {
    const ids = messages.filter((m) => !m.readBy.includes(user?.id || '')).map((m) => m.id);
    if (ids.length) markRead(roomId, user?.id || '', ids);
  }, [roomId, user?.id, messages, markRead]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('chat-message', (msg: any) => {
      useChatStore.getState().addMessage(roomId, msg);
      onNewMessage?.();
      if (!muted) {
        // Play subtle notification sound
        const audio = new Audio('/sounds/message.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    });

    socket.on('typing', ({ name }: any) => {
      useChatStore.getState().setTyping(roomId, { userId: name, name, timestamp: Date.now() });
    });

    socket.on('stop-typing', ({ name }: any) => {
      useChatStore.getState().clearTyping(roomId, name);
    });

    return () => {
      socket.off('chat-message');
      socket.off('typing');
      socket.off('stop-typing');
    };
  }, [socket, roomId, muted, onNewMessage]);

  const handleReply = (messageId: string) => {
    setReplyTo(messageId);
    setEditingMessage(null);
  };

  const handleEdit = (messageId: string, currentText: string) => {
    setEditingMessage({ id: messageId, text: currentText });
    setReplyTo(null);
  };

  return (
    <div className="flex h-full flex-col glass-strong rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Chat</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" onClick={() => setMuted(!muted)} title={muted ? 'Unmute notifications' : 'Mute notifications'}>
            {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setShowSearch(!showSearch)} title="Search messages">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon-sm" title="Chat options">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search overlay */}
      <AnimatePresence>
        {showSearch && <ChatSearch roomId={roomId} onClose={() => setShowSearch(false)} />}
      </AnimatePresence>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground py-12">
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Say hello to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessageItem
              key={msg.id}
              message={msg}
              roomId={roomId}
              onReply={handleReply}
              onEdit={handleEdit}
            />
          ))
        )}
        <TypingIndicator roomId={roomId} />
      </div>

      {/* Input */}
      <MessageInput
        roomId={roomId}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />

      {/* Thread panel */}
      <AnimatePresence>
        {activeThread && <ThreadPanel roomId={roomId} />}
      </AnimatePresence>
    </div>
  );
}
