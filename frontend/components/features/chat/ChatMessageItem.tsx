'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { MessageContent } from './MessageContent';
import { EmojiPicker } from './EmojiPicker';
import { useChatStore } from '@/stores/chat.store';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  Pencil,
  Trash2,
  Copy,
  Check,
  CheckCheck,
  MoreHorizontal,
  Smile,
} from 'lucide-react';

interface ChatMessageItemProps {
  message: import('@/stores/chat.store').ChatMessage;
  roomId: string;
  isThread?: boolean;
  onReply: (messageId: string) => void;
  onEdit: (messageId: string, currentText: string) => void;
}

export function ChatMessageItem({ message, roomId, isThread, onReply, onEdit }: ChatMessageItemProps) {
  const { user } = useAuth();
  const { addReaction, removeReaction, setActiveThread } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isMe = message.senderId === user?.id;
  const isEdited = !!message.editedAt;

  const handleReaction = (emoji: string) => {
    if (message.reactions.some((r) => r.emoji === emoji && r.userIds.includes(user?.id || ''))) {
      removeReaction(roomId, message.id, emoji, user?.id || '');
    } else {
      addReaction(roomId, message.id, emoji, user?.id || '');
    }
    setShowEmojiPicker(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
  };

  const handleDelete = () => {
    if (confirm('Delete this message?')) {
      useChatStore.getState().deleteMessage(roomId, message.id);
    }
  };

  const replyCount = useChatStore((s) => s.threads[message.id]?.length || 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'group relative flex gap-3 px-4 py-2 hover:bg-muted/30 transition-colors',
        isThread && 'px-2 py-1.5'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      <Avatar
        src={message.senderAvatar}
        fallback={message.senderName}
        size={isThread ? 'sm' : 'md'}
        className="mt-0.5 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={cn('font-semibold', isThread ? 'text-sm' : 'text-sm')}>
            {message.senderName}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isEdited && <span className="text-[10px] text-muted-foreground">(edited)</span>}
        </div>

        <MessageContent message={message} compact={isThread} />

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors',
                  r.userIds.includes(user?.id || '')
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border bg-muted/50 hover:bg-muted'
                )}
                title={r.userIds.join(', ')}
              >
                <span>{r.emoji}</span>
                <span className="text-muted-foreground">{r.userIds.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Thread indicator */}
        {replyCount > 0 && !isThread && (
          <button
            onClick={() => setActiveThread(message.id)}
            className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {/* Read receipts */}
        {isMe && message.readBy.length > 0 && (
          <div className="mt-1 flex items-center gap-0.5 text-[10px] text-muted-foreground">
            <CheckCheck className="h-3 w-3 text-primary" />
            <span>Read</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && !message.deleted && (
        <div className="absolute right-4 top-2 flex items-center gap-0.5 rounded-lg border border-border bg-background shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Add reaction"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onReply(message.id)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Reply"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          {isMe && (
            <>
              <button
                onClick={() => onEdit(message.id, message.text)}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                title="Edit"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <button
            onClick={handleCopy}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            title="Copy text"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Emoji picker popover */}
      {showEmojiPicker && (
        <div className="absolute right-4 top-10 z-50">
          <EmojiPicker onSelect={handleReaction} onClose={() => setShowEmojiPicker(false)} />
        </div>
      )}
    </motion.div>
  );
}
