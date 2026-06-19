import axios from "axios";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

let getToken: (() => string | null) | null = null;

export function setTokenGetter(fn: () => string | null) {
  getToken = fn;
}

apiClient.interceptors.request.use((config) => {
  const token = getToken?.();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

apiClient.interceptors.response.use(
  (res) => {
    console.log(`[API] ${res.status} ${res.config.url}`);
    return res;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] ${error.response.status} ${error.config?.url}`, error.response.data);
    } else if (error.request) {
      console.error(`[API] Network Error ${error.config?.url} — no response (check backend is running and reachable)`);
    } else {
      console.error(`[API]`, error.message);
    }
    return Promise.reject(error);
  },
);
