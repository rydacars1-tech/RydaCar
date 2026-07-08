import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { requestJson } from "../lib/api.js";

const SESSION_STORAGE_KEY = "ryda.admin.session.v1";

const AdminAuthContext = createContext(null);

function readStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(() => readStoredSession());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [session]);

  const clearSession = useCallback(() => {
    setSession(null);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    if (!session?.refreshToken) {
      clearSession();
      throw new Error("Session expired. Please log in again.");
    }

    const payload = await requestJson("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: session.refreshToken })
    });

    setSession((current) => {
      if (!current) {
        return current;
      }

      return {
        ...current,
        accessToken: payload.data.accessToken
      };
    });

    return payload.data.accessToken;
  }, [clearSession, session?.refreshToken]);

  const authenticatedRequest = useCallback(
    async (path, options = {}, retryOnUnauthorized = true) => {
      if (!session?.accessToken) {
        throw new Error("Please log in to continue.");
      }

      try {
        return await requestJson(path, {
          ...options,
          headers: {
            ...(options.headers || {}),
            Authorization: `Bearer ${session.accessToken}`
          }
        });
      } catch (error) {
        if (error?.status === 401 && retryOnUnauthorized && session?.refreshToken) {
          const nextAccessToken = await refreshAccessToken();
          return requestJson(path, {
            ...options,
            headers: {
              ...(options.headers || {}),
              Authorization: `Bearer ${nextAccessToken}`
            }
          });
        }

        if (error?.status === 401) {
          clearSession();
        }

        throw error;
      }
    },
    [clearSession, refreshAccessToken, session?.accessToken, session?.refreshToken]
  );

  const login = useCallback(async (email, password) => {
    const payload = await requestJson("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: String(email || "").trim().toLowerCase(),
        password
      })
    });

    setSession(payload.data);
    return payload.data;
  }, []);

  const logout = useCallback(async () => {
    if (session?.accessToken) {
      try {
        await requestJson("/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        });
      } catch {
        // Ignore logout errors and clear the local session anyway.
      }
    }

    clearSession();
  }, [clearSession, session?.accessToken]);

  useEffect(() => {
    let active = true;

    async function bootstrapSession() {
      if (!session?.accessToken) {
        if (active) {
          setAuthReady(true);
        }
        return;
      }

      try {
        const payload = await authenticatedRequest("/auth/me", { method: "GET" }, false);
        if (active) {
          setSession((current) => (current ? { ...current, user: payload.data } : current));
        }
      } catch {
        if (active) {
          clearSession();
        }
      } finally {
        if (active) {
          setAuthReady(true);
        }
      }
    }

    bootstrapSession();

    return () => {
      active = false;
    };
  }, [authenticatedRequest, clearSession, session?.accessToken]);

  const value = useMemo(
    () => ({
      authReady,
      session,
      user: session?.user || null,
      isAuthenticated: Boolean(session?.accessToken),
      login,
      logout,
      clearSession,
      authenticatedRequest
    }),
    [authReady, authenticatedRequest, clearSession, login, logout, session]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return context;
}
