'use client';

import { useState } from 'react';
import { useChatStore } from '@/stores/chat.store';
import { Input } from '@/components/ui/Input';
import { ChatMessageItem } from './ChatMessageItem';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatSearchProps {
  roomId: string;
  onClose: () => void;
}

export function ChatSearch({ roomId, onClose }: ChatSearchProps) {
  const [query, setQuery] = useState('');
  const messages = useChatStore((s) => s.messages[roomId] || []);

  const results = query.trim()
    ? messages.filter(
        (m) =>
          !m.deleted &&
          (m.text.toLowerCase().includes(query.toLowerCase()) ||
            m.senderName.toLowerCase().includes(query.toLowerCase()))
      )
    : [];

  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -20, opacity: 0 }}
      className="absolute inset-x-0 top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl p-4 shadow-lg"
    >
      <div className="flex items-center gap-3">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages..."
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          autoFocus
        />
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      {query && (
        <p className="mt-2 text-xs text-muted-foreground">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </p>
      )}

      <div className="mt-3 max-h-64 overflow-y-auto space-y-1 scrollbar-thin">
        {results.map((msg) => (
          <div key={msg.id} className="rounded-lg hover:bg-muted/50 p-2 cursor-pointer transition-colors">
            <ChatMessageItem
              message={msg}
              roomId={roomId}
              onReply={() => {}}
              onEdit={() => {}}
            />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
