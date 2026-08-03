'use client';

import { useState, useCallback } from 'react';
import { Loader2, X, MessageCircle, Video } from 'lucide-react';
import { api } from '@/lib/api';
import { useChatStore } from '@/hooks/useChatStore';

const AVAILABLE_INTERESTS = [
  'gaming', 'music', 'tech', 'movies', 'sports',
  'books', 'travel', 'cooking', 'art', 'science', 'politics', 'memes',
];

export default function MatchingScreen({
  onMatchFound,
  onCancel,
  onModeSelect,
}: {
  onMatchFound: (data: any) => void;
  onCancel: () => void;
  onModeSelect: (mode: 'text' | 'video') => void;
}) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [chatMode, setChatMode] = useState<'text' | 'video'>('text');
  const [status, setStatus] = useState<'idle' | 'searching' | 'found' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { setRoom } = useChatStore();

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 5
        ? [...prev, interest]
        : prev
    );
  };

  const handleStart = useCallback(async () => {
    setStatus('searching');
    setError(null);
    onModeSelect(chatMode);

    try {
      const res = await api.post('/match/find', {
        interests: selectedInterests,
        mode: chatMode,
      });
      const data = await res.json();

      if (data.status === 'matched') {
        setRoom(
          data.roomId,
          data.partnerId,
          'Stranger',
          chatMode,
          data.roomId,
          selectedInterests
        );
        setStatus('found');
        onMatchFound(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find match');
      setStatus('error');
    }
  }, [chatMode, selectedInterests, onMatchFound, onModeSelect, setRoom]);

  if (status === 'searching') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="relative mx-auto h-32 w-32">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-900" />
            <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold">Finding a match...</h2>
            <p className="mt-2 text-gray-400">Searching for someone with similar interests</p>
          </div>

          <div className="rounded-lg bg-gray-900 p-4 border border-gray-800">
            <p className="text-sm text-yellow-400">
              Tip: Never share personal info. Report suspicious behavior instantly.
            </p>
          </div>

          <button
            onClick={() => {
              api.delete('/match/cancel');
              setStatus('idle');
              onCancel();
            }}
            className="w-full rounded-lg border border-red-700 bg-red-900/20 py-3 text-red-400 hover:bg-red-900/30 transition"
          >
            Cancel Search
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-6">
        <h2 className="text-2xl font-bold text-center">Find a Match</h2>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setChatMode('text')}
            className={`flex items-center justify-center gap-2 rounded-lg border py-3 transition ${
              chatMode === 'text'
                ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                : 'border-gray-700 bg-gray-900 text-gray-400'
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            Text Chat
          </button>
          <button
            onClick={() => setChatMode('video')}
            className={`flex items-center justify-center gap-2 rounded-lg border py-3 transition ${
              chatMode === 'video'
                ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                : 'border-gray-700 bg-gray-900 text-gray-400'
            }`}
          >
            <Video className="h-5 w-5" />
            Video Chat
          </button>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-3">Select interests (max 5):</p>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`rounded-full px-4 py-2 text-sm transition ${
                  selectedInterests.includes(interest)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                #{interest}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-900/20 border border-red-800 p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleStart}
          className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white hover:bg-indigo-700 transition"
        >
          Start Matching
        </button>

        <button
          onClick={onCancel}
          className="w-full rounded-lg border border-gray-700 bg-gray-900 py-3 text-gray-400 hover:bg-gray-800 transition"
        >
          Back
        </button>
      </div>
    </div>
  );
}
