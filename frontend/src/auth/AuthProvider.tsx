import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import * as authApi from "../api/auth";
import { refreshAccessToken, setOnSessionExpired } from "../api/client";
import { tokenStore } from "../api/tokenStore";
import type { User } from "../api/types";
import { AuthContext, type AuthStatus } from "./context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  const clearSession = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    setStatus("anonymous");
  }, []);

  // On page load: the access token (memory) is gone, but a refresh token
  // in localStorage can restore the session.
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const access = await refreshAccessToken();
      if (!access) {
        if (!cancelled) clearSession();
        return;
      }
      try {
        const me = await authApi.fetchMe();
        if (!cancelled) {
          setUser(me);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) clearSession();
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  // If a refresh fails mid-session (expired or revoked), drop to anonymous.
  useEffect(() => {
    setOnSessionExpired(clearSession);
    return () => setOnSessionExpired(null);
  }, [clearSession]);

  const login = useCallback(async (username: string, password: string) => {
    tokenStore.set(await authApi.login(username, password));
    setUser(await authApi.fetchMe());
    setStatus("authenticated");
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      await authApi.register(username, email, password);
      await login(username, password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) await authApi.logout(refresh);
    } finally {
      // Log out locally even if the server call fails (e.g. offline).
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo(
    () => ({ user, status, login, register, logout }),
    [user, status, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
