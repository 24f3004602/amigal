'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Video, Shield, Users } from 'lucide-react';

const INTERESTS = ['gaming', 'music', 'tech', 'movies', 'sports', 'books', 'travel', 'art'];

export default function LandingScreen({
  onStart,
  user,
}: {
  onStart: () => void;
  user: any;
}) {
  const [onlineCount, setOnlineCount] = useState(0);

  useEffect(() => {
    setOnlineCount(Math.floor(Math.random() * 500) + 100);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="mx-auto h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center">
          <MessageCircle className="h-12 w-12 text-white" />
        </div>

        <div>
          <h1 className="text-4xl font-bold">Amigal</h1>
          <p className="mt-2 text-gray-400">Connect with strangers. Safe. Anonymous. Real-time.</p>
        </div>

        <div className="flex justify-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-indigo-400">
            <Users className="h-4 w-4" />
            <span>{onlineCount.toLocaleString()} online now</span>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <Shield className="h-4 w-4" />
            <span>Text-first safety</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          {INTERESTS.map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-indigo-700 bg-indigo-900/30 px-4 py-1.5 text-sm text-indigo-300"
            >
              #{interest}
            </span>
          ))}
        </div>

        <button
          onClick={onStart}
          className="w-full rounded-xl bg-indigo-600 py-4 text-lg font-semibold text-white hover:bg-indigo-700 transition"
        >
          {user ? 'Start Chatting' : 'Get Started'}
        </button>

        <div className="grid grid-cols-2 gap-4 text-left">
          <div className="rounded-lg bg-gray-900 p-4 border border-gray-800">
            <MessageCircle className="h-6 w-6 text-indigo-400 mb-2" />
            <h3 className="font-semibold">Text Chat</h3>
            <p className="text-sm text-gray-400">Unlimited free conversations</p>
          </div>
          <div className="rounded-lg bg-gray-900 p-4 border border-gray-800">
            <Video className="h-6 w-6 text-indigo-400 mb-2" />
            <h3 className="font-semibold">Video Chat</h3>
            <p className="text-sm text-gray-400">5 free sessions, then subscribe</p>
          </div>
        </div>

        <p className="text-xs text-gray-500">
          By using this service, you agree to our Terms of Service and Community Guidelines.
        </p>
      </div>
    </div>
  );
}
