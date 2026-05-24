import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthUser, fetchProfile, logout as apiLogout } from "../api/auth";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const logout = () => {
    apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
