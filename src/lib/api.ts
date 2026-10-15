import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import type { Meta } from './types';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[]>,
  ) {
    super(message);
  }
}

// Same-origin: Next.js proxies /api to the Express backend, so the httpOnly session cookie is first-party.
const http = axios.create({ baseURL: '/api', withCredentials: true, timeout: 20_000 });

function toApiError(e: unknown): ApiError {
  const err = e as AxiosError<{ error?: { code: string; message: string; details?: Record<string, string[]> } }>;
  if (err.response) {
    const body = err.response.data?.error;
    return new ApiError(err.response.status, body?.code ?? 'ERROR', body?.message ?? 'Something went wrong', body?.details);
  }
  return new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection and try again.');
}

async function request<T>(config: AxiosRequestConfig): Promise<{ data: T; meta?: Meta }> {
  try {
    const res = await http.request<{ success: true; data: T; meta?: Meta }>(config);
    return { data: res.data.data, meta: res.data.meta };
  } catch (e) {
    const apiErr = toApiError(e);
    // Session expired mid-use: let the auth context react. (Login/OTP failures are expected 401/403s.)
    if (apiErr.status === 401 && typeof window !== 'undefined' && !config.url?.startsWith('/auth/')) {
      window.dispatchEvent(new Event('auth:expired'));
    }
    throw apiErr;
  }
}

export const api = {
  get: async <T>(url: string, params?: object) => (await request<T>({ method: 'GET', url, params })).data,
  list: async <T>(url: string, params?: object) => {
    const r = await request<T[]>({ method: 'GET', url, params });
    return { items: r.data, meta: r.meta! };
  },
  post: async <T>(url: string, body?: object) => (await request<T>({ method: 'POST', url, data: body })).data,
  patch: async <T>(url: string, body?: object) => (await request<T>({ method: 'PATCH', url, data: body })).data,
  put: async <T>(url: string, body?: object) => (await request<T>({ method: 'PUT', url, data: body })).data,
  delete: async <T>(url: string) => (await request<T>({ method: 'DELETE', url })).data,
  /** multipart form post (file + fields). */
  postForm: async <T>(url: string, form: FormData) => (await request<T>({ method: 'POST', url, data: form })).data,
  upload: async <T>(url: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return (await request<T>({ method: 'PATCH', url, data: form })).data;
  },
};

/** Maps backend field errors onto react-hook-form fields. Returns true if any were applied. */
export function applyFieldErrors(err: unknown, setError: (name: any, error: { message: string }) => void): boolean {
  if (err instanceof ApiError && err.details) {
    for (const [field, msgs] of Object.entries(err.details)) setError(field, { message: msgs[0] });
    return true;
  }
  return false;
}

export const errorMessage = (e: unknown) => (e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
