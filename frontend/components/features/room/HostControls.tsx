'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useRoomStore } from '@/stores/room.store';
import { useAuth } from '@/hooks/useAuth';
import {
  Lock,
  Unlock,
  Radio,
  Square,
  UserPlus,
  LayoutGrid,
  LayoutList,
  Spotlight,
  Shield,
  MoreHorizontal,
  UserX,
  MicOff,
  VideoOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function HostControls() {
  const { user } = useAuth();
  const {
    participants,
    isLocked,
    isRecording,
    layout,
    toggleLock,
    toggleRecording,
    setLayout,
    updateParticipant,
  } = useRoomStore();

  const isHost = participants.find((p) => p.id === user?.id)?.role === 'host';
  const [showMore, setShowMore] = useState(false);

  if (!isHost) return null;

  const participantCount = participants.length;

  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-2xl glass px-3 py-2 shadow-xl"
    >
      <ControlButton
        active={isLocked}
        onClick={toggleLock}
        icon={isLocked ? Lock : Unlock}
        label={isLocked ? 'Locked' : 'Open'}
      />

      <ControlButton
        active={isRecording}
        onClick={toggleRecording}
        icon={isRecording ? Radio : Square}
        label={isRecording ? 'Recording' : 'Record'}
        className={isRecording ? 'text-destructive animate-pulse' : ''}
      />

      <div className="h-5 w-px bg-border mx-1" />

      <ControlButton
        active={layout === 'grid'}
        onClick={() => setLayout('grid')}
        icon={LayoutGrid}
        label="Grid"
      />
      <ControlButton
        active={layout === 'spotlight'}
        onClick={() => setLayout('spotlight')}
        icon={Spotlight}
        label="Spotlight"
      />
      <ControlButton
        active={layout === 'sidebar'}
        onClick={() => setLayout('sidebar')}
        icon={LayoutList}
        label="Sidebar"
      />

      <div className="h-5 w-px bg-border mx-1" />

      <div className="relative">
        <ControlButton
          active={showMore}
          onClick={() => setShowMore(!showMore)}
          icon={MoreHorizontal}
          label="More"
        />
        <AnimatePresence>
          {showMore && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl glass-strong border border-border shadow-2xl overflow-hidden"
            >
              <div className="p-1">
                <MoreItem
                  icon={MicOff}
                  label="Mute All"
                  onClick={() => participants.forEach((p) => updateParticipant(p.id, { isMuted: true }))}
                />
                <MoreItem
                  icon={VideoOff}
                  label="Stop All Videos"
                  onClick={() => participants.forEach((p) => updateParticipant(p.id, { isVideoOff: true }))}
                />
                <MoreItem
                  icon={UserX}
                  label="Remove All"
                  destructive
                  onClick={() => {
                    if (confirm('Remove all participants?')) {
                      participants.forEach((p) => {
                        if (p.id !== user?.id) updateParticipant(p.id, { role: 'viewer' });
                      });
                    }
                  }}
                />
                <MoreItem
                  icon={Shield}
                  label="End Meeting for All"
                  destructive
                  onClick={() => {
                    if (confirm('End meeting for everyone?')) {
                      useRoomStore.getState().setStatus('ended');
                    }
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ControlButton({
  active,
  onClick,
  icon: Icon,
  label,
  className,
}: {
  active: boolean;
  onClick: () => void;
  icon: any;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-1.5 transition-colors min-w-[52px]',
        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function MoreItem({
  icon: Icon,
  label,
  onClick,
  destructive,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'text-foreground hover:bg-muted'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
