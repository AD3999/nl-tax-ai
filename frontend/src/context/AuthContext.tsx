import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { type AuthUser, fetchProfile, logout as apiLogout } from "../api/auth";

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
const LAST_ACTIVE_KEY = "taxwijs_last_active";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
  refreshUser: async () => {},
});

function updateLastActive() {
  localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    fetchProfile()
      .then((u) => {
        setUser(u);
        if (u) {
          updateLastActive();
        } else {
          // Token missing or expired — wipe all session data so stale user-id
          // never causes another visitor to read the previous user's chat history.
          apiLogout();
        }
      })
      .catch(() => {
        // Network error or unexpected throw — ensure loading clears so the app
        // doesn't hang on the loading screen indefinitely.
        apiLogout();
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = () => {
    apiLogout();
    setUser(null);
    localStorage.removeItem(LAST_ACTIVE_KEY);
  };

  // Stable reference — wrapped in useCallback so effects that depend on it
  // don't re-fire on every render (setUser from useState is always stable).
  const refreshUser = useCallback(async () => {
    const u = await fetchProfile();
    setUser(u);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    <AuthContext.Provider value={{ user, loading, setUser, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
