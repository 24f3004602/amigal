'use client';

import { Badge } from '@/components/ui/Badge';
import { Wifi, WifiOff, Activity, AlertTriangle } from 'lucide-react';
import type { ConnectionQuality } from '@/hooks/useWebRTC';
import { cn } from '@/lib/utils';

interface ConnectionBadgeProps {
  quality: ConnectionQuality;
}

export function ConnectionBadge({ quality }: ConnectionBadgeProps) {
  const { state, packetLoss, bitrate } = quality;

  let variant: 'default' | 'secondary' | 'destructive' | 'warning' | 'success' | 'info' = 'success';
  let icon = <Activity className="h-3 w-3" />;
  let label = 'Excellent';

  if (state === 'failed' || state === 'disconnected') {
    variant = 'destructive';
    icon = <WifiOff className="h-3 w-3" />;
    label = 'Disconnected';
  } else if (state === 'connecting') {
    variant = 'info';
    icon = <Wifi className="h-3 w-3 animate-pulse" />;
    label = 'Connecting...';
  } else if (packetLoss > 5) {
    variant = 'destructive';
    icon = <AlertTriangle className="h-3 w-3" />;
    label = 'Poor';
  } else if (packetLoss > 2 || bitrate < 500) {
    variant = 'warning';
    icon = <Activity className="h-3 w-3" />;
    label = 'Fair';
  }

  return (
    <Badge variant={variant} className="gap-1.5 text-[10px] font-medium backdrop-blur-md">
      {icon}
      {label}
      {quality.resolution && (
        <span className="opacity-70 ml-1">· {quality.resolution}</span>
      )}
    </Badge>
  );
}
