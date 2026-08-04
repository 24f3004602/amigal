'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { useChatStore } from '@/stores/chat.store';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import {
  Send,
  Paperclip,
  Image,
  Smile,
  Code,
  Bold,
  Italic,
  List,
  X,
  Search,
  Gift,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
  roomId: string;
  replyTo?: string | null;
  onCancelReply?: () => void;
  editingMessage?: { id: string; text: string } | null;
  onCancelEdit?: () => void;
}

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '🔥', '👏', '😢'];

export function MessageInput({
  roomId,
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) {
  const { user } = useAuth();
  const socket = useSocket();
  const { addMessage, editMessage, setDraft, draftMessages, addReply } = useChatStore();
  const [text, setText] = useState(editingMessage?.text || draftMessages[roomId] || '');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeout = useRef<NodeJS.Timeout>();

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [text]);

  // Save draft
  useEffect(() => {
    setDraft(roomId, text);
  }, [text, roomId, setDraft]);

  const sendTyping = useCallback(() => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', { roomId, name: user?.displayName || 'User' });
    }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('stop-typing', { roomId });
    }, 3000);
  }, [isTyping, socket, roomId, user]);

  const handleSend = () => {
    if (!text.trim() && !editingMessage) return;

    if (editingMessage) {
      editMessage(roomId, editingMessage.id, text.trim());
      onCancelEdit?.();
      setText('');
      return;
    }

    const message = {
      id: Math.random().toString(36).slice(2),
      roomId,
      text: text.trim(),
      type: detectMessageType(text.trim()),
      senderId: user?.id || 'anon',
      senderName: user?.displayName || 'Anonymous',
      senderAvatar: user?.avatarUrl,
      timestamp: Date.now(),
      reactions: [],
      readBy: [],
      replyTo: replyTo || undefined,
    };

    if (replyTo) {
      addReply(replyTo, message);
      onCancelReply?.();
    } else {
      addMessage(roomId, message);
    }

    socket?.emit('chat-message', message);
    setText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === '@') {
      setShowMentions(true);
      setMentionQuery('');
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      // In production: upload to S3/presigned URL
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Mock upload - replace with actual API call
        await new Promise((r) => setTimeout(r, 500));
        const mockUrl = URL.createObjectURL(file);

        const message = {
          id: Math.random().toString(36).slice(2),
          roomId,
          text: '',
          type: file.type.startsWith('image/') ? ('image' as const) : file.type === 'image/gif' ? ('gif' as const) : ('file' as const),
          senderId: user?.id || 'anon',
          senderName: user?.displayName || 'Anonymous',
          senderAvatar: user?.avatarUrl,
          timestamp: Date.now(),
          reactions: [],
          readBy: [],
          fileUrl: mockUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
        };

        addMessage(roomId, message);
        socket?.emit('chat-message', message);
      } catch {
        // toast error
      }
    }

    setUploading(false);
  };

  const insertMarkdown = (syntax: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const selected = text.slice(start, end);
    const newText = before + syntax.replace('{}', selected || 'text') + after;
    setText(newText);
    setTimeout(() => {
      el.focus();
      const newCursor = start + syntax.indexOf('{}') + (selected ? selected.length : 4);
      el.setSelectionRange(newCursor, newCursor);
    }, 0);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  return (
    <div
      className={cn(
        'relative border-t border-border bg-background/95 backdrop-blur-xl transition-colors',
        dragOver && 'bg-primary/5 border-primary'
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {/* Reply/Edit indicator */}
      <AnimatePresence>
        {(replyTo || editingMessage) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="flex items-center justify-between border-b border-border px-4 py-2 bg-muted/30"
          >
            <span className="text-xs text-muted-foreground">
              {editingMessage ? 'Editing message' : `Replying to message`}
            </span>
            <button onClick={editingMessage ? onCancelEdit : onCancelReply} className="text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 pt-2">
        <button onClick={() => insertMarkdown('**{}**')} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => insertMarkdown('*{}*')} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => insertMarkdown('```\n{}\n```')} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Code block">
          <Code className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => insertMarkdown('- {}')} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="List">
          <List className="h-3.5 w-3.5" />
        </button>
        <div className="h-4 w-px bg-border mx-1" />
        <label className="cursor-pointer rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Attach file">
          <Paperclip className="h-3.5 w-3.5" />
          <input type="file" className="hidden" multiple onChange={(e) => handleFileUpload(e.target.files)} />
        </label>
        <button onClick={() => setShowEmoji(!showEmoji)} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground" title="Emoji">
          <Smile className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Quick emoji bar */}
      <div className="flex items-center gap-1 px-3 py-1">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => setText((t) => t + emoji)}
            className="rounded px-1.5 py-0.5 text-sm hover:bg-muted transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Textarea */}
      <div className="flex items-end gap-2 p-3 pt-1">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            sendTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={editingMessage ? 'Edit your message...' : replyTo ? 'Write a reply...' : 'Type a message...'}
          className="flex-1 resize-none rounded-xl border border-input bg-transparent px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px] max-h-[200px]"
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!text.trim() || uploading}
          className="shrink-0 rounded-full h-10 w-10"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {dragOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-primary/10 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Image className="h-8 w-8" />
            <span className="font-medium">Drop files to upload</span>
          </div>
        </div>
      )}
    </div>
  );
}

function detectMessageType(text: string): import('@/stores/chat.store').MessageType {
  if (text.startsWith('```') && text.endsWith('```')) return 'code';
  if (text.match(/!\[.*?\]\(.*?\)/) || text.match(/https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i)) return 'markdown';
  if (text.match(/^https?:\/\/ tenor\.com|giphy\.com/i)) return 'gif';
  return 'text';
}
