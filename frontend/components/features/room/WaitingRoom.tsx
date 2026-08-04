'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useRoomStore } from '@/stores/room.store';
import { useAuth } from '@/hooks/useAuth';
import { Shield, Clock, Users, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WaitingRoom() {
  const { user } = useAuth();
  const {
    status,
    isLocked,
    waitingUsers,
    participants,
    removeFromWaiting,
    addParticipant,
    setStatus,
  } = useRoomStore();

  const isHost = participants.find((p) => p.id === user?.id)?.role === 'host';

  if (status !== 'waiting') return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
    >
      <div className="glass-strong w-full max-w-lg rounded-2xl p-8 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Clock className="h-8 w-8 text-primary animate-pulse" />
        </div>

        <div>
          <h2 className="text-2xl font-bold">Waiting Room</h2>
          <p className="mt-2 text-muted-foreground">
            {isHost
              ? `You are the host. ${waitingUsers.length} user(s) waiting to join.`
              : 'The host will let you in shortly.'}
          </p>
        </div>

        {isHost && waitingUsers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-left">
              <Users className="h-4 w-4" />
              <span>Waiting ({waitingUsers.length})</span>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
              {waitingUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded-xl bg-muted/50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar fallback={u.name} size="sm" />
                    <span className="text-sm font-medium">{u.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => {
                        removeFromWaiting(u.id);
                        addParticipant({ ...u, role: 'participant' });
                      }}
                    >
                      <Check className="h-3.5 w-3.5" /> Admit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8"
                      onClick={() => removeFromWaiting(u.id)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isHost && (
          <div className="flex items-center justify-center gap-4 pt-2">
            <Button
              onClick={() => {
                waitingUsers.forEach((u) => addParticipant({ ...u, role: 'participant' }));
                useRoomStore.setState({ waitingUsers: [] });
                setStatus('active');
              }}
            >
              Admit All & Start
            </Button>
            <Button variant="secondary" onClick={() => setStatus('active')}>
              Start Without Others
            </Button>
          </div>
        )}

        {!isHost && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>This meeting is locked by the host</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
