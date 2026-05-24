import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { login } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import { fetchProfile } from "../api/auth";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ username: email, password });
      const user = await fetchProfile();
      setUser(user);
      navigate("/chat");
    } catch {
      setError(t("auth.login_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("auth.login")}</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            {t("auth.email")}
            <input
              type="email"
              className={styles.input}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>

          <label className={styles.label}>
            {t("auth.password")}
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "…" : t("auth.login")}
          </button>
        </form>

        <p className={styles.switch}>
          {t("auth.no_account")}{" "}
          <Link to="/register">{t("auth.register")}</Link>
        </p>
      </div>
    </main>
  );
}
