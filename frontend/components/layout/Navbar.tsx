'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NotificationCenter } from '@/components/features/notifications/NotificationCenter';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Bell,
  Menu,
  X,
  Video,
  MessageSquare,
  History,
  Settings,
  LogOut,
  Home,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/match', label: 'New Meeting', icon: Video },
  { href: '/history', label: 'History', icon: History },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full glass border-b">
      <div className="flex h-16 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="Amigal Home">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg transition-transform group-hover:scale-105">
            <Video className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gradient hidden sm:block">Amigal</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setNotifOpen(!notifOpen)}
              aria-label="Notifications"
              aria-expanded={notifOpen}
              aria-haspopup="true"
            >
              <Bell className="h-5 w-5" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                3
              </Badge>
            </Button>
            {notifOpen && <NotificationCenter onClose={() => setNotifOpen(false)} />}
          </div>

          {user ? (
            <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-border">
              <Avatar src={user.avatarUrl} fallback={user.displayName || user.email} size="sm" status="online" />
              <div className="hidden lg:block">
                <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <Button variant="ghost" size="icon-sm" onClick={logout} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">Sign In</Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-3 space-y-1" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
