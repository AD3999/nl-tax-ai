import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { register, login, fetchProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import styles from "./LoginPage.module.css";

export default function RegisterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("zzp");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({
        email,
        username: email,
        password,
        user_type: userType,
        preferred_language: i18n.language as "nl" | "en" | "fa",
      });
      await login({ username: email, password });
      const user = await fetchProfile();
      setUser(user);
      navigate("/intake");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: Record<string, string[]> } })
        ?.response?.data;
      setError(msg ? Object.values(msg).flat().join(" ") : t("auth.register_error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("auth.register")}</h1>

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
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          <label className={styles.label}>
            {t("auth.user_type")}
            <select
              className={styles.input}
              value={userType}
              onChange={e => setUserType(e.target.value)}
            >
              <option value="zzp">{t("user_types.zzp")}</option>
              <option value="employee">{t("user_types.employee")}</option>
              <option value="expat">{t("user_types.expat")}</option>
              <option value="dga">{t("user_types.dga")}</option>
            </select>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? "…" : t("auth.register")}
          </button>
        </form>

        <p className={styles.switch}>
          {t("auth.have_account")}{" "}
          <Link to="/login">{t("auth.login")}</Link>
        </p>
      </div>
    </main>
  );
}
