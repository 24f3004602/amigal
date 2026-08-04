'use client';

import { Button } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { Badge } from '@/components/ui/Badge';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MonitorX,
  PhoneOff,
  MessageSquare,
  Settings,
  Hand,
  BarChart3,
  Paintbrush,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface RoomControlsProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  onToggleMute: () => void;
  onToggleVideo: () => void;
  onShareScreen: () => void;
  onToggleChat: () => void;
  onEndCall: () => void;
  onOpenDevices: () => void;
  onTogglePoll: () => void;
  onToggleWhiteboard: () => void;
  chatUnread?: number;
  participantCount?: number;
}

export function RoomControls({
  isMuted,
  isVideoOff,
  isScreenSharing,
  onToggleMute,
  onToggleVideo,
  onShareScreen,
  onToggleChat,
  onEndCall,
  onOpenDevices,
  onTogglePoll,
  onToggleWhiteboard,
  chatUnread = 0,
}: RoomControlsProps) {
  const [raisedHand, setRaisedHand] = useState(false);

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3 p-4 border-t border-border bg-background/80 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-2 rounded-2xl glass px-4 py-2">
        <Tooltip content={isMuted ? 'Unmute (M)' : 'Mute (M)'}>
          <Button
            variant={isMuted ? 'destructive' : 'ghost'}
            size="icon"
            onClick={onToggleMute}
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
            className={cn('rounded-full', !isVideoOff && 'hover:bg-muted')}
          >
            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </Button>
        </Tooltip>

        <Tooltip content={isScreenSharing ? 'Stop sharing' : 'Share screen'}>
          <Button
            variant={isScreenSharing ? 'secondary' : 'ghost'}
            size="icon"
            onClick={onShareScreen}
            className="rounded-full"
          >
            {isScreenSharing ? <MonitorX className="h-5 w-5" /> : <MonitorUp className="h-5 w-5" />}
          </Button>
        </Tooltip>

        <div className="h-6 w-px bg-border mx-1" />

        <Tooltip content="Raise hand">
          <Button
            variant={raisedHand ? 'secondary' : 'ghost'}
            size="icon"
            onClick={() => setRaisedHand(!raisedHand)}
            className="rounded-full"
          >
            <Hand className={cn('h-5 w-5', raisedHand && 'text-warning')} />
          </Button>
        </Tooltip>

        <Tooltip content="Create poll">
          <Button variant="ghost" size="icon" onClick={onTogglePoll} className="rounded-full">
            <BarChart3 className="h-5 w-5" />
          </Button>
        </Tooltip>

        <Tooltip content="Whiteboard">
          <Button variant="ghost" size="icon" onClick={onToggleWhiteboard} className="rounded-full">
            <Paintbrush className="h-5 w-5" />
          </Button>
        </Tooltip>

        <Tooltip content="Device settings">
          <Button variant="ghost" size="icon" onClick={onOpenDevices} className="rounded-full">
            <Settings className="h-5 w-5" />
          </Button>
        </Tooltip>

        <Tooltip content="Chat">
          <Button variant="ghost" size="icon" onClick={onToggleChat} className="relative rounded-full">
            <MessageSquare className="h-5 w-5" />
            {chatUnread > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {chatUnread}
              </Badge>
            )}
          </Button>
        </Tooltip>
      </div>

      <Button
        variant="destructive"
        size="icon"
        className="rounded-full h-12 w-12 shadow-lg hover:shadow-destructive/30 hover:scale-105 transition-all"
        onClick={onEndCall}
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
