import { createContext, useContext, useEffect, useState } from "react";
import { authApi, tokenStorage, type User } from "./api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (full_name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // `loading` starts true so ProtectedRoute can wait for the bootstrap
  // /me call instead of redirecting on the first render.
  const [loading, setLoading] = useState(true);

  // On mount: if we have a token, validate it by fetching /me.
  // If it's invalid (expired, server cleared, etc), drop it.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    tokenStorage.set(res.access_token);
    setUser(res.user);
  };

  const signup = async (full_name: string, email: string, password: string) => {
    const res = await authApi.signup({ full_name, email, password });
    tokenStorage.set(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
