'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useRoomStore } from '@/stores/room.store';
import { VideoGrid } from '@/components/features/room/VideoGrid';
import { ChatPanel } from '@/components/features/room/ChatPanel';
import { RoomControls } from '@/components/features/room/RoomControls';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const socket = useSocket();
  const { localStream, remoteStream, connectionState, setupPeerConnection, endCall } = useWebRTC(roomId, socket);
  const { mode } = useRoomStore();

  useEffect(() => {
    if (!socket || !roomId) return;
    socket.emit('join-room', { roomId });
    setupPeerConnection(true);

    socket.on('call-ended', () => {
      endCall();
      router.push('/match');
    });

    return () => {
      socket.off('call-ended');
    };
  }, [socket, roomId]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 gap-4 overflow-hidden">
        <div className="flex-1">
          <VideoGrid
            localStream={localStream}
            remoteStream={remoteStream}
            connectionState={connectionState}
          />
        </div>
        {mode === 'text' && (
          <div className="w-80">
            <ChatPanel roomId={roomId} />
          </div>
        )}
      </div>
      <RoomControls onEndCall={() => {
        socket?.emit('end-call', { roomId });
        endCall();
        router.push('/match');
      }} />
    </div>
  );
}
