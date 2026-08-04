'use client';

import { useChatStore } from '@/stores/chat.store';
import { motion, AnimatePresence } from 'framer-motion';

interface TypingIndicatorProps {
  roomId: string;
}

export function TypingIndicator({ roomId }: TypingIndicatorProps) {
  const typing = useChatStore((s) => s.typing[roomId] || []);

  if (typing.length === 0) return null;

  const names = typing.map((t) => t.name).slice(0, 3);
  const text = names.length === 1 
    ? `${names[0]} is typing...`
    : names.length === 2
    ? `${names[0]} and ${names[1]} are typing...`
    : `${names[0]} and ${names.length - 1} others are typing...`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground"
      >
        <div className="flex gap-0.5">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '0ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '150ms' }} />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: '300ms' }} />
        </div>
        <span>{text}</span>
      </motion.div>
    </AnimatePresence>
  );
}
