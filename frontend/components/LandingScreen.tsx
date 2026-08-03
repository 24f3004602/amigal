'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Video, Shield, Zap, ChevronRight, Sparkles } from 'lucide-react';

interface Props {
  onStart: () => void;
  user: any;
}

export default function LandingScreen({ onStart, user }: Props) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Animated gradient orbs */}
      <div 
        className="pointer-events-none fixed w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] animate-pulse-glow transition-transform duration-700"
        style={{ 
          background: 'radial-gradient(circle, rgba(0,240,255,0.3), transparent 70%)',
          left: mousePos.x - 300,
          top: mousePos.y - 300,
        }}
      />
      <div className="fixed top-0 left-0 w-full h-full grid-bg opacity-50" />
      
      {/* Floating orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-[100px] animate-float" />
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm text-cyan-300 mb-8 animate-float">
            <Sparkles className="w-4 h-4" />
            <span>Next-gen random chat</span>
          </div>

          {/* Main Title */}
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-6">
            <span className="text-gradient">AMIGAL</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/60 mb-4 font-light">
            Talk to strangers. Make friends. Stay anonymous.
          </p>
          <p className="text-white/40 mb-12 max-w-lg mx-auto">
            Interest-matched conversations with text and video. 
            Built for the future of human connection.
          </p>

          {/* CTA */}
          <button 
            onClick={onStart}
            className="btn-primary text-lg px-12 py-4 rounded-2xl inline-flex items-center gap-3 group"
          >
            {user ? 'Start Matching' : 'Get Started'}
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          {user && (
            <p className="mt-4 text-white/40 text-sm">
              Welcome back, <span className="text-cyan-400">{user.displayName || user.email}</span>
            </p>
          )}

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-3xl mx-auto">
            {[
              { icon: MessageCircle, title: 'Text Chat', desc: 'Instant text conversations with strangers worldwide' },
              { icon: Video, title: 'Video Calls', desc: 'Face-to-face video with WebRTC peer-to-peer security' },
              { icon: Shield, title: 'Safe & Moderated', desc: 'AI-powered moderation and reputation system' },
            ].map((feature, i) => (
              <div key={i} className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-500 group">
                <feature.icon className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/50">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-white/20 text-sm">
          © 2026 Amigal. Built for curious minds.
        </div>
      </div>
    </div>
  );
}
