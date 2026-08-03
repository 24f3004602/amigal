const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request(method: string, path: string, body?: unknown, options?: RequestInit) {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options?.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, {
      method,
      headers,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    if (!res.ok && res.status >= 500) {
      throw new Error(`Server error: ${res.status}`);
    }

    return res;
  }

  get(path: string, options?: RequestInit) {
    return this.request('GET', path, undefined, options);
  }

  post(path: string, body: unknown, options?: RequestInit) {
    return this.request('POST', path, body, options);
  }

  put(path: string, body: unknown, options?: RequestInit) {
    return this.request('PUT', path, body, options);
  }

  patch(path: string, body: unknown, options?: RequestInit) {
    return this.request('PATCH', path, body, options);
  }

  delete(path: string, options?: RequestInit) {
    return this.request('DELETE', path, undefined, options);
  }
}

export const api = new ApiClient(`${API_BASE}/v1`);
