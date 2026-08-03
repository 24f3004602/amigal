'use client';

import { useState } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { api } from '@/lib/api';
import { Star } from 'lucide-react';

export default function PostChatScreen({
  onFindNew,
  onGoHome,
}: {
  onFindNew: () => void;
  onGoHome: () => void;
}) {
  const { partnerName, sharedInterests, elapsed, sessionId } = useChatStore();
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const tags = ['Friendly', 'Funny', 'Interesting', 'Helpful', 'Respectful'];

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (!sessionId || rating === 0) return;
    await api.post(`/sessions/${sessionId}/rate`, { rating, tags: selectedTags });
    setSubmitted(true);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <h2 className="text-2xl font-bold">Chat Ended</h2>

        <div className="rounded-2xl bg-gray-900 p-6 border border-gray-800 space-y-4">
          <div>
            <h3 className="font-semibold text-lg">{partnerName || 'Stranger'}</h3>
            {sharedInterests.length > 0 && (
              <p className="text-sm text-indigo-400">
                Shared: {sharedInterests.map((i) => '#' + i).join(', ')}
              </p>
            )}
            <p className="text-sm text-gray-500">Duration: {formatDuration(elapsed || 0)}</p>
          </div>

          {!submitted ? (
            <>
              <div>
                <p className="text-sm text-gray-400 mb-2">How was your conversation?</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`transition ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
                    >
                      <Star className="h-8 w-8 fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">What made it great?</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`rounded-full px-4 py-1.5 text-sm transition ${
                        selectedTags.includes(tag)
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={rating === 0}
                className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Submit Rating
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-900/20 border border-green-800 p-4">
                <p className="text-green-400 font-semibold">Thanks for your feedback!</p>
              </div>
              <button
                onClick={onFindNew}
                className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
              >
                Find New Match
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onGoHome}
          className="text-gray-400 hover:text-white transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
