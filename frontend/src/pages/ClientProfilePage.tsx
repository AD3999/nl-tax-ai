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

export default function ClientProfilePage() {
  const { i18n } = useTranslation();
  const isFA = i18n.language?.startsWith("fa");
  const isNL = i18n.language?.startsWith("nl");
  const dir  = isFA ? "rtl" : "ltr";

  const T = {
    title:     isFA ? "پروفایل من" : isNL ? "Mijn profiel" : "My Profile",
    fullName:  isFA ? "نام کامل" : isNL ? "Volledige naam" : "Full Name",
    email:     isFA ? "ایمیل" : isNL ? "E-mail" : "Email",
    phone:     isFA ? "تلفن" : isNL ? "Telefoon" : "Phone",
    street:    isFA ? "آدرس" : isNL ? "Straat" : "Street",
    city:      isFA ? "شهر" : isNL ? "Stad" : "City",
    postcode:  isFA ? "کد پستی" : isNL ? "Postcode" : "Postcode",
    bsn:       isFA ? "شماره BSN" : isNL ? "BSN-nummer" : "BSN Number",
    kvk:       isFA ? "شماره KvK" : isNL ? "KvK-nummer" : "KvK Number",
    btw:       isFA ? "شماره BTW" : isNL ? "BTW-nummer" : "BTW Number",
    birth:     isFA ? "تاریخ تولد" : isNL ? "Geboortedatum" : "Date of Birth",
    taxType:   isFA ? "نوع مالیات‌دهنده" : isNL ? "Belastingtype" : "Tax Type",
    lang:      isFA ? "زبان ترجیحی" : isNL ? "Voorkeurstaal" : "Preferred Language",
    notes:     isFA ? "یادداشت‌ها" : isNL ? "Notities" : "Notes",
    save:      isFA ? "ذخیره" : isNL ? "Opslaan" : "Save",
    saved:     isFA ? "ذخیره شد!" : isNL ? "Opgeslagen!" : "Saved!",
    personal:  isFA ? "اطلاعات شخصی" : isNL ? "Persoonlijke gegevens" : "Personal Information",
    tax:       isFA ? "اطلاعات مالیاتی" : isNL ? "Belastinggegevens" : "Tax Information",
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

  const F = (key: keyof ClientProfile, label: string, type = "text", readOnly = false) => (
    <div>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
      <input
        className="input"
        type={type}
        value={(form[key] ?? "") as string}
        readOnly={readOnly}
        style={{ opacity: readOnly ? 0.6 : 1 }}
        onChange={e => !readOnly && setForm({ ...form, [key]: e.target.value })}
      />
    </div>
  );

  if (loading) return (
    <div dir={dir} style={{ maxWidth: 700, margin: "0 auto", padding: "var(--sp-6) var(--sp-4)" }}>
      <div className="skel" style={{ height: 500 }} />
    </div>
  );

  return (
    <div dir={dir} style={{ maxWidth: 700, margin: "0 auto", padding: "var(--sp-6) var(--sp-4)" }}>
      <h1 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: "var(--sp-6)" }}>{T.title}</h1>

      {/* Personal */}
      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "var(--sp-4)" }}>{T.personal}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
          {F("full_name", T.fullName)}
          {F("email", T.email, "email")}
          {F("phone", T.phone)}
          {F("birth_date", T.birth, "date")}
          {F("address_street", T.street)}
          {F("address_city", T.city)}
          {F("address_postcode", T.postcode)}
        </div>
      </div>

      {/* Tax */}
      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "var(--sp-4)" }}>{T.tax}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--sp-4)" }}>
          {F("bsn", T.bsn)}
          {F("kvk_number", T.kvk)}
          {F("btw_number", T.btw)}
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>{T.taxType}</label>
            <select className="input" value={form.tax_type ?? ""} onChange={e => setForm({ ...form, tax_type: e.target.value })}>
              <option value="zzp">ZZP</option>
              <option value="employee">Werknemer / Employee</option>
              <option value="expat">Expat</option>
              <option value="dga">DGA</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>{T.lang}</label>
            <select className="input" value={form.preferred_language ?? ""} onChange={e => setForm({ ...form, preferred_language: e.target.value })}>
              <option value="nl">Nederlands</option>
              <option value="en">English</option>
              <option value="fa">فارسی</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "var(--sp-4)" }}>{T.notes}</h2>
        <textarea
          className="input"
          rows={4}
          style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
          value={form.notes ?? ""}
          onChange={e => setForm({ ...form, notes: e.target.value })}
        />
      </div>

      <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 140 }}>
        {saved ? T.saved : saving ? "…" : T.save}
      </button>
    </div>
  );
}
