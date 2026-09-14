import { getToken } from './auth-token';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const { auth = true, headers, ...rest } = init ?? {};
  const token = auth ? getToken() : null;

  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = res.status === 204 ? null : await res.json().catch(() => null);

  if (!res.ok) {
    const message = (body && (body.message as string)) || res.statusText;
    throw new ApiError(Array.isArray(message) ? message.join(', ') : message, res.status);
  }
  return body as T;
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit & { auth?: boolean }) =>
    request<T>(path, { ...init, method: 'GET' }),
  post: <T>(path: string, data?: unknown, init?: RequestInit & { auth?: boolean }) =>
    request<T>(path, { ...init, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown, init?: RequestInit & { auth?: boolean }) =>
    request<T>(path, { ...init, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string, init?: RequestInit & { auth?: boolean }) =>
    request<T>(path, { ...init, method: 'DELETE' }),
};
