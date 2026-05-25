import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { register, login, fetchProfile } from "../api/auth";
import { useAuth } from "../context/AuthContext";
const inputCls = "w-full px-3 py-2.5 border border-[var(--border)] rounded-lg bg-[var(--bg)] text-[var(--text-h)] font-[inherit] text-[15px] outline-none transition-colors focus:border-[var(--accent)]";

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
    <main className="min-h-[calc(100svh-52px)] flex items-center justify-center p-8">
      <div className="w-full max-w-sm bg-[var(--bg)] border border-[var(--border)] rounded-xl p-10 shadow-[var(--shadow)]">
        <h1 className="text-2xl font-bold text-[var(--text-h)] m-0 mb-7 text-center">{t("auth.register")}</h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-[var(--text)]">
            {t("auth.email")}
            <input type="email" className={inputCls} value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-[var(--text)]">
            {t("auth.password")}
            <input type="password" className={inputCls} value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete="new-password" />
          </label>

          <label className="flex flex-col gap-1.5 text-sm text-[var(--text)]">
            {t("auth.user_type")}
            <select className={inputCls} value={userType} onChange={e => setUserType(e.target.value)}>
              <option value="zzp">{t("user_types.zzp")}</option>
              <option value="employee">{t("user_types.employee")}</option>
              <option value="expat">{t("user_types.expat")}</option>
              <option value="dga">{t("user_types.dga")}</option>
            </select>
          </label>

          {error && <p className="text-sm text-red-500 m-0">{error}</p>}

          <button type="submit" className="mt-1 py-2.5 px-4 bg-[var(--accent)] text-white border-none rounded-lg font-[inherit] text-[15px] font-semibold cursor-pointer hover:opacity-85 disabled:opacity-60 disabled:cursor-not-allowed transition-opacity" disabled={loading}>
            {loading ? "…" : t("auth.register")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--text)] m-0">
          {t("auth.have_account")}{" "}
          <Link to="/login" className="text-[var(--accent)] font-semibold no-underline">{t("auth.login")}</Link>
        </p>
      </div>
    </main>
  );
}
