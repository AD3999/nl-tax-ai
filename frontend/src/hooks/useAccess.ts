import { useAuth } from "../context/AuthContext";

/**
 * Returns whether the current user can access a premium feature.
 * - Authenticated premium users: always true
 * - Free / anonymous users: false
 */
export function useAccess(feature: "simulation" | "pdf_report" | "tax_history" | "unlimited_chat"): {
  allowed: boolean;
  isPremium: boolean;
  isLoggedIn: boolean;
} {
  const { user } = useAuth();
  const isLoggedIn = !!user;
  const isPremium  = user?.plan === "premium";
  const allowed    = isPremium;
  return { allowed, isPremium, isLoggedIn };
}
