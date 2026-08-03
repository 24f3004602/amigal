'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMatchmaking } from '@/hooks/useMatchmaking';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const PRESET_INTERESTS = ['Technology', 'Music', 'Gaming', 'Sports', 'Art', 'Science', 'Movies', 'Travel'];

export default function MatchPage() {
  const router = useRouter();
  const { status, startMatching, cancelMatching } = useMatchmaking();
  const [mode, setMode] = useState<'text' | 'video'>('text');
  const [interests, setInterests] = useState<string[]>([]);

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleStart = async () => {
    const result = await startMatching({ mode, interests });
    if (result?.roomId) {
      router.push(`/room/${result.roomId}`);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gradient">Find a Match</h1>
        <p className="mt-2 text-white/60">Select your interests and preferred mode</p>
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant={mode === 'text' ? 'primary' : 'secondary'}
          onClick={() => setMode('text')}
        >
          Text Chat
        </Button>
        <Button
          variant={mode === 'video' ? 'primary' : 'secondary'}
          onClick={() => setMode('video')}
        >
          Video Call
        </Button>
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-white/80">Interests</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_INTERESTS.map((interest) => (
            <Badge
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`cursor-pointer transition-all ${
                interests.includes(interest)
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                  : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10'
              }`}
            >
              {interest}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        {status === 'searching' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <p className="text-white/60">Finding someone with similar interests...</p>
            <Button variant="secondary" onClick={cancelMatching}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button className="btn-primary" onClick={handleStart} disabled={status === 'searching'}>
            Start Matching
          </Button>
        )}
      </div>
    </div>
  );
}
