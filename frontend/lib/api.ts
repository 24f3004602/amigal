const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 401) {
    const refresh = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!refresh.ok) {
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    return fetch(`${API_URL}${path}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }

  return res;
}

export const api = {
  get: (path: string) => fetchWithAuth(path),
  post: (path: string, body: any) =>
    fetchWithAuth(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: any) =>
    fetchWithAuth(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => fetchWithAuth(path, { method: 'DELETE' }),
};
