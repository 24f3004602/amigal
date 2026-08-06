/* eslint-disable @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return */
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockedFunction } from 'vitest';

import { useAuth } from './useAuth';

import { AuthProvider } from '@/components/providers/AuthProvider';

// Use a typed Vitest mock and stub global.fetch
const mockedFetch = vi.fn() as MockedFunction<typeof fetch>;
vi.stubGlobal('fetch', mockedFetch);

const wrapper = ({ children }: { children: React.ReactNode }): JSX.Element => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with null user', () => {
    mockedFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
  });

  it('logs in successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com', displayName: 'Test' };

    mockedFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUser }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockUser }),
      });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('handles login errors', async () => {
    mockedFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(result.current.login('test@example.com', 'pass')).rejects.toThrow();
  });
});
