import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, MapPin, CreditCard, Globe, FileText, Check, Shield } from "lucide-react";
import { client as apiClient } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useMobile } from "../hooks/useMobile";
import { getStoredConsent, saveConsent, type ConsentDecision } from "../components/CookieConsentBanner";

interface ClientProfile {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_postcode: string;
  bsn: string;
  kvk_number: string;
  btw_number: string;
  birth_date: string;
  tax_type: string;
  preferred_language: string;
  notes: string;
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "var(--text-xs)",
  fontWeight: 700,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 8,
  display: "block",
};


export default function ClientProfilePage() {
  const { i18n } = useTranslation();
  const { logout } = useAuth();
  const navigate   = useNavigate();
  const isMobile = useMobile();
  const isFA = i18n.language?.startsWith("fa");
  const isNL = i18n.language?.startsWith("nl");
  const dir  = isFA ? "rtl" : "ltr";

  const T = {
    title:    isFA ? "پروفایل من" : isNL ? "Mijn profiel" : "My Profile",
    subtitle: isFA ? "اطلاعات شخصی و مالیاتی خود را مدیریت کنید" : isNL ? "Beheer uw persoonlijke en belastinggegevens" : "Manage your personal and tax information",
    fullName: isFA ? "نام کامل" : isNL ? "Volledige naam" : "Full Name",
    email:    isFA ? "ایمیل" : isNL ? "E-mail" : "Email",
    phone:    isFA ? "تلفن" : isNL ? "Telefoon" : "Phone",
    street:   isFA ? "آدرس / خیابان" : isNL ? "Straat + huisnummer" : "Street & house number",
    city:     isFA ? "شهر" : isNL ? "Stad" : "City",
    postcode: isFA ? "کد پستی" : isNL ? "Postcode" : "Postcode",
    bsn:      isFA ? "شماره BSN" : isNL ? "BSN-nummer" : "BSN Number",
    kvk:      isFA ? "شماره KvK" : isNL ? "KvK-nummer" : "KvK Number",
    btw:      isFA ? "شماره BTW" : isNL ? "BTW-nummer" : "BTW Number",
    birth:    isFA ? "تاریخ تولد" : isNL ? "Geboortedatum" : "Date of Birth",
    taxType:  isFA ? "نوع مالیات‌دهنده" : isNL ? "Belastingtype" : "Tax Type",
    lang:     isFA ? "زبان ترجیحی" : isNL ? "Voorkeurstaal" : "Preferred Language",
    notes:    isFA ? "یادداشت‌ها" : isNL ? "Notities" : "Notes",
    save:     isFA ? "ذخیره تغییرات" : isNL ? "Wijzigingen opslaan" : "Save Changes",
    saved:    isFA ? "✓ ذخیره شد" : isNL ? "✓ Opgeslagen" : "✓ Saved",
    privacy:          isFA ? "حریم خصوصی و داده‌ها" : isNL ? "Privacy & gegevens" : "Privacy & Data",
    privacySubtitle:  isFA ? "حقوق شما تحت GDPR (AVG)" : isNL ? "Uw rechten onder de AVG" : "Your rights under GDPR",
    exportData:       isFA ? "دانلود داده‌های من" : isNL ? "Mijn gegevens downloaden" : "Download my data",
    exportDataHint:   isFA ? "دریافت کپی JSON از تمام داده‌های ذخیره‌شده" : isNL ? "Ontvang een JSON-kopie van al uw opgeslagen gegevens" : "Receive a JSON copy of all your stored data",
    deleteAccount:    isFA ? "حذف حساب کاربری" : isNL ? "Account verwijderen" : "Delete account",
    deleteAccountHint: isFA ? "تمام داده‌های شما بلافاصله ناشناس می‌شوند (قابل بازگشت نیست)" : isNL ? "Al uw gegevens worden direct geanonimiseerd (onomkeerbaar)" : "All your data will be anonymized immediately (irreversible)",
    clearAIMemory:    isFA ? "پاک کردن حافظه هوش مصنوعی" : isNL ? "AI-geheugen wissen" : "Clear AI memory",
    clearAIMemoryHint: isFA ? "تاریخچه گفتگو و اولویت‌های AI حذف می‌شوند" : isNL ? "Chat-geschiedenis en AI-voorkeuren worden gewist" : "Chat history and AI preferences will be cleared",
    requestSent:      isFA ? "درخواست ارسال شد" : isNL ? "Verzoek verzonden" : "Request sent",
    confirmDeleteTitle: isFA ? "حذف حساب کاربری؟" : isNL ? "Account verwijderen?" : "Delete account?",
    confirmDeleteBody:  isFA ? "تمام داده‌های شما بلافاصله ناشناس می‌شوند. این عمل قابل بازگشت نیست" : isNL ? "Al uw gegevens worden direct geanonimiseerd. Dit kan niet ongedaan worden gemaakt" : "All your data will be anonymized immediately. This cannot be undone",
    confirmYes:  isFA ? "بله، حذف شود" : isNL ? "Ja, verwijderen" : "Yes, delete",
    confirmNo:   isFA ? "لغو" : isNL ? "Annuleren" : "Cancel",
    errorRetry:  isFA ? "خطا — دوباره تلاش کنید" : isNL ? "Fout — probeer het opnieuw" : "Error — please try again",
    personal: isFA ? "اطلاعات شخصی" : isNL ? "Persoonlijke gegevens" : "Personal Information",
    tax:      isFA ? "اطلاعات مالیاتی" : isNL ? "Belastinggegevens" : "Tax Information",
    notesSection: isFA ? "یادداشت‌ها" : isNL ? "Notities" : "Notes",
    emailReadOnly: isFA ? "ایمیل قابل تغییر نیست" : isNL ? "E-mail kan niet worden gewijzigd" : "Email cannot be changed",
    bsnHint:  isFA ? "اطلاعات حساس — فقط با حسابدار خود به اشتراک بگذارید" : isNL ? "Gevoelig — deel alleen met uw accountant" : "Sensitive — share only with your accountant",
    cookieTitle:    isFA ? "کوکی‌های تحلیلی" : isNL ? "Analytische cookies" : "Analytics cookies",
    cookieHint:     isFA ? "آمار ناشناس برای بهبود برنامه (PostHog). هیچ داده شخصی ذخیره نمی‌شود" : isNL ? "Anonieme statistieken voor app-verbetering (PostHog). Geen persoonsgegevens opgeslagen" : "Anonymous usage statistics to improve the app (PostHog). No personal data stored",
    cookieAccepted: isFA ? "پذیرفته شده" : isNL ? "Geaccepteerd" : "Accepted",
    cookieRejected: isFA ? "رد شده" : isNL ? "Geweigerd" : "Rejected",
    cookieNotSet:   isFA ? "تنظیم نشده" : isNL ? "Niet ingesteld" : "Not set",
    cookieAccept:   isFA ? "تغییر به پذیرش" : isNL ? "Wijzigen naar accepteren" : "Change to accept",
    cookieReject:   isFA ? "تغییر به رد کردن" : isNL ? "Wijzigen naar weigeren" : "Change to reject",
  };

  const [form, setForm]   = useState<Partial<ClientProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [showBsn, setShowBsn] = useState(false);
  const [gdprStatus, setGdprStatus]   = useState<Record<string, boolean>>({});
  const [gdprLoading, setGdprLoading] = useState<string | null>(null);
  const [gdprError, setGdprError]     = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<ConsentDecision | null>(null);

  useEffect(() => {
    setCookieConsent(getStoredConsent()?.decision ?? null);
  }, []);

  const maskBsn = (raw: string) => {
    if (!raw || raw.length < 4) return raw;
    return "•".repeat(raw.length - 4) + raw.slice(-4);
  };

  useEffect(() => {
    apiClient.get<ClientProfile>("/portal/client/profile/")
      .then(r => { setForm(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch("/portal/client/profile/", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const handleGdprAction = async (key: string) => {
    setGdprError(null);
    if (key === "delete") {
      setDeleteConfirmOpen(true);
      return;
    }
    setGdprLoading(key);
    try {
      if (key === "export") {
        const r = await apiClient.get("/users/me/data-export/");
        const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "taxwijs-data-export.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setGdprStatus(prev => ({ ...prev, [key]: true }));
      } else if (key === "aiClear") {
        await apiClient.delete("/chat/history/");
        setGdprStatus(prev => ({ ...prev, [key]: true }));
      }
    } catch {
      setGdprError(key);
    } finally {
      setGdprLoading(null);
    }
  };

  const handleDeleteConfirm = async () => {
    setDeleteConfirmOpen(false);
    setGdprLoading("delete");
    try {
      await apiClient.delete("/users/me/", { data: { confirm: true } });
      logout();
      navigate("/");
    } catch {
      setGdprError("delete");
    } finally {
      setGdprLoading(null);
    }
  };

  const set = (key: keyof ClientProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  if (loading) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        <div className="skel" style={{ height: 28, width: 180, marginBottom: 8, borderRadius: 4 }} />
        <div className="skel" style={{ height: 14, width: 300, marginBottom: "var(--sp-6)", borderRadius: 4 }} />
        {[0, 1, 2].map(i => (
          <div key={i} className="card" style={{ marginBottom: "var(--sp-4)", padding: "var(--sp-6)" }}>
            <div className="skel" style={{ height: 10, width: 130, marginBottom: "var(--sp-5)", borderRadius: 3 }} />
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-4)" }}>
              {[0, 1, 2, 3].map(j => (
                <div key={j}>
                  <div className="skel" style={{ height: 8, width: 70, marginBottom: 8, borderRadius: 3 }} />
                  <div className="skel" style={{ height: 40, borderRadius: 8 }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const initials = ((form.full_name as string | undefined) ?? (form.email as string | undefined) ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div dir={dir} style={{ maxWidth: 720, margin: "0 auto" }}>

      {/* ── Profile header ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "var(--sp-4)",
        marginBottom: "var(--sp-6)",
        padding: isMobile ? "var(--sp-4) var(--sp-5)" : "var(--sp-5) var(--sp-6)",
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-xl)",
        borderInlineStart: "4px solid var(--blue)",
        flexWrap: "wrap",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--blue) 0%, var(--blue-text) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.3rem", fontWeight: 800, color: "#fff", flexShrink: 0,
          boxShadow: "0 4px 16px var(--blue)44",
        }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontWeight: 800, fontSize: isMobile ? "var(--text-xl)" : "var(--text-2xl)", margin: "0 0 3px", letterSpacing: "-0.03em", color: "var(--text)" }}>
            {T.title}
          </h1>
          <p style={{ margin: 0, color: "var(--text-3)", fontSize: "var(--text-sm)" }}>{T.subtitle}</p>
        </div>
        <button
          className={saved ? "btn btn-ghost" : "btn btn-accent"}
          onClick={handleSave}
          disabled={saving}
          style={{ flex: isMobile ? "0 0 100%" : "0 0 auto", minWidth: isMobile ? "auto" : 140, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          {saved ? <><Check size={14} /> {T.saved}</> : saving ? "…" : T.save}
        </button>
      </div>

      {/* ── Personal Information ── */}
      <div className="card" style={{ marginBottom: "var(--sp-5)", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          padding: "var(--sp-4) var(--sp-6)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-3)",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--blue-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <User size={15} style={{ color: "var(--blue)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", letterSpacing: "-0.01em" }}>{T.personal}</span>
        </div>

        <div style={{ padding: "var(--sp-6)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-6)" }}>

          <div>
            <label style={LABEL_STYLE}>{T.fullName}</label>
            <input className="tw-input" type="text" value={(form.full_name ?? "") as string} placeholder="Jan de Vries" onChange={set("full_name")} />
          </div>

          <div>
            <label style={LABEL_STYLE}>{T.email}</label>
            <input className="tw-input" type="email" value={(form.email ?? "") as string} readOnly
              style={{ opacity: 0.5, cursor: "not-allowed", background: "var(--bg-3)" }} />
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-4)", marginTop: 6, display: "block" }}>{T.emailReadOnly}</span>
          </div>

          <div>
            <label style={LABEL_STYLE}>{T.phone}</label>
            <input className="tw-input" type="tel" value={(form.phone ?? "") as string} placeholder="+31 6 12 34 56 78" onChange={set("phone")} />
          </div>

          <div>
            <label style={LABEL_STYLE}>{T.birth}</label>
            <input className="tw-input" type="date" value={(form.birth_date ?? "") as string} onChange={set("birth_date")} />
          </div>
        </div>
      </div>

      {/* ── Address ── */}
      <div className="card" style={{ marginBottom: "var(--sp-5)", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          padding: "var(--sp-4) var(--sp-6)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-3)",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--ok-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <MapPin size={15} style={{ color: "var(--ok)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", letterSpacing: "-0.01em" }}>
            {isFA ? "آدرس" : isNL ? "Adres" : "Address"}
          </span>
        </div>
        <div style={{ padding: "var(--sp-6)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-6)" }}>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={LABEL_STYLE}>{T.street}</label>
            <input className="tw-input" type="text" value={(form.address_street ?? "") as string} placeholder="Keizersgracht 123" onChange={set("address_street")} />
          </div>
          <div>
            <label style={LABEL_STYLE}>{T.city}</label>
            <input className="tw-input" type="text" value={(form.address_city ?? "") as string} placeholder="Amsterdam" onChange={set("address_city")} />
          </div>
          <div>
            <label style={LABEL_STYLE}>{T.postcode}</label>
            <input className="tw-input" type="text" value={(form.address_postcode ?? "") as string} placeholder="1016 EG" onChange={set("address_postcode")} />
          </div>
        </div>
      </div>

      {/* ── Tax Information ── */}
      <div className="card" style={{ marginBottom: "var(--sp-5)", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          padding: "var(--sp-4) var(--sp-6)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-3)",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--warn-subtle)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CreditCard size={15} style={{ color: "var(--warn)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", letterSpacing: "-0.01em" }}>{T.tax}</span>
        </div>
        <div style={{ padding: "var(--sp-6)", display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-6)" }}>

          <div>
            <label style={LABEL_STYLE}>{T.bsn}</label>
            {/* PROVISIONAL — legal copy not yet reviewed. See LEGAL_REVIEW_NEEDED.md Item 1. */}
            <div style={{ padding: "10px 14px", background: "var(--warn-subtle)", border: "1px solid var(--warn-border)", borderRadius: "var(--r-sm)", marginBottom: 8, fontSize: "var(--text-xs)", color: "var(--warn-text)", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <Shield size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>
                {isNL ? "BSN is een bijzonder persoonsgegeven (UAVG). TaxWijs verwerkt dit alleen met expliciete wettelijke grondslag voor belastingaangifteondersteuning. Neem contact op voor vragen." : isFA ? "BSN یک داده حساس است (UAVG). TaxWijs این را تنها با مجوز قانونی پردازش می‌کند." : "BSN is a specially protected identifier (UAVG). TaxWijs processes it only with statutory authorization for tax-return support."}
              </span>
            </div>
            <div style={{ position: "relative" }}>
              <input
                className="tw-input"
                type={showBsn ? "text" : "password"}
                value={(form.bsn ?? "") as string}
                placeholder={showBsn ? "123456789" : "•••••••••"}
                onChange={set("bsn")}
                autoComplete="off"
                style={{ paddingInlineEnd: 80 }}
              />
              <div style={{ position: "absolute", insetInlineEnd: 8, top: "50%", transform: "translateY(-50%)", display: "flex", gap: 4 }}>
                <button type="button" onClick={() => setShowBsn(v => !v)} style={{ fontSize: "var(--text-xs)", color: "var(--text-3)", background: "none", border: "none", cursor: "pointer", padding: "2px 4px" }}>
                  {showBsn ? (isNL ? "Verberg" : isFA ? "پنهان" : "Hide") : (isNL ? "Toon" : isFA ? "نمایش" : "Show")}
                </button>
                <Shield size={13} style={{ color: "var(--text-4)" }} />
              </div>
            </div>
            {form.bsn && !showBsn && (
              <span style={{ fontSize: "var(--text-xs)", color: "var(--text-4)", marginTop: 4, display: "block" }}>{maskBsn(form.bsn as string)}</span>
            )}
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-4)", marginTop: 4, display: "block" }}>{T.bsnHint}</span>
          </div>

          <div>
            <label style={LABEL_STYLE}>{T.kvk}</label>
            <input className="tw-input" type="text" value={(form.kvk_number ?? "") as string} placeholder="12345678" onChange={set("kvk_number")} />
          </div>

          <div>
            <label style={LABEL_STYLE}>{T.btw}</label>
            <input className="tw-input" type="text" value={(form.btw_number ?? "") as string} placeholder="NL123456789B01" onChange={set("btw_number")} />
          </div>

          <div>
            <label style={LABEL_STYLE}>{T.taxType}</label>
            <select className="tw-input" value={form.tax_type ?? ""} onChange={set("tax_type")}>
              <option value="zzp">ZZP / Freelancer</option>
              <option value="employee">{isNL ? "Werknemer" : isFA ? "کارمند" : "Employee"}</option>
              <option value="expat">Expat</option>
              <option value="dga">DGA</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Preferences ── */}
      <div className="card" style={{ marginBottom: "var(--sp-5)", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          padding: "var(--sp-4) var(--sp-6)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-3)",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--purple-subtle, #ede9fe)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Globe size={15} style={{ color: "var(--purple)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", letterSpacing: "-0.01em" }}>
            {isFA ? "تنظیمات" : isNL ? "Voorkeuren" : "Preferences"}
          </span>
        </div>
        <div style={{ padding: "var(--sp-6)" }}>
          <label style={LABEL_STYLE}>{T.lang}</label>
          <select className="tw-input" value={form.preferred_language ?? ""} onChange={set("preferred_language")} style={{ maxWidth: 280 }}>
            <option value="nl">Nederlands</option>
            <option value="en">English</option>
            <option value="fa">فارسی</option>
          </select>
        </div>
      </div>

      {/* ── Notes ── */}
      <div className="card" style={{ marginBottom: "var(--sp-8)", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          padding: "var(--sp-4) var(--sp-6)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-3)",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--bg-4, var(--bg-3))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={15} style={{ color: "var(--text-3)" }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", letterSpacing: "-0.01em" }}>{T.notesSection}</span>
        </div>
        <div style={{ padding: "var(--sp-6)" }}>
          <textarea
            className="tw-input"
            rows={4}
            style={{ width: "100%", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
            placeholder={isFA ? "یادداشت‌هایی برای حسابدار یا خودتان…" : isNL ? "Notities voor uw accountant of uzelf…" : "Notes for your accountant or yourself…"}
            value={form.notes ?? ""}
            onChange={set("notes")}
          />
        </div>
      </div>

      {/* ── Privacy & Data (GDPR / AVG self-service) ── */}
      <div className="card" style={{ marginBottom: "var(--sp-5)", overflow: "hidden" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "var(--sp-3)",
          padding: "var(--sp-4) var(--sp-6)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-3)",
        }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--blue-subtle, var(--blue))", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Shield size={15} style={{ color: "var(--blue)" }} />
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text)", display: "block" }}>{T.privacy}</span>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--text-4)" }}>{T.privacySubtitle}</span>
          </div>
        </div>
        <div style={{ padding: "var(--sp-5) var(--sp-6)", display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          {/* Cookie consent toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text)" }}>{T.cookieTitle}</div>
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-4)", marginTop: 2 }}>{T.cookieHint}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)", flexShrink: 0 }}>
              <span style={{
                fontSize: "var(--text-xs)", fontWeight: 700, padding: "2px 10px", borderRadius: 999,
                background: cookieConsent === "accepted" ? "var(--ok-subtle, #dcfce7)" : cookieConsent === "rejected" ? "var(--warn-subtle, #fef3c7)" : "var(--bg-3)",
                color: cookieConsent === "accepted" ? "var(--ok)" : cookieConsent === "rejected" ? "var(--warn, #92400e)" : "var(--text-4)",
              }}>
                {cookieConsent === "accepted" ? T.cookieAccepted : cookieConsent === "rejected" ? T.cookieRejected : T.cookieNotSet}
              </span>
              <button
                className="btn btn-ghost btn-sm"
                style={{ flexShrink: 0 }}
                onClick={() => {
                  const next: ConsentDecision = cookieConsent === "accepted" ? "rejected" : "accepted";
                  saveConsent(next);
                  setCookieConsent(next);
                }}
              >
                {cookieConsent === "accepted" ? T.cookieReject : T.cookieAccept}
              </button>
            </div>
          </div>
          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: 0 }} />
          {[
            { key: "export",   label: T.exportData,    hint: T.exportDataHint,    danger: false },
            { key: "aiClear",  label: T.clearAIMemory, hint: T.clearAIMemoryHint, danger: false },
            { key: "delete",   label: T.deleteAccount, hint: T.deleteAccountHint, danger: true  },
          ].map(action => (
            <div key={action.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: action.danger ? "var(--danger)" : "var(--text)" }}>{action.label}</div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-4)", marginTop: 2 }}>{action.hint}</div>
                {gdprError === action.key && (
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginTop: 4 }}>{T.errorRetry}</div>
                )}
              </div>
              {gdprStatus[action.key] ? (
                <span className="pill pill-ok" style={{ flexShrink: 0 }}>{T.requestSent}</span>
              ) : (
                <button
                  className={action.danger ? "btn btn-sm" : "btn btn-ghost btn-sm"}
                  style={action.danger ? { color: "var(--danger)", borderColor: "var(--danger)", flexShrink: 0 } : { flexShrink: 0 }}
                  disabled={gdprLoading === action.key}
                  onClick={() => handleGdprAction(action.key)}
                >
                  {gdprLoading === action.key ? "…" : action.label}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom save bar */}
      <div style={{
        position: "sticky", bottom: "var(--sp-5)",
        display: "flex", justifyContent: "flex-end",
        padding: "var(--sp-4) var(--sp-6)",
        background: "var(--bg-2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--sh-md)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>
        <button
          className={saved ? "btn btn-ghost" : "btn btn-accent"}
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: 160, display: "flex", alignItems: "center", gap: 6 }}
        >
          {saved ? <><Check size={14} /> {T.saved}</> : saving ? "…" : T.save}
        </button>
      </div>

      {/* Delete account confirmation modal */}
      {deleteConfirmOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "var(--sp-4)",
        }} onClick={() => setDeleteConfirmOpen(false)}>
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: "var(--sp-6)",
            maxWidth: 400, width: "100%",
            boxShadow: "var(--sh-lg)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontWeight: 800, fontSize: "var(--text-lg)", marginBottom: "var(--sp-3)", color: "var(--danger)" }}>
              {T.confirmDeleteTitle}
            </div>
            <div style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", marginBottom: "var(--sp-5)", lineHeight: 1.6 }}>
              {T.confirmDeleteBody}
            </div>
            <div style={{ display: "flex", gap: "var(--sp-3)", justifyContent: "flex-end" }}>
              <button className="btn btn-ghost btn-sm" onClick={() => setDeleteConfirmOpen(false)}>
                {T.confirmNo}
              </button>
              <button
                className="btn btn-sm"
                style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
                onClick={handleDeleteConfirm}
              >
                {T.confirmYes}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
