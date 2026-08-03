'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, SkeletonCard } from '@/components/ui/Skeleton';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AppShell } from '@/components/layout/AppShell';
import Link from 'next/link';
import { Video, Clock, Users, TrendingUp, Plus, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <AppShell>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome back, <span className="text-gradient">{user?.displayName || 'Guest'}</span>
            </h1>
            <p className="mt-1 text-muted-foreground">Here's what's happening with your meetings.</p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/match">
              <Plus className="h-4 w-4" /> New Meeting
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Total Meetings', value: '24', change: '+12%', icon: Video, color: 'text-cyan-500' },
            { label: 'Hours Connected', value: '18.5h', change: '+8%', icon: Clock, color: 'text-purple-500' },
            { label: 'People Met', value: '142', change: '+24%', icon: Users, color: 'text-pink-500' },
            { label: 'Avg Rating', value: '4.9', change: '+0.2', icon: TrendingUp, color: 'text-emerald-500' },
          ].map((stat) => (
            <div key={stat.label} className="glass-card p-5">
              <div className="flex items-center justify-between">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <Badge variant="success" className="text-xs">{stat.change}</Badge>
              </div>
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Meetings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Meetings</h2>
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link href="/history">View all <ArrowRight className="h-3 w-3" /></Link>
            </Button>
          </div>
          <div className="grid gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 glass-card p-4 transition-colors hover:bg-white/10">
                <Avatar fallback="JD" size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">Design Sync with Engineering</p>
                  <p className="text-sm text-muted-foreground">Today, 2:30 PM · 45 min</p>
                </div>
                <Badge variant="secondary">Video</Badge>
                <Button variant="ghost" size="sm">Join</Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
