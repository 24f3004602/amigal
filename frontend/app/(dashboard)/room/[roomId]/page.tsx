'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { useRoomStore } from '@/stores/room.store';
import { useAuth } from '@/hooks/useAuth';
import { VideoGrid } from '@/components/features/room/VideoGrid';
import { ChatPanel } from '@/components/features/room/ChatPanel';
import { RoomControls } from '@/components/features/room/RoomControls';
import { ConnectionBadge } from '@/components/features/room/ConnectionBadge';
import { DeviceSelector } from '@/components/features/room/DeviceSelector';
import { WaitingRoom } from '@/components/features/room/WaitingRoom';
import { HostControls } from '@/components/features/room/HostControls';
import { LiveReactions } from '@/components/features/room/LiveReactions';
import { PollDisplay } from '@/components/features/room/PollDisplay';
import { PollCreator } from '@/components/features/room/PollCreator';
import { Whiteboard } from '@/components/features/room/Whiteboard';
import { useToast } from '@/components/ui/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, BarChart3, Paintbrush } from 'lucide-react';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const socket = useSocket();
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    status,
    mode,
    participants,
    isRecording,
    layout,
    spotlightUserId,
    setRoom,
    addParticipant,
    setStatus,
    setSpotlight,
  } = useRoomStore();

  const [showChat, setShowChat] = useState(mode === 'text');
  const [showDevices, setShowDevices] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  const {
    selectedCamera,
    selectedMicrophone,
  } = useMediaDevices();

  const {
    localStream,
    remoteStream,
    connectionState,
    quality,
    isMuted,
    isVideoOff,
    isScreenSharing,
    turnLoading,
    setupPeerConnection,
    toggleMute,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    switchCamera,
    switchMicrophone,
    endCall,
  } = useWebRTC(roomId, mode, socket, {
    video: selectedCamera,
    audio: selectedMicrophone,
  });

  useEffect(() => {
    setRoom(roomId, mode);
    setStatus('waiting');

    if (!socket || !roomId) return;
    socket.emit('join-room', { roomId });

    // Simulate host joining first
    setTimeout(() => {
      setStatus('active');
    }, 1500);

    setupPeerConnection(true);

    socket.on('call-ended', () => {
      toast.info('The call has ended');
      endCall();
      router.push('/match');
    });

    return () => {
      socket.off('call-ended');
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

  // ==================== TURN LOADING STATE ====================
  if (turnLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
          <p className="text-sm text-muted-foreground">Initializing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Recording indicator */}
      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ y: -40 }}
            animate={{ y: 0 }}
            exit={{ y: -40 }}
            className="flex h-8 items-center justify-center gap-2 bg-destructive/90 text-destructive-foreground text-xs font-medium"
          >
            <Radio className="h-3 w-3 animate-pulse" />
            Recording in progress
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex h-14 items-center justify-between border-b border-border px-4 glass shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold">Room: {roomId.slice(0, 8)}</h1>
          <ConnectionBadge quality={quality} />
          {participants.length > 0 && (
            <span className="text-xs text-muted-foreground">{participants.length} participants</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPollCreator(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Create poll"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowWhiteboard(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Open whiteboard"
          >
            <Paintbrush className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="relative flex flex-1 overflow-hidden">
        <HostControls />
        <LiveReactions />

        {/* Waiting Room Overlay */}
        <WaitingRoom />

        {/* Poll Display */}
        <PollDisplay />

        {/* Poll Creator Modal */}
        <AnimatePresence>
          {showPollCreator && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <PollCreator onClose={() => setShowPollCreator(false)} />
            </div>
          )}
        </AnimatePresence>

        {/* Whiteboard */}
        <AnimatePresence>
          {showWhiteboard && <Whiteboard onClose={() => setShowWhiteboard(false)} />}
        </AnimatePresence>

        {/* Video Area */}
        <div className="relative flex-1 p-4">
          <VideoGrid
            localStream={localStream}
            remoteStream={remoteStream}
            connectionState={connectionState}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            layout={layout}
            spotlightUserId={spotlightUserId}
          />
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
        onTogglePoll={() => setShowPollCreator(true)}
        onToggleWhiteboard={() => setShowWhiteboard(true)}
      />

      <DeviceSelector
        open={showDevices}
        onClose={() => setShowDevices(false)}
        onApply={handleDeviceApply}
      />
    </div>
  );
}
