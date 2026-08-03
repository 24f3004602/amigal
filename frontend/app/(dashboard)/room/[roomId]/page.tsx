'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { AppShell } from '@/components/layout/AppShell';
import { VideoGrid } from '@/components/features/room/VideoGrid';
import { ChatPanel } from '@/components/features/room/ChatPanel';
import { RoomControls } from '@/components/features/room/RoomControls';
import { ConnectionBadge } from '@/components/features/room/ConnectionBadge';
import { DeviceSelector } from '@/components/features/room/DeviceSelector';
import { useToast } from '@/components/ui/Toast';
import { useRoomStore } from '@/stores/room.store';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const socket = useSocket();
  const { toast } = useToast();
  const { mode } = useRoomStore();
  const [showChat, setShowChat] = useState(mode === 'text');
  const [showDevices, setShowDevices] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const videoContainerRef = useRef<HTMLDivElement>(null);

  const {
    selectedCamera,
    selectedMicrophone,
  } = useMediaDevices();

  const {
    localStream,
    remoteStream,
    connectionState,
    iceConnectionState,
    quality,
    isMuted,
    isVideoOff,
    isScreenSharing,
    setupPeerConnection,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    switchCamera,
    switchMicrophone,
    togglePictureInPicture,
    endCall,
  } = useWebRTC(roomId, mode, socket, {
    video: selectedCamera,
    audio: selectedMicrophone,
  });

  useEffect(() => {
    if (!socket || !roomId) return;

    socket.emit('join-room', { roomId });
    setupPeerConnection(true);

    socket.on('call-ended', () => {
      toast.info('The call has ended');
      endCall();
      router.push('/match');
    });

    socket.on('error', (err: any) => {
      toast.error(err.message || 'Connection error');
    });

    return () => {
      socket.off('call-ended');
      socket.off('error');
      endCall();
    };
  }, [socket, roomId]);

  const handleToggleChat = () => {
    setShowChat(!showChat);
    if (!showChat) setChatUnread(0);
  };

  const handleNewMessage = () => {
    if (!showChat) setChatUnread((p) => p + 1);
  };

  const handleDeviceApply = (devices: { video: string; audio: string; speaker: string }) => {
    if (devices.video !== selectedCamera) switchCamera(devices.video);
    if (devices.audio !== selectedMicrophone) switchMicrophone(devices.audio);
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 glass">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Room: {roomId.slice(0, 8)}</h1>
          <ConnectionBadge quality={quality} />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {quality.bitrate > 0 && <span>{quality.bitrate} kbps</span>}
          {quality.fps > 0 && <span>· {quality.fps} fps</span>}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Video Area */}
        <div ref={videoContainerRef} className="relative flex-1 p-4">
          <VideoGrid
            localStream={localStream}
            remoteStream={remoteStream}
            connectionState={connectionState}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
          />

          {/* Floating device selector trigger */}
          <button
            onClick={() => setShowDevices(true)}
            className="absolute top-6 right-6 rounded-full glass px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            ⚙ Devices
          </button>
        </div>

        {/* Chat Sidebar */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="border-l border-border overflow-hidden"
            >
              <ChatPanel roomId={roomId} onNewMessage={handleNewMessage} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <RoomControls
        isMuted={isMuted}
        isVideoOff={isVideoOff}
        isScreenSharing={isScreenSharing}
        onToggleMute={toggleMute}
        onToggleVideo={toggleVideo}
        onShareScreen={isScreenSharing ? stopScreenShare : startScreenShare}
        onToggleChat={handleToggleChat}
        onEndCall={() => {
          socket?.emit('end-call', { roomId });
          endCall();
          router.push('/match');
        }}
        chatUnread={chatUnread}
        onOpenDevices={() => setShowDevices(true)}
      />

      {/* Modals */}
      <DeviceSelector
        open={showDevices}
        onClose={() => setShowDevices(false)}
        onApply={handleDeviceApply}
      />
    </div>
  );
}
