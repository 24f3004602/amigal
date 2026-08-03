'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useChatStore } from '@/hooks/useChatStore';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { api } from '@/lib/api';
import { censorText } from '@/lib/utils';
import { Send, Mic, MicOff, Video, VideoOff, PhoneOff, Flag } from 'lucide-react';

export default function ChatScreen({ onEnd }: { onEnd: () => void }) {
  const { roomId, partnerName, mode, messages, isTyping, startTime } = useChatStore();
  const [inputText, setInputText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useSocket();

  const {
    localStream,
    remoteStream,
    connectionState,
    setupPeerConnection,
    sendMessage,
    sendTyping,
    toggleMute,
    toggleVideo,
    endCall,
  } = useWebRTC(roomId!, mode, socketRef.current);

  useEffect(() => {
    if (!socketRef.current || !roomId) return;

    socketRef.current.emit('join-room', { roomId });

    socketRef.current.on('match-found', (data: any) => {
      setupPeerConnection(false);
    });

    socketRef.current.on('chat-message', (msg: any) => {
      // handled by WebRTC data channel for P2P, or fallback here
    });

    return () => {
      socketRef.current?.off('match-found');
      socketRef.current?.off('chat-message');
    };
  }, [roomId, socketRef, setupPeerConnection]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (startTime) setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = useCallback(() => {
    if (!inputText.trim()) return;
    const text = censorText(inputText.trim());
    sendMessage(text);
    setInputText('');
  }, [inputText, sendMessage]);

  const handleEnd = useCallback(async () => {
    endCall();
    if (roomId) {
      await api.post(`/sessions/${roomId}/end`, {});
    }
    onEnd();
  }, [endCall, roomId, onEnd]);

  const handleReport = useCallback(async () => {
    if (!reportReason || !roomId) return;
    await api.post('/reports', {
      sessionId: roomId,
      reason: reportReason,
      chatLog: JSON.stringify(messages),
    });
    setShowReport(false);
    handleEnd();
  }, [reportReason, roomId, messages, handleEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!roomId) return null;

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
        <div>
          <h3 className="font-semibold">{partnerName || 'Stranger'}</h3>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatTime(elapsed)}</span>
            <span className="text-indigo-400">
              {connectionState === 'connected' ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReport(true)}
            className="rounded-lg p-2 text-red-400 hover:bg-red-900/20"
          >
            <Flag className="h-5 w-5" />
          </button>
          <button
            onClick={handleEnd}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            <PhoneOff className="h-4 w-4 inline mr-1" />
            End
          </button>
        </div>
      </div>

      {mode === 'video' && (
        <div className="relative flex-1 bg-gray-900">
          <video
            autoPlay
            playsInline
            ref={(el) => {
              if (el && remoteStream) el.srcObject = remoteStream;
            }}
            className="h-full w-full object-cover"
          />
          <div className="absolute top-4 right-4 h-32 w-24 rounded-lg overflow-hidden border-2 border-gray-700 bg-gray-800">
            <video
              autoPlay
              playsInline
              muted
              ref={(el) => {
                if (el && localStream) el.srcObject = localStream;
              }}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${mode === 'video' ? 'max-h-48' : ''}`}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                msg.sender === 'me' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && <div className="text-sm text-gray-500">Stranger is typing...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-2">
          {mode === 'video' && (
            <>
              <button onClick={toggleMute} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800">
                <Mic className="h-5 w-5" />
              </button>
              <button onClick={toggleVideo} className="rounded-lg p-2 text-gray-400 hover:bg-gray-800">
                <Video className="h-5 w-5" />
              </button>
            </>
          )}
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              sendTyping(e.target.value.length > 0);
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSend}
            className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-700"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-gray-900 p-6 border border-gray-800">
            <h3 className="text-lg font-bold mb-4">Report User</h3>
            <div className="space-y-2 mb-4">
              {['harassment', 'spam', 'inappropriate', 'other'].map((reason) => (
                <button
                  key={reason}
                  onClick={() => setReportReason(reason)}
                  className={`w-full rounded-lg border px-4 py-2 text-left transition ${
                    reportReason === reason
                      ? 'border-indigo-500 bg-indigo-900/30 text-indigo-300'
                      : 'border-gray-700 bg-gray-800 text-gray-300'
                  }`}
                >
                  {reason.charAt(0).toUpperCase() + reason.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowReport(false)}
                className="flex-1 rounded-lg border border-gray-700 py-2 text-gray-400 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                className="flex-1 rounded-lg bg-red-600 py-2 text-white hover:bg-red-700"
              >
                Report & End
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
