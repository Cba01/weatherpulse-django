import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

import { tokenStore } from "./tokenStore";
import type { Tokens } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({ baseURL: API_URL });

// --- Request: attach the access token ---------------------------------------

api.interceptors.request.use((config) => {
  const access = tokenStore.getAccess();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// --- Refresh: one shared in-flight request ----------------------------------

// Refresh tokens rotate and the old one is blacklisted, so two parallel
// refreshes with the same token would make the second fail and log the user
// out. Every caller awaits the same promise instead.
let refreshPromise: Promise<string | null> | null = null;

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refresh = tokenStore.getRefresh();
      if (!refresh) return null;
      try {
        // Plain axios, not `api`: this call must not go through the 401 interceptor.
        const { data } = await axios.post<Tokens>(`${API_URL}/auth/token/refresh/`, { refresh });
        tokenStore.set(data);
        return data.access;
      } catch {
        tokenStore.clear();
        return null;
      }
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// --- Response: on 401, refresh once and retry -------------------------------

let onSessionExpired: (() => void) | null = null;

/** Lets the AuthProvider react when the session can't be renewed. */
export function setOnSessionExpired(callback: (() => void) | null) {
  onSessionExpired = callback;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as RetriableConfig | undefined;
  const isAuthEndpoint = original?.url?.startsWith("/auth/token");

  if (error.response?.status !== 401 || !original || original._retried || isAuthEndpoint) {
    throw error;
  }

  original._retried = true;
  const access = await refreshAccessToken();
  if (!access) {
    onSessionExpired?.();
    throw error;
  }
  // The request interceptor attaches the new token on the retry.
  return api(original);
});
