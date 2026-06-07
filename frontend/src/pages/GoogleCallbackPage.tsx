import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuth } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
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

    // googleAuth now returns user profile in the same response — no second fetch needed.
    // This avoids any race with AuthContext.apiLogout() wiping a just-stored token.
    googleAuth(accessToken, userType)
      .then((data) => {
        setUser(data.user);
        if (data.user.id) localStorage.setItem("taxwijs_user_id", String(data.user.id));
        navigate(redirectTo, { replace: true });
      })
      .catch((err: unknown) => {
        const code = err instanceof Error ? err.message : String(err);
        navigate(`/login?google_error=${encodeURIComponent(code)}`, { replace: true });
      });
  }, [navigate, setUser]);

  return <LoadingScreen />;
}
