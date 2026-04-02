import axios, { AxiosError } from 'axios';

export const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ── token helpers ──────────────────────────────────────────────────────────
export const TokenStore = {
  getAccess:   ()      => localStorage.getItem('access_token'),
  getRefresh:  ()      => localStorage.getItem('refresh_token'),
  setTokens:   (a: string, r: string) => {
    localStorage.setItem('access_token',  a);
    localStorage.setItem('refresh_token', r);
  },
  setAccess:   (a: string) => localStorage.setItem('access_token', a),
  clear:       ()      => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
};

// ── request interceptor: attach access token ───────────────────────────────
api.interceptors.request.use((config) => {
  const token = TokenStore.getAccess();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// ── response interceptor: auto-refresh on 401 ─────────────────────────────
let _refreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as any;

    // Only attempt refresh once per request, and not for the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !original._retried &&
      original.url !== '/auth/refresh' &&
      original.url !== '/auth/login'
    ) {
      original._retried = true;

      if (_refreshing) {
        // Queue this request until the in-flight refresh completes
        return new Promise((resolve, reject) => {
          _refreshQueue.push((newToken) => {
            if (newToken) {
              original.headers['Authorization'] = `Bearer ${newToken}`;
              resolve(api(original));
            } else {
              reject(error);
            }
          });
        });
      }

      _refreshing = true;
      const refreshToken = TokenStore.getRefresh();

      if (!refreshToken) {
        TokenStore.clear();
        _refreshing = false;
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const newAccess: string = res.data?.data?.access_token ?? res.data?.access_token;
        TokenStore.setAccess(newAccess);

        // Drain the queue
        _refreshQueue.forEach((cb) => cb(newAccess));
        _refreshQueue = [];

        original.headers['Authorization'] = `Bearer ${newAccess}`;
        return api(original);
      } catch {
        TokenStore.clear();
        _refreshQueue.forEach((cb) => cb(null));
        _refreshQueue = [];
        return Promise.reject(error);
      } finally {
        _refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ── response unwrapper ─────────────────────────────────────────────────────
export function handleAxiosResponse(res: any) {
  const data = res?.data;
  if (!res || res.status >= 400) {
    throw new Error(
      (data && (data.detail || data.message)) || res.statusText || 'API error'
    );
  }
  // Unwrap the standard { status, message, data } envelope
  return data && data.data !== undefined ? data.data : data;
}

export default api;

// Re-export all API modules for convenience
export * from './admin';
export * from './auth';
export * from './health';
export * from './members';
export * from './trainers';
