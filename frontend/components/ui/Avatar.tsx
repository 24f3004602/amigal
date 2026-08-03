import * as React from 'react';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'away' | 'busy';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
};

const statusColors = {
  online: 'bg-success',
  offline: 'bg-muted-foreground',
  away: 'bg-warning',
  busy: 'bg-destructive',
};

function Avatar({ className, src, alt, fallback, size = 'md', status, ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  const initials = fallback
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={cn('relative inline-flex', className)} {...props}>
      <div
        className={cn(
          'relative flex items-center justify-center overflow-hidden rounded-full bg-secondary font-medium text-secondary-foreground ring-2 ring-background',
          sizeClasses[size]
        )}
      >
        {src && !error ? (
          <img
            src={src}
            alt={alt || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setError(true)}
          />
        ) : initials ? (
          <span aria-label={alt}>{initials}</span>
        ) : (
          <User className="h-1/2 w-1/2 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-background',
            statusColors[status]
          )}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
}

export { Avatar };
