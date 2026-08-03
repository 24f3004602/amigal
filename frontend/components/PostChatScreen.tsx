'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { ThumbsUp, ThumbsDown, Flag, RotateCcw, Home, Star, MessageSquare } from 'lucide-react';

interface Props {
  onNewChat: () => void;
  onGoHome: () => void;
}

const REPORT_REASONS = ['Inappropriate behavior', 'Spam', 'Harassment', 'Underage', 'Other'];

export default function PostChatScreen({ onNewChat, onGoHome }: Props) {
  const [rating, setRating] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    // In real app, send rating to backend
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-black px-4">
      <div className="fixed top-0 left-0 w-full h-full grid-bg opacity-50" />
      <div className="fixed top-20 right-20 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] animate-float" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-strong rounded-3xl p-8 text-center glow-cyan">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-3xl font-bold text-gradient mb-2">Chat Ended</h2>
          <p className="text-white/50 mb-8">How was your conversation?</p>

          {/* Rating */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`transition-all duration-300 hover:scale-110 ${star <= rating ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'text-white/20'}`}
              >
                <Star className="w-8 h-8 fill-current" />
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button onClick={onNewChat} className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Find New Match
            </button>
            
            <button onClick={onGoHome} className="w-full btn-secondary py-3.5 rounded-xl flex items-center justify-center gap-2">
              <Home className="w-5 h-5" />
              Go Home
            </button>

            {!reportOpen ? (
              <button 
                onClick={() => setReportOpen(true)} 
                className="w-full py-3 text-red-400/60 hover:text-red-400 text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Flag className="w-4 h-4" />
                Report User
              </button>
            ) : (
              <div className="glass rounded-xl p-4 border border-red-500/20">
                <p className="text-sm text-white/60 mb-3">Why are you reporting?</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setReportReason(reason)}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                        reportReason === reason
                          ? 'bg-red-500/20 border border-red-500/40 text-red-300'
                          : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setReportOpen(false); setReportReason(''); }}
                  className="text-xs text-white/30 hover:text-white/60"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {submitted && (
            <p className="mt-4 text-sm text-green-400 animate-pulse">Thanks for your feedback!</p>
          )}
        </div>
      </div>
    </div>
  );
}
