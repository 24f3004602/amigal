'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRoomStore } from '@/stores/room.store';
import { useAuth } from '@/hooks/useAuth';
import { Plus, X, BarChart3, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PollCreator({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const { addPoll } = useRoomStore();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [anonymous, setAnonymous] = useState(false);

  const addOption = () => options.length < 6 && setOptions([...options, '']);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) => {
    const next = [...options];
    next[i] = val;
    setOptions(next);
  };

  const create = () => {
    if (!question.trim() || options.some((o) => !o.trim())) return;
    addPoll({
      id: Math.random().toString(36).slice(2),
      question: question.trim(),
      options: options.map((o) => ({ id: Math.random().toString(36).slice(2), text: o.trim(), votes: [] })),
      isAnonymous: anonymous,
      isActive: true,
      createdBy: user?.id || '',
      createdAt: Date.now(),
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-strong w-full max-w-md rounded-2xl p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" /> Create Poll
        </h3>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Input
        placeholder="Ask a question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />

      <div className="space-y-2">
        {options.map((opt, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
            />
            {options.length > 2 && (
              <Button variant="ghost" size="icon" onClick={() => removeOption(i)}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
        {options.length < 6 && (
          <Button variant="ghost" size="sm" className="gap-1" onClick={addOption}>
            <Plus className="h-3.5 w-3.5" /> Add option
          </Button>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <button
          onClick={() => setAnonymous(!anonymous)}
          className={cn(
            'flex h-5 w-9 items-center rounded-full transition-colors',
            anonymous ? 'bg-primary' : 'bg-muted'
          )}
        >
          <span className={cn('h-3.5 w-3.5 rounded-full bg-white transition-transform', anonymous && 'translate-x-4')} />
        </button>
        Anonymous voting
      </label>

      <Button className="w-full" onClick={create} disabled={!question.trim() || options.some((o) => !o.trim())}>
        Launch Poll
      </Button>
    </motion.div>
  );
}
