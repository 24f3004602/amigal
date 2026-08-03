const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = {
  get: (path: string) => fetch(`${API_URL}${path}`, { credentials: 'include' }),
  post: (path: string, body: any) => fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  }),
  delete: (path: string) => fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    credentials: 'include',
  }),
};
