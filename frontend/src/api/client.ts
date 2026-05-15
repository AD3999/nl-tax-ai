import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

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
