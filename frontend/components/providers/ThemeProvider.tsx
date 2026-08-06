'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';

// Thin pass-through so `useTheme()` in ThemeToggle resolves against a real
// provider; all configuration stays at the call site in app/layout.tsx.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
