'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { MicOff, VideoOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoGridProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  connectionState: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  remoteMuted?: boolean;
  remoteVideoOff?: boolean;
  layout?: 'grid' | 'spotlight' | 'sidebar';
  spotlightUserId?: string | null;
}

export function VideoGrid({
  localStream,
  remoteStream,
  connectionState,
  isMuted = false,
  isVideoOff = false,
  remoteMuted = false,
  remoteVideoOff = false,
  layout = 'grid',
  spotlightUserId = null,
}: VideoGridProps) {
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const [pinned, setPinned] = useState<'local' | 'remote'>('remote');

  // This is a 1:1 view, so `layout` collapses onto which feed is full-bleed:
  // spotlight follows spotlightUserId, other layouts fall back to manual pinning.
  useEffect(() => {
    if (layout === 'spotlight' && spotlightUserId) {
      setPinned(spotlightUserId === 'local' ? 'local' : 'remote');
    }
  }, [layout, spotlightUserId]);

  useEffect(() => {
    if (localRef.current && localStream) localRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const isConnecting = connectionState === 'connecting' || connectionState === 'new';

  return (
    <div className="relative flex h-full w-full items-center justify-center rounded-2xl bg-muted/30 overflow-hidden">
      {/* Remote / Main Video */}
      <motion.div
        layout
        className={cn(
          'relative overflow-hidden rounded-2xl bg-black transition-all duration-500',
          pinned === 'remote' ? 'h-full w-full' : 'absolute bottom-4 right-4 h-32 w-48 sm:h-48 sm:w-72 z-10 border-2 border-background shadow-2xl'
        )}
        onClick={() => setPinned('remote')}
      >
        {remoteStream && !remoteVideoOff ? (
          <video ref={remoteRef} autoPlay playsInline className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-muted to-background">
            <Avatar fallback="Partner" size="xl" />
            <p className="text-sm text-muted-foreground">
              {isConnecting ? 'Connecting...' : remoteVideoOff ? 'Camera off' : 'Waiting...'}
            </p>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-md border-0">
            Partner
          </Badge>
          {remoteMuted && <MicOff className="h-4 w-4 text-destructive" />}
        </div>
        {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          </div>
        )}
      </motion.div>

      {/* Local / PIP Video */}
      <motion.div
        layout
        className={cn(
          'relative overflow-hidden rounded-2xl bg-black transition-all duration-500 cursor-pointer',
          pinned === 'local' ? 'h-full w-full' : 'absolute bottom-4 right-4 h-32 w-48 sm:h-48 sm:w-72 z-10 border-2 border-background shadow-2xl'
        )}
        onClick={() => setPinned('local')}
      >
        {localStream && !isVideoOff ? (
          <video ref={localRef} autoPlay playsInline muted className="h-full w-full object-cover mirror" />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-muted to-background">
            <Avatar fallback="You" size="lg" />
            <p className="text-xs text-muted-foreground">Camera off</p>
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-md border-0">
            You
          </Badge>
          {isMuted && <MicOff className="h-4 w-4 text-destructive" />}
        </div>
      </motion.div>
    </div>
  );
}
