'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useChatStore } from '@/hooks/useChatStore';
import { MessageSquare, Video, MapPin, X, Radio, Sparkles } from 'lucide-react';

interface Props {
  onMatchFound: (data: any) => void;
  onCancel: () => void;
  onModeSelect: (mode: 'text' | 'video') => void;
}

const INTERESTS = ['Music', 'Gaming', 'Movies', 'Tech', 'Art', 'Sports', 'Books', 'Travel', 'Food', 'Anime', 'Coding', 'Fitness'];

export default function MatchingScreen({ onMatchFound, onCancel, onModeSelect }: Props) {
  const [mode, setMode] = useState<'text' | 'video'>('text');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searching, setSearching] = useState(false);
  const [dots, setDots] = useState('');
  const { reset } = useChatStore();

  useEffect(() => {
    reset();
  }, [reset]);

  useEffect(() => {
    if (!searching) return;
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [searching]);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest].slice(0, 5)
    );
  };

  const startMatching = useCallback(async () => {
    setSearching(true);
    onModeSelect(mode);

    try {
      const res = await api.post('/matching/find', {
        mode,
        interests: selectedInterests,
      });
      const data = await res.json();

      if (data.status === 'matched') {
        onMatchFound(data);
      } else {
        // Poll for match
        const checkInterval = setInterval(async () => {
          const checkRes = await api.post('/matching/find', { mode, interests: selectedInterests });
          const checkData = await checkRes.json();
          if (checkData.status === 'matched') {
            clearInterval(checkInterval);
            onMatchFound(checkData);
          }
        }, 2000);

        // Cleanup after 30s if no match
        setTimeout(() => {
          clearInterval(checkInterval);
          setSearching(false);
        }, 30000);
      }
    } catch (err) {
      setSearching(false);
    }
  }, [mode, selectedInterests, onMatchFound, onModeSelect]);

  const handleCancel = async () => {
    await api.post('/matching/cancel', {});
    setSearching(false);
    onCancel();
  };

  if (searching) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-black overflow-hidden">
        <div className="fixed top-0 left-0 w-full h-full grid-bg opacity-50" />
        
        {/* Radar animation */}
        <div className="relative mb-12">
          <div className="w-48 h-48 rounded-full border border-cyan-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 w-48 h-48 rounded-full border border-purple-500/20 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
          <div className="absolute inset-4 w-40 h-40 rounded-full border-2 border-cyan-400/30 flex items-center justify-center">
            <Radio className="w-12 h-12 text-cyan-400 animate-pulse" />
          </div>
          <div className="absolute inset-0 w-48 h-48 rounded-full animate-spin-slow border-t border-cyan-400/50" />
        </div>

        <h2 className="text-3xl font-bold text-white mb-2">Finding your match{dots}</h2>
        <p className="text-white/50 mb-8">Scanning for someone with similar interests</p>

        {selectedInterests.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center max-w-md mb-8">
            {selectedInterests.map((i) => (
              <span key={i} className="px-3 py-1 rounded-full text-xs bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                {i}
              </span>
            ))}
          </div>
        )}

        <button onClick={handleCancel} className="btn-secondary flex items-center gap-2">
          <X className="w-4 h-4" />
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative bg-black px-4">
      <div className="fixed top-0 left-0 w-full h-full grid-bg opacity-50" />
      <div className="fixed top-20 left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] animate-float" />

      <div className="relative z-10 w-full max-w-lg">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gradient mb-3">Find a Match</h2>
          <p className="text-white/50">Choose how you want to connect</p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 p-6 rounded-2xl border transition-all duration-300 ${
              mode === 'text'
                ? 'bg-cyan-500/10 border-cyan-400/50 shadow-[0_0_30px_rgba(0,240,255,0.1)]'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <MessageSquare className={`w-8 h-8 mb-3 ${mode === 'text' ? 'text-cyan-400' : 'text-white/40'}`} />
            <h3 className="font-semibold text-white mb-1">Text Chat</h3>
            <p className="text-xs text-white/40">Classic anonymous messaging</p>
          </button>

          <button
            onClick={() => setMode('video')}
            className={`flex-1 p-6 rounded-2xl border transition-all duration-300 ${
              mode === 'video'
                ? 'bg-purple-500/10 border-purple-400/50 shadow-[0_0_30px_rgba(168,85,247,0.1)]'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <Video className={`w-8 h-8 mb-3 ${mode === 'video' ? 'text-purple-400' : 'text-white/40'}`} />
            <h3 className="font-semibold text-white mb-1">Video Call</h3>
            <p className="text-xs text-white/40">Face-to-face conversation</p>
          </button>
        </div>

        {/* Interests */}
        <div className="glass-strong rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white">Select Interests</h3>
            <span className="text-xs text-white/30 ml-auto">{selectedInterests.length}/5</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-4 py-2 rounded-xl text-sm transition-all duration-300 ${
                  selectedInterests.includes(interest)
                    ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium shadow-lg'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        <button onClick={startMatching} className="w-full btn-primary py-4 rounded-2xl text-lg font-bold">
          Start Matching
        </button>

        <button onClick={onCancel} className="w-full mt-4 text-white/30 hover:text-white/60 text-sm transition-colors">
          Go Back
        </button>
      </div>
    </div>
  );
}
