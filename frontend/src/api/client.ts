import axios from "axios";

// In dev, Vite proxies /api → http://localhost:8000 (see vite.config.ts).
// In production, set VITE_API_URL to the deployed API origin (e.g. https://api.taxwijs.nl).
const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : "/api";
export const apiBase = API_BASE;

/**
 * Shared auth header for raw fetch() calls.
 * All pages must import this instead of duplicating the pattern.
 * The axios client handles this automatically via interceptor below.
 */
export function authHeader(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Anonymous session message limit.
 * Reads from VITE_ANON_SESSION_LIMIT env var so it stays in sync with
 * the backend DISABLE_CHAT_LIMITS flag. Set to 9999 in .env to disable.
 * Default: 5 for production builds.
 */
export const ANON_SESSION_LIMIT: number = Number(
  import.meta.env.VITE_ANON_SESSION_LIMIT ?? 5
);

export const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage on every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh token on 401
client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh });
        localStorage.setItem("access_token", data.access);
        original.headers.Authorization = `Bearer ${data.access}`;
        return client(original);
      }
    }
    return Promise.reject(error);
  }
);
