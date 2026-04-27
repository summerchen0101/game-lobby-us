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
  login as apiLogin,
  signUp as apiSignUp,
  refreshAccessToken,
} from "../lib/api/auth";
import * as apiMock from "../lib/api/mock";
import { nicknameFromEmail } from "../lib/appMeta";
import { isMockMode } from "../lib/env";
import {
  setOn401RefreshTokenHandler,
  setUnauthorizedHandler,
} from "../lib/api/client";
import type { AuthResponse, RegisterBody, User } from "../lib/api/types";
import { AuthContext } from "./auth-context";
import { REFRESH_TOKEN_STORAGE_KEY, TOKEN_STORAGE_KEY } from "./storage";
import { readPersistedUser, writePersistedUser } from "./userPersist";

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
  refreshToken?: string;
}): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
  if (res.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, res.refreshToken);
  }
}

function clearStoredSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  writePersistedUser(null);
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

/** 有 session 憑證時從 storage 還原 user，避免 refresh bootstrap 期間誤顯示訪客大廳。 */
function getInitialUser(): User | null {
  if (typeof localStorage === "undefined") return null;
  if (isMockMode()) return null;
  if (!getInitialRefresh() && !getInitialToken()) return null;
  return readPersistedUser() ?? minimalSessionUser();
}

/** 後端登入／註冊未帶 `user` 時，供 session／RequireAuth 使用之最小使用者（Gateway 仍用 userID 0）。 */
function syntheticUserFromAccount(account: string): User {
  const t = account.trim();
  const displayName = (t ? nicknameFromEmail(t) : "") || "Player";
  return { id: "0", displayName };
}

/** 憑證仍在但 user json 缺失／無法解析時使用，避免 [token] effect 整段誤清 session。 */
function minimalSessionUser(): User {
  return { id: "0", displayName: "Player" };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  /** 樂觀還原 access（即使同時有 refresh），避免 bootstrap 完成前 token 為 null 導致 RequireAuth／WS 誤判。 */
  const [token, setToken] = useState<string | null>(() => getInitialToken());
  const [user, setUser] = useState<User | null>(() => getInitialUser());
  const [ready, setReady] = useState(initialReadyState);

  const setSessionFromAuth = useCallback(
    (res: {
      accessToken: string;
      refreshToken?: string;
      user?: User | null | undefined;
    }) => {
      persistAuthResponse(res);
      setToken(res.accessToken);
      if (res.user) {
        writePersistedUser(res.user);
        setUser(res.user);
      } else {
        writePersistedUser(null);
        setUser(null);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    clearStoredSession();
    setToken(null);
    setUser(null);
    setReady(true);
    navigate("/", { replace: true });
  }, [navigate]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearStoredSession();
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
        if (res.user) {
          writePersistedUser(res.user);
          setUser(res.user);
        } else {
          let u = readPersistedUser();
          if (!u) {
            u = minimalSessionUser();
            writePersistedUser(u);
          }
          setUser(u);
        }
        setToken(res.accessToken);
        return res.accessToken;
      } catch {
        return null;
      }
    });
    return () => setOn401RefreshTokenHandler(null);
  }, []);

  // 非 mock：重整時若已有 access 則不先打 /token，直接以 storage 內 access 讓下層重連 WS（過期則交給 401 換發）
  // 僅在 storage 無 access、仍有 refresh 時才啟動換發
  useEffect(() => {
    if (isMockMode()) return;
    const initialT = getInitialToken();
    const initialRt = getInitialRefresh();
    if (initialT || !initialRt) return;
    let cancelled = false;
    setReady(false);
    void refreshAccessToken(initialRt)
      .then((res) => {
        if (cancelled) return;
        persistAuthResponse(res);
        setToken(res.accessToken);
        if (res.user) {
          writePersistedUser(res.user);
          setUser(res.user);
        } else {
          let u = readPersistedUser();
          if (!u) {
            u = minimalSessionUser();
            writePersistedUser(u);
          }
          setUser(u);
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredSession();
          setToken(null);
          setUser(null);
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 依 `token` 還原使用者：mock 用內建假資料；其餘用登入／refresh 已寫入之持久化，大廳則由 LOBBY_GET 之 playerInfo 經 mergeUser 併入
  useEffect(() => {
    if (token == null) {
      const noStoredSession =
        getInitialToken() == null && getInitialRefresh() == null;
      if (noStoredSession) {
        setUser(null);
        setReady(true);
      } else {
        let u = readPersistedUser();
        if (!u) {
          u = minimalSessionUser();
          writePersistedUser(u);
        }
        setUser(u);
      }
      return;
    }
    let cancelled = false;
    setReady(false);

    if (isMockMode()) {
      void apiMock
        .mockGetMe()
        .then((u) => {
          if (!cancelled) {
            setUser(u);
            writePersistedUser(u);
          }
        })
        .catch(() => {
          if (!cancelled) {
            clearStoredSession();
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
    }

    let u = readPersistedUser();
    if (!u) {
      u = minimalSessionUser();
      writePersistedUser(u);
    }
    setUser(u);
    setReady(true);
    return () => {
      cancelled = true;
    };
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }
    if (isMockMode()) {
      const u = await apiMock.mockGetMe();
      setUser(u);
      writePersistedUser(u);
      return;
    }
    const u = readPersistedUser();
    if (u) setUser(u);
  }, [token]);

  const mergeUser = useCallback((patch: Partial<User>) => {
    setUser((prev) => {
      const base = prev ?? { id: "0", displayName: "Player" };
      const next: User = { ...base, ...patch };
      writePersistedUser(next);
      return next;
    });
  }, []);

  const login = useCallback(
    async (account: string, password: string) => {
      const res = await apiLogin({ account, password });
      const user = res.user ?? syntheticUserFromAccount(account);
      setSessionFromAuth({ ...res, user });
    },
    [setSessionFromAuth],
  );

  const signUp = useCallback(async (body: RegisterBody) => {
    return apiSignUp(body);
  }, []);

  const register = useCallback(
    async (body: RegisterBody) => {
      const res = await completeSignUp(body);
      const user = res.user ?? syntheticUserFromAccount(body.email);
      setSessionFromAuth({ ...res, user });
    },
    [setSessionFromAuth],
  );

  const ingestAuthResponse = useCallback(
    (res: AuthResponse) => {
      const user = res.user ?? { id: "0", displayName: "Player" };
      setSessionFromAuth({ ...res, user });
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
      mergeUser,
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
      mergeUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
