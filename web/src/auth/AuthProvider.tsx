import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  completeSignUp,
  fetchCurrentUser,
  login as apiLogin,
  signUp as apiSignUp,
  refreshAccessToken,
} from "../lib/api/auth";
import { isMockMode } from "../lib/env";
import {
  setOn401RefreshTokenHandler,
  setUnauthorizedHandler,
} from "../lib/api/client";
import type { AuthResponse, RegisterBody, User } from "../lib/api/types";
import { AuthContext } from "./auth-context";
import { REFRESH_TOKEN_STORAGE_KEY, TOKEN_STORAGE_KEY } from "./storage";

function getInitialToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function getInitialRefresh(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

function persistAuthResponse(res: {
  accessToken: string;
  aRefreshToken?: string;
}): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
  if (res.aRefreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.aRefreshToken);
  }
}

function clearStoredTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

function initialReadyState(): boolean {
  const t = getInitialToken();
  const r = getInitialRefresh();
  if (isMockMode()) {
    return !t;
  }
  if (r) return false;
  return !t;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [token, setToken] = useState<string | null>(() => {
    if (isMockMode()) return getInitialToken();
    if (getInitialRefresh()) return null;
    return getInitialToken();
  });
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(initialReadyState);

  const setSessionFromAuth = useCallback(
    (res: {
      accessToken: string;
      aRefreshToken?: string;
      user?: User | null | undefined;
    }) => {
      persistAuthResponse(res);
      setToken(res.accessToken);
      if (res.user) {
        setUser(res.user);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearStoredTokens();
    setToken(null);
    setUser(null);
    setReady(true);
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredTokens();
      setToken(null);
      setUser(null);
      setReady(true);
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(null);
  }, [navigate]);

  useEffect(() => {
    setOn401RefreshTokenHandler(async () => {
      const rt = getInitialRefresh();
      if (!rt) return null;
      try {
        const res = await refreshAccessToken(rt);
        persistAuthResponse(res);
        setToken(res.accessToken);
        return res.accessToken;
      } catch {
        return null;
      }
    });
    return () => setOn401RefreshTokenHandler(null);
  }, []);

  // 非 mock：有 refresh 時啟動先 POST /api/v1/token
  useEffect(() => {
    if (isMockMode()) return;
    const initialRt = getInitialRefresh();
    if (!initialRt) return;
    let cancelled = false;
    setReady(false);
    void refreshAccessToken(initialRt)
      .then((res) => {
        if (cancelled) return;
        persistAuthResponse(res);
        setToken(res.accessToken);
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredTokens();
          setToken(null);
          setUser(null);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 依 `token` 取得使用者
  useEffect(() => {
    if (token == null) {
      setUser(null);
      if (getInitialToken() == null && getInitialRefresh() == null) {
        setReady(true);
      }
      return;
    }
    let cancelled = false;
    setReady(false);
    fetchCurrentUser(token)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredTokens();
          setToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      return;
    }
    const u = await fetchCurrentUser(token);
    setUser(u);
  }, [token]);

  const login = useCallback(
    async (account: string, password: string) => {
      const res = await apiLogin({ account, password });
      setSessionFromAuth(res);
    },
    [setSessionFromAuth],
  );

  const signUp = useCallback(async (body: RegisterBody) => {
    return apiSignUp(body);
  }, []);

  const register = useCallback(
    async (body: RegisterBody) => {
      const res = await completeSignUp(body);
      setSessionFromAuth({ ...res, user: res.user });
    },
    [setSessionFromAuth],
  );

  const ingestAuthResponse = useCallback(
    (res: AuthResponse) => {
      setSessionFromAuth(res);
    },
    [setSessionFromAuth],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      ready,
      login,
      signUp,
      register,
      ingestAuthResponse,
      logout,
      refreshUser,
    }),
    [
      user,
      token,
      ready,
      login,
      signUp,
      register,
      ingestAuthResponse,
      logout,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
