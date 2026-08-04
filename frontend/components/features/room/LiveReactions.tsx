'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSocket } from '@/hooks/useSocket';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '🔥', '👏', '💯', '🚀', '👋'];

interface FloatingEmoji {
  id: string;
  emoji: string;
  x: number;
  delay: number;
  duration: number;
  scale: number;
}

export function LiveReactions() {
  const socket = useSocket();
  const [floaters, setFloaters] = useState<FloatingEmoji[]>([]);

  const triggerReaction = useCallback((emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    const x = Math.random() * 80 + 10; // 10% to 90% width
    const floater: FloatingEmoji = {
      id,
      emoji,
      x,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 2,
      scale: 0.8 + Math.random() * 0.6,
    };

    setFloaters((prev) => [...prev, floater]);
    setTimeout(() => setFloaters((prev) => prev.filter((f) => f.id !== id)), floater.duration * 1000 + 500);

    // Also send via socket
    socket?.emit('reaction', { emoji });
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    socket.on('reaction', ({ emoji }: { emoji: string }) => {
      triggerReaction(emoji);
    });
    return () => { socket.off('reaction'); };
  }, [socket, triggerReaction]);

  return (
    <>
      {/* Floating emojis */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        <AnimatePresence>
          {floaters.map((f) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 1, y: '100vh', x: `${f.x}vw`, scale: 0 }}
              animate={{ opacity: 0, y: '-10vh', scale: f.scale }}
              exit={{ opacity: 0 }}
              transition={{ duration: f.duration, delay: f.delay, ease: 'easeOut' }}
              className="absolute text-4xl"
            >
              {f.emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction bar */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 rounded-full glass px-3 py-2 shadow-xl">
        {REACTION_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              triggerReaction(emoji);
              if (emoji === '🎉') {
                confetti({ particleCount: 60, spread: 70, origin: { y: 0.8 } });
              }
            }}
            className="rounded-full p-1.5 text-xl transition-transform hover:scale-125 hover:bg-muted"
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </>
  );
}
