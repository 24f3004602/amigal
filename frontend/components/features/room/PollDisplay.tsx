'use client';

import { motion } from 'framer-motion';
import { useRoomStore } from '@/stores/room.store';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PollDisplay() {
  const { user } = useAuth();
  const { polls, votePoll, closePoll, participants } = useRoomStore();
  const activePoll = polls.find((p) => p.isActive);

  if (!activePoll) return null;

  const totalVotes = activePoll.options.reduce((sum, o) => sum + o.votes.length, 0);
  const hasVoted = activePoll.options.some((o) => o.votes.includes(user?.id || ''));
  const isHost = participants.find((p) => p.id === user?.id)?.role === 'host';

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="absolute right-4 top-20 z-30 w-80 glass-strong rounded-2xl p-5 shadow-2xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Live Poll</h3>
          </div>
          <p className="text-sm mt-1">{activePoll.question}</p>
          {activePoll.isAnonymous && <Badge variant="ghost" className="mt-1 text-[10px]">Anonymous</Badge>}
        </div>
        {isHost && (
          <Button variant="ghost" size="icon-sm" onClick={() => closePoll(activePoll.id)}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="space-y-2.5">
        {activePoll.options.map((opt) => {
          const percent = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
          const voted = opt.votes.includes(user?.id || '');

          return (
            <button
              key={opt.id}
              onClick={() => !hasVoted && votePoll(activePoll.id, opt.id, user?.id || '')}
              disabled={hasVoted}
              className={cn(
                'relative w-full overflow-hidden rounded-xl border p-3 text-left transition-all',
                voted ? 'border-primary bg-primary/5' : 'border-border bg-muted/30 hover:bg-muted/50'
              )}
            >
              <div
                className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
              <div className="relative flex items-center justify-between">
                <span className="text-sm font-medium">{opt.text}</span>
                <span className="text-sm text-muted-foreground">{percent}%</span>
              </div>
              {voted && <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-muted-foreground text-center">
        {totalVotes} vote{totalVotes !== 1 ? 's' : ''} · {hasVoted ? 'You voted' : 'Click to vote'}
      </p>
    </motion.div>
  );
}

import { Check } from 'lucide-react';
