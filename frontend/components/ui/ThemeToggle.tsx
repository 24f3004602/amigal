'use client';

import { useTheme } from 'next-themes';
import { Button } from './Button';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-9" />;

  const next = resolvedTheme === 'dark' ? 'light' : 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-5 w-5 text-warning transition-transform hover:rotate-45" />
      ) : (
        <Moon className="h-5 w-5 text-info transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
}
