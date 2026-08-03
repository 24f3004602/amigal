'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Video, MessageSquare, Sparkles, Search, X, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const PRESETS = ['Design', 'Engineering', 'Marketing', 'Product', 'Startup', 'AI', 'Music', 'Gaming'];

export default function MatchPage() {
  const router = useRouter();
  const { status, startMatching, cancelMatching } = useMatchmaking();
  const { toast } = useToast();
  const [mode, setMode] = useState<'text' | 'video'>('video');
  const [interests, setInterests] = useState<string[]>([]);
  const [custom, setCustom] = useState('');
  const [password, setPassword] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    );
  };

  const addCustom = () => {
    if (custom.trim() && !interests.includes(custom.trim()) && interests.length < 5) {
      setInterests([...interests, custom.trim()]);
      setCustom('');
    }
  };

  const handleStart = async () => {
    const result = await startMatching({ mode, interests });
    if (result?.roomId) {
      router.push(`/room/${result.roomId}`);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-8 animate-fade-in">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Start a Meeting</h1>
          <p className="text-muted-foreground">Choose your mode and interests to find the perfect match.</p>
        </div>

        {/* Mode Selector */}
        <div className="flex justify-center gap-3">
          {[
            { id: 'video' as const, label: 'Video', icon: Video },
            { id: 'text' as const, label: 'Text', icon: MessageSquare },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                'flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-medium transition-all',
                mode === m.id
                  ? 'border-primary bg-primary/10 text-primary shadow-sm'
                  : 'border-border bg-transparent text-muted-foreground hover:bg-muted'
              )}
              aria-pressed={mode === m.id}
            >
              <m.icon className="h-4 w-4" />
              {m.label}
            </button>
          ))}
        </div>

        {/* Interests */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Interests <span className="text-muted-foreground">({interests.length}/5)</span></label>
            {interests.length > 0 && (
              <button onClick={() => setInterests([])} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Clear all
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <AnimatePresence>
              {interests.map((tag) => (
                <motion.div
                  key={tag}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Badge variant="default" className="cursor-pointer gap-1 pr-2" onClick={() => toggleInterest(tag)}>
                    {tag} <X className="h-3 w-3" />
                  </Badge>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add custom interest..."
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              className="flex-1"
            />
            <Button variant="secondary" onClick={addCustom} disabled={!custom.trim() || interests.length >= 5}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Badge
                key={p}
                variant={interests.includes(p) ? 'default' : 'ghost'}
                className="cursor-pointer transition-all"
                onClick={() => toggleInterest(p)}
              >
                {p}
              </Badge>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="glass-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', isPrivate ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {isPrivate ? <Lock className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">Private Room</p>
                <p className="text-xs text-muted-foreground">Require a password to join</p>
              </div>
            </div>
            <button
              onClick={() => setIsPrivate(!isPrivate)}
              className={cn(
                'relative h-6 w-11 rounded-full transition-colors',
                isPrivate ? 'bg-primary' : 'bg-muted'
              )}
              aria-pressed={isPrivate}
              aria-label="Toggle private room"
            >
              <span className={cn('absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform', isPrivate && 'translate-x-5')} />
            </button>
          </div>
          <AnimatePresence>
            {isPrivate && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Input
                  type="password"
                  placeholder="Set room password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action */}
        <div className="flex justify-center pt-4">
          {status === 'searching' ? (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-primary animate-pulse" />
              </div>
              <p className="text-muted-foreground animate-pulse">Finding someone with similar interests...</p>
              <Button variant="secondary" onClick={cancelMatching}>Cancel</Button>
            </div>
          ) : (
            <Button size="lg" className="gap-2 min-w-[200px]" onClick={handleStart}>
              <Sparkles className="h-4 w-4" /> Start Matching
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
