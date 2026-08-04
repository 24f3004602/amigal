'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChatMessageItem } from './ChatMessageItem';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessage } from '@/stores/chat.store';

interface VirtualizedMessageListProps {
  messages: ChatMessage[];
  roomId: string;
  onReply: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  typingUsers: any[];
}

export function VirtualizedMessageList({
  messages,
  roomId,
  onReply,
  onEdit,
  typingUsers,
}: VirtualizedMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Average message height
    overscan: 5,
  });

  const scrollToBottom = useCallback(() => {
    virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
  }, [virtualizer, messages.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div ref={parentRef} className="flex-1 overflow-y-auto scrollbar-thin relative">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const message = messages[virtualItem.index];
          return (
            <div
              key={message.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ChatMessageItem
                message={message}
                roomId={roomId}
                onReply={onReply}
                onEdit={onEdit}
              />
            </div>
          );
        })}
      </div>
      
      {typingUsers.length > 0 && (
        <div className="px-4 py-2">
          <TypingIndicator roomId={roomId} />
        </div>
      )}
    </div>
  );
}
