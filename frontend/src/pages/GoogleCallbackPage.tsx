import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleAuthCode } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import LoadingScreen from "../components/LoadingScreen";

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code       = params.get("code");
    const oauthError = params.get("error");

    if (oauthError || !code) {
      const msg = oauthError ?? "no_code";
      navigate(`/login?google_error=${encodeURIComponent(msg)}`, { replace: true });
      return;
    }

    const codeVerifier = sessionStorage.getItem("google_pkce_verifier");
    const redirectUri  = sessionStorage.getItem("google_auth_redirect_uri");
    const userType     = sessionStorage.getItem("google_auth_user_type") ?? "zzp";
    const redirectTo   = sessionStorage.getItem("google_auth_redirect")  ?? "/dashboard";
    sessionStorage.removeItem("google_pkce_verifier");
    sessionStorage.removeItem("google_auth_redirect_uri");
    sessionStorage.removeItem("google_auth_user_type");
    sessionStorage.removeItem("google_auth_redirect");

    if (!codeVerifier || !redirectUri) {
      navigate("/login?google_error=missing_pkce", { replace: true });
      return;
    }

    googleAuthCode(code, codeVerifier, redirectUri, userType)
      .then((data) => {
        setUser(data.user);
        if (data.user.id) localStorage.setItem("taxwijs_user_id", String(data.user.id));
        navigate(redirectTo, { replace: true });
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        navigate(`/login?google_error=${encodeURIComponent(msg)}`, { replace: true });
      });
  }, [navigate, setUser]);

  return <LoadingScreen />;
}
