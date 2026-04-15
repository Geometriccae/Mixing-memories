import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchMe,
  loginRequest,
  registerRequest,
  updateProfileRequest,
  type ProfileUpdateBody,
  type UserPublic,
} from "@/lib/authApi";

const TOKEN_KEY = "royal_oven_user_token";
/** Cached profile for the current token — used when /me fails transiently so closing the browser does not force login. */
const USER_CACHE_KEY = "royal_oven_user_public_json";

function readCachedUser(): import("@/lib/authApi").UserPublic | null {
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as import("@/lib/authApi").UserPublic;
    return u?.id ? u : null;
  } catch {
    return null;
  }
}

function writeCachedUser(u: import("@/lib/authApi").UserPublic | null) {
  try {
    if (!u?.id) localStorage.removeItem(USER_CACHE_KEY);
    else localStorage.setItem(USER_CACHE_KEY, JSON.stringify(u));
  } catch {
    /* quota */
  }
}

type AuthContextValue = {
  user: UserPublic | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (body: ProfileUpdateBody) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPublic | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setIsLoading(false);
      return;
    }
    setToken(stored);
    const cached = readCachedUser();
    if (cached) setUser(cached);
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    void (async () => {
      let lastErr: unknown;
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          const u = await fetchMe(stored);
          setUser(u);
          writeCachedUser(u);
          setIsLoading(false);
          return;
        } catch (e) {
          lastErr = e;
          const msg = e instanceof Error ? e.message : "";
          if (msg === "AUTH_UNAUTHORIZED") {
            localStorage.removeItem(TOKEN_KEY);
            writeCachedUser(null);
            setToken(null);
            setUser(null);
            setIsLoading(false);
            return;
          }
          if (attempt < 2) await sleep(400 * (attempt + 1));
        }
      }
      void lastErr;
      if (cached) {
        setToken(stored);
        setUser(cached);
        setIsLoading(false);
        return;
      }
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token: t, user: u } = await loginRequest(email, password);
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    writeCachedUser(u);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const { token: t, user: u } = await registerRequest(name, email, password);
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
    setUser(u);
    writeCachedUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    writeCachedUser(null);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (body: ProfileUpdateBody) => {
      if (!token) throw new Error("Not signed in.");
      const next = await updateProfileRequest(token, body);
      setUser(next);
      writeCachedUser(next);
    },
    [token]
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      login,
      register,
      logout,
      updateProfile,
    }),
    [user, token, isLoading, login, register, logout, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
