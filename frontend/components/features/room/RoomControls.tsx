'use client';

import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  PhoneOff,
  MessageSquare,
  Users,
  Settings,
  Hand,
  MoreHorizontal,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RoomControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
  participantCount?: number;
}

export function RoomControls({
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo,
  onShareScreen,
  onToggleChat,
  onEndCall,
  participantCount = 2,
}: RoomControlsProps) {
  const [raisedHand, setRaisedHand] = useState(false);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 p-4">
      <div className="flex items-center gap-2 rounded-2xl glass-strong px-4 py-2.5">
        <Tooltip content={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
          <Button
            variant={isMuted ? 'destructive' : 'ghost'}
            size="icon"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
            className={cn('rounded-full', !isMuted && 'hover:bg-muted')}
          >
            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        </Tooltip>

        <Tooltip content={isVideoOff ? 'Start video (V)' : 'Stop video (V)'}>
          <Button
            variant={isVideoOff ? 'destructive' : 'ghost'}
            size="icon"
            onClick={onToggleVideo}
            aria-label={isVideoOff ? 'Start camera' : 'Stop camera'}
            className={cn('rounded-full', !isVideoOff && 'hover:bg-muted')}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        </Tooltip>

        <Tooltip content="Share screen">
          <Button variant="ghost" size="icon" onClick={onShareScreen} aria-label="Share screen" className="rounded-full">
            <MonitorUp className="h-5 w-5" />
          </Button>
        </Tooltip>

        <div className="h-6 w-px bg-border mx-1" />

        <Tooltip content="Raise hand">
          <Button
            variant={raisedHand ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setRaisedHand(!raisedHand)}
            aria-label="Raise hand"
            className="rounded-full"
          >
            <Hand className={cn('h-5 w-5', raisedHand && 'text-warning')} />
          </Button>
        </Tooltip>

        <Tooltip content="Participants">
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Users className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {participantCount}
            </span>
          </Button>
        </Tooltip>

        <Tooltip content="Chat">
          <Button variant="ghost" size="icon" onClick={onToggleChat} aria-label="Open chat" className="rounded-full">
            <MessageSquare className="h-5 w-5" />
          </Button>
        </Tooltip>

        <Tooltip content="Settings">
          <Button variant="ghost" size="icon" aria-label="Settings" className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </Tooltip>
      </div>

      <Button
        variant="destructive"
        size="icon"
        className="rounded-full h-12 w-12 shadow-lg hover:shadow-destructive/30 hover:scale-105 transition-all"
        onClick={onEndCall}
        aria-label="End call"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
