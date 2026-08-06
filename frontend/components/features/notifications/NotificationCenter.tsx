'use client';

import * as React from 'react';
import { Bell, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AppNotification {
  id: string;
  title: string;
  body?: string;
  createdAt: string;
  read?: boolean;
}

interface NotificationCenterProps {
  onClose: () => void;
  notifications?: AppNotification[];
  onMarkAllRead?: () => void;
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const mins = Math.round((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function NotificationCenter({
  onClose,
  notifications = [],
  onMarkAllRead,
}: NotificationCenterProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Dismiss on outside click and Escape, so the popover behaves like the app's
  // other overlays.
  React.useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-semibold">
          Notifications
          {unread > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">{unread} unread</span>
          )}
        </p>
        <div className="flex items-center gap-1">
          {unread > 0 && onMarkAllRead && (
            <button
              type="button"
              onClick={onMarkAllRead}
              aria-label="Mark all as read"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Check className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={cn(
                  'border-b border-border/50 px-4 py-3 transition-colors last:border-0 hover:bg-muted/50',
                  !notification.read && 'bg-primary/5'
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{notification.title}</p>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {formatRelative(notification.createdAt)}
                  </span>
                </div>
                {notification.body && (
                  <p className="mt-1 text-xs text-muted-foreground">{notification.body}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
