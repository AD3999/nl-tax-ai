import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { client as apiClient } from "../api/client";

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
  fontSize: "0.72rem",
  fontWeight: 700,
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.07em",
  marginBottom: 6,
  display: "block",
};

const SECTION_HEAD: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "0.8rem",
  color: "var(--text-3)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  margin: "0 0 var(--sp-5)",
};

export default function ClientProfilePage() {
  const { i18n } = useTranslation();
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
    personal: isFA ? "اطلاعات شخصی" : isNL ? "Persoonlijke gegevens" : "Personal Information",
    tax:      isFA ? "اطلاعات مالیاتی" : isNL ? "Belastinggegevens" : "Tax Information",
    notesSection: isFA ? "یادداشت‌ها" : isNL ? "Notities" : "Notes",
    emailReadOnly: isFA ? "ایمیل قابل تغییر نیست" : isNL ? "E-mail kan niet worden gewijzigd" : "Email cannot be changed",
    bsnHint:  isFA ? "اطلاعات حساس — فقط با حسابدار خود به اشتراک بگذارید" : isNL ? "Gevoelig — deel alleen met uw accountant" : "Sensitive — share only with your accountant",
  };

  const [form, setForm]   = useState<Partial<ClientProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
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

  return (
    <div dir={dir} style={{ maxWidth: 700, margin: "0 auto" }}>

      {/* Page header */}
      <div style={{ marginBottom: "var(--sp-6)" }}>
        <h1 style={{ fontWeight: 800, fontSize: "1.6rem", margin: "0 0 4px", letterSpacing: "-0.03em" }}>
          {T.title}
        </h1>
        <p style={{ margin: 0, color: "var(--text-3)", fontSize: "0.9rem" }}>{T.subtitle}</p>
      </div>

      {/* ── Personal Information ── */}
      <div className="card" style={{ marginBottom: "var(--sp-4)", padding: "var(--sp-6)" }}>
        <p style={SECTION_HEAD}>{T.personal}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>

          {/* Full Name */}
          <div>
            <label style={LABEL_STYLE}>{T.fullName}</label>
            <input className="input" type="text"
              value={(form.full_name ?? "") as string}
              placeholder="Jan de Vries"
              onChange={set("full_name")}
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label style={LABEL_STYLE}>{T.email}</label>
            <input className="input" type="email"
              value={(form.email ?? "") as string}
              readOnly
              style={{ opacity: 0.55, cursor: "not-allowed" }}
            />
            <span style={{ fontSize: "0.7rem", color: "var(--text-4)", marginTop: 4, display: "block" }}>
              {T.emailReadOnly}
            </span>
          </div>

          {/* Phone */}
          <div>
            <label style={LABEL_STYLE}>{T.phone}</label>
            <input className="input" type="tel"
              value={(form.phone ?? "") as string}
              placeholder="+31 6 12 34 56 78"
              onChange={set("phone")}
            />
          </div>

          {/* Date of Birth */}
          <div>
            <label style={LABEL_STYLE}>{T.birth}</label>
            <input className="input" type="date"
              value={(form.birth_date ?? "") as string}
              onChange={set("birth_date")}
            />
          </div>

          {/* Street — full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={LABEL_STYLE}>{T.street}</label>
            <input className="input" type="text"
              value={(form.address_street ?? "") as string}
              placeholder="Keizersgracht 123"
              onChange={set("address_street")}
            />
          </div>

          {/* City */}
          <div>
            <label style={LABEL_STYLE}>{T.city}</label>
            <input className="input" type="text"
              value={(form.address_city ?? "") as string}
              placeholder="Amsterdam"
              onChange={set("address_city")}
            />
          </div>

          {/* Postcode */}
          <div>
            <label style={LABEL_STYLE}>{T.postcode}</label>
            <input className="input" type="text"
              value={(form.address_postcode ?? "") as string}
              placeholder="1016 EG"
              onChange={set("address_postcode")}
            />
          </div>

        </div>
      </div>

      {/* ── Tax Information ── */}
      <div className="card" style={{ marginBottom: "var(--sp-4)", padding: "var(--sp-6)" }}>
        <p style={SECTION_HEAD}>{T.tax}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>

          {/* BSN */}
          <div>
            <label style={LABEL_STYLE}>{T.bsn}</label>
            <input className="input" type="text"
              value={(form.bsn ?? "") as string}
              placeholder="123456789"
              onChange={set("bsn")}
            />
            <span style={{ fontSize: "0.7rem", color: "var(--text-4)", marginTop: 4, display: "block" }}>
              {T.bsnHint}
            </span>
          </div>

          {/* KvK */}
          <div>
            <label style={LABEL_STYLE}>{T.kvk}</label>
            <input className="input" type="text"
              value={(form.kvk_number ?? "") as string}
              placeholder="12345678"
              onChange={set("kvk_number")}
            />
          </div>

          {/* BTW */}
          <div>
            <label style={LABEL_STYLE}>{T.btw}</label>
            <input className="input" type="text"
              value={(form.btw_number ?? "") as string}
              placeholder="NL123456789B01"
              onChange={set("btw_number")}
            />
          </div>

          {/* Tax Type */}
          <div>
            <label style={LABEL_STYLE}>{T.taxType}</label>
            <select className="input"
              value={form.tax_type ?? ""}
              onChange={set("tax_type")}
            >
              <option value="zzp">ZZP / Freelancer</option>
              <option value="employee">{isNL ? "Werknemer" : isFA ? "کارمند" : "Employee"}</option>
              <option value="expat">Expat</option>
              <option value="dga">DGA</option>
            </select>
          </div>

          {/* Preferred Language — full width */}
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={LABEL_STYLE}>{T.lang}</label>
            <select className="input"
              value={form.preferred_language ?? ""}
              onChange={set("preferred_language")}
              style={{ maxWidth: 280 }}
            >
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
              <option value="fa">فارسی</option>
            </select>
          </div>

        </div>
      </div>

      {/* ── Notes ── */}
      <div className="card" style={{ marginBottom: "var(--sp-6)", padding: "var(--sp-6)" }}>
        <p style={SECTION_HEAD}>{T.notesSection}</p>
        <textarea
          className="input"
          rows={4}
          style={{ width: "100%", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
          placeholder={
            isFA ? "یادداشت‌هایی برای حسابدار یا خودتان…" :
            isNL ? "Notities voor uw accountant of uzelf…" :
            "Notes for your accountant or yourself…"
          }
          value={form.notes ?? ""}
          onChange={set("notes")}
        />
      </div>

      {/* Save button */}
      <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
        <button
          className={saved ? "btn btn-ghost" : "btn btn-primary"}
          onClick={handleSave}
          disabled={saving}
          style={{ minWidth: 160 }}
        >
          {saved ? T.saved : saving ? "…" : T.save}
        </button>
      </div>

    </div>
  );
}
