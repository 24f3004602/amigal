'use client';

import { useChatStore } from '@/stores/chat.store';
import { ChatMessageItem } from './ChatMessageItem';
import { MessageInput } from './MessageInput';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThreadPanelProps {
  roomId: string;
}

export function ThreadPanel({ roomId }: ThreadPanelProps) {
  const { activeThread, setActiveThread, messages } = useChatStore();
  const parentMessage = activeThread
    ? messages[roomId]?.find((m) => m.id === activeThread)
    : null;
  const replies = activeThread ? useChatStore.getState().threads[activeThread] || [] : [];

  if (!activeThread || !parentMessage) return null;

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute right-0 top-0 bottom-0 w-96 border-l border-border bg-background/95 backdrop-blur-xl z-20 flex flex-col"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-semibold text-sm">Thread</h3>
        <Button variant="ghost" size="icon-sm" onClick={() => setActiveThread(null)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        <div className="rounded-lg bg-muted/30 p-3 mb-4">
          <ChatMessageItem
            message={parentMessage}
            roomId={roomId}
            isThread
            onReply={() => {}}
            onEdit={() => {}}
          />
        </div>
        {replies.map((reply) => (
          <ChatMessageItem
            key={reply.id}
            message={reply}
            roomId={roomId}
            isThread
            onReply={() => {}}
            onEdit={() => {}}
          />
        ))}
        {replies.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No replies yet</p>
        )}
      </div>

      <MessageInput roomId={roomId} replyTo={activeThread} onCancelReply={() => setActiveThread(null)} />
    </motion.div>
  );
}
