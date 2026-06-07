import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuth, fetchProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    // Google returns the access_token in the URL hash: #access_token=...&token_type=Bearer&...
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const oauthError = hash.get("error");

    if (oauthError || !accessToken) {
      const msg = oauthError ?? "no_token";
      navigate(`/login?google_error=${encodeURIComponent(msg)}`, { replace: true });
      return;
    }

    const userType = sessionStorage.getItem("google_auth_user_type") ?? "zzp";
    const redirectTo = sessionStorage.getItem("google_auth_redirect") ?? "/dashboard";
    sessionStorage.removeItem("google_auth_user_type");
    sessionStorage.removeItem("google_auth_redirect");

    googleAuth(accessToken, userType)
      .then(() => fetchProfile())
      .then((profile) => {
        if (!profile) throw new Error("profile_null");
        setUser(profile);
        if (profile.id) localStorage.setItem("taxwijs_user_id", String(profile.id));
        navigate(redirectTo, { replace: true });
      })
      .catch((err: unknown) => {
        const code = err instanceof Error ? err.message : String(err);
        navigate(`/login?google_error=${encodeURIComponent(code)}`, { replace: true });
      });
  }, [navigate, setUser]);

  return <LoadingScreen />;
}
