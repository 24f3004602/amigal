import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('skeleton', className)}
      {...props}
      aria-hidden="true"
    />
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('glass-card p-6', className)}>{children}</div>;
}

function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4 animate-fade-in">
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-20 w-full rounded-lg" />
    </div>
  );
}

function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonText, Card };
