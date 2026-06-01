import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { type AuthUser, fetchProfile, logout as apiLogout } from "../api/auth";

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const LAST_ACTIVE_KEY = "taxwijs_last_active";

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

function updateLastActive() {
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchProfile().then((u) => {
      setUser(u);
      setLoading(false);
      if (u) updateLastActive();
    });
  }, []);

  const logout = () => {
    apiLogout();
    setUser(null);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  };

  // Track user activity and auto-logout after 1hr inactivity
  useEffect(() => {
    if (!user) return;

    // Reset timer on any user interaction
    const events = ["mousedown", "keydown", "touchstart", "scroll", "click"] as const;
    const onActivity = () => updateLastActive();
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    // Check every 60 seconds if the user has been inactive for 1hr
    inactivityTimer.current = setInterval(() => {
      const lastActive = parseInt(localStorage.getItem(LAST_ACTIVE_KEY) || "0", 10);
      if (lastActive && Date.now() - lastActive > INACTIVITY_TIMEOUT_MS) {
        logout();
      }
    }, 60_000);

    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      if (inactivityTimer.current) clearInterval(inactivityTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
