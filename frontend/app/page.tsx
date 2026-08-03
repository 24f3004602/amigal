'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useChatStore } from '@/hooks/useChatStore';
import AuthScreen from '@/components/AuthScreen';
import LandingScreen from '@/components/LandingScreen';
import MatchingScreen from '@/components/MatchingScreen';
import ChatScreen from '@/components/ChatScreen';
import PostChatScreen from '@/components/PostChatScreen';

type Screen = 'landing' | 'auth' | 'matching' | 'chat' | 'post-chat';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [user, setUser] = useState<any>(null);
  const { reset, setRoom } = useChatStore();

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => setUser(null));
  }, []);

  const handleAuthSuccess = (u: any) => {
    setUser(u);
    setScreen('matching');
  };

  const handleMatchFound = (data: any) => {
    setRoom(
      data.roomId,
      data.partnerId,
      'Stranger',
      mode,
      data.roomId,
      data.interests || []
    );
    setScreen('chat');
  };

  const [mode, setMode] = useState<'text' | 'video'>('text');

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {screen === 'landing' && (
        <LandingScreen onStart={() => setScreen(user ? 'matching' : 'auth')} user={user} />
      )}
      {screen === 'auth' && <AuthScreen onSuccess={handleAuthSuccess} />}
      {screen === 'matching' && (
        <MatchingScreen
          onMatchFound={handleMatchFound}
          onCancel={() => setScreen('landing')}
          onModeSelect={setMode}
        />
      )}
      {screen === 'chat' && <ChatScreen onEnd={() => setScreen('post-chat')} />}
      {screen === 'post-chat' && (
        <PostChatScreen
          onFindNew={() => {
            reset();
            setScreen('matching');
          }}
          onGoHome={() => {
            reset();
            setScreen('landing');
          }}
        />
      )}
    </main>
  );
}
