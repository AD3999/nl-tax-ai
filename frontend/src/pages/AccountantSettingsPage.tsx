import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { client as apiClient } from "../api/client";
import { useMobile } from "../hooks/useMobile";

// WCAG 2.1 relative luminance for a hex color
function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0.5;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const [lighter, darker] = lA > lB ? [lA, lB] : [lB, lA];
  return (lighter + 0.05) / (darker + 0.05);
}

interface AccountantSetup {
  firm_name: string;
  kvk_number: string;
  btw_number: string;
  phone: string;
  address_street: string;
  address_city: string;
  address_postcode: string;
  logo_url: string | null;
  accent_color: string;
  email_signature: string;
  reminder_default_days: number;
  default_engagement_type: string;
  max_clients: number;
  plan: string;
}

export default function AccountantSettingsPage() {
  const { i18n } = useTranslation();
  const isMobile = useMobile();
  const isFA = i18n.language?.startsWith("fa");
  const isNL = i18n.language?.startsWith("nl");

  const [form, setForm] = useState<Partial<AccountantSetup>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const T = {
    title:        isFA ? "تنظیمات حسابدار" : isNL ? "Accountantsinstellingen" : "Accountant Settings",
    firmName:     isFA ? "نام شرکت" : isNL ? "Naam kantoor" : "Firm Name",
    kvk:          isFA ? "شماره KvK" : isNL ? "KvK-nummer" : "KvK Number",
    btw:          isFA ? "شماره BTW" : isNL ? "BTW-nummer" : "BTW Number",
    phone:        isFA ? "تلفن" : isNL ? "Telefoon" : "Phone",
    street:       isFA ? "آدرس" : isNL ? "Straat" : "Street",
    city:         isFA ? "شهر" : isNL ? "Stad" : "City",
    postcode:     isFA ? "کد پستی" : isNL ? "Postcode" : "Postcode",
    accentColor:  isFA ? "رنگ برند" : isNL ? "Accentkleur" : "Brand Color",
    signature:    isFA ? "امضای ایمیل" : isNL ? "E-mailhandtekening" : "Email Signature",
    reminderDays: isFA ? "روزهای پیش‌فرض یادآوری" : isNL ? "Standaard herinnering (dagen)" : "Default Reminder Days",
    save:         isFA ? "ذخیره" : isNL ? "Opslaan" : "Save Settings",
    saved:        isFA ? "ذخیره شد!" : isNL ? "Opgeslagen!" : "Saved!",
    plan:         isFA ? "طرح" : isNL ? "Abonnement" : "Plan",
    maxClients:   isFA ? "حداکثر مشتریان" : isNL ? "Max. cliënten" : "Max Clients",
    branding:     isFA ? "برندینگ" : isNL ? "Huisstijl" : "Branding",
    contrastOk:        isFA ? "کنتراست خوب" : isNL ? "Contrast voldoende" : "Contrast OK",
    contrastWarn:      isFA ? "کنتراست ضعیف (WCAG AA نیاز دارد ۴.۵:۱)" : isNL ? "Contrast te laag (WCAG AA vereist 4,5:1)" : "Contrast too low (WCAG AA requires 4.5:1)",
    contrastLight:     isFA ? "پس‌زمینه روشن" : isNL ? "Lichte achtergrond" : "Light bg",
    contrastDark:      isFA ? "پس‌زمینه تاریک" : isNL ? "Donkere achtergrond" : "Dark bg",
    contact:      isFA ? "اطلاعات تماس" : isNL ? "Contactgegevens" : "Contact Info",
    subscription: isFA ? "اشتراک" : isNL ? "Abonnement" : "Subscription",
  };

  useEffect(() => {
    apiClient.get<AccountantSetup>("/users/accountant/setup/")
      .then(r => { setForm(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.patch("/users/accountant/setup/", form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof AccountantSetup, label: string, type: string = "text") => (
    <div>
      <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>{label}</label>
      <input
        className="input"
        type={type}
        value={(form[key] ?? "") as string}
        onChange={e => setForm({ ...form, [key]: type === "number" ? +e.target.value : e.target.value })}
      />
    </div>
  );

  const accentColor = form.accent_color ?? "#3b82f6";
  const passesLight = contrastRatio(accentColor, "#ffffff") >= 4.5;
  const passesDark  = contrastRatio(accentColor, "#111827") >= 4.5;
  const contrastBlocked = !passesLight && !passesDark;

  if (loading) return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "var(--sp-6) var(--sp-4)" }}>
      <div className="skel" style={{ height: 500 }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: "var(--sp-6) var(--sp-4)" }}>
      <h1 style={{ fontWeight: 800, fontSize: "1.8rem", marginBottom: "var(--sp-6)" }}>{T.title}</h1>

      {/* Contact info */}
      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "var(--sp-4)" }}>{T.contact}</h2>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-4)" }}>
          {field("firm_name", T.firmName)}
          {field("phone", T.phone)}
          {field("kvk_number", T.kvk)}
          {field("btw_number", T.btw)}
          {field("address_street", T.street)}
          {field("address_city", T.city)}
          {field("address_postcode", T.postcode)}
        </div>
      </div>

      {/* Branding */}
      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "var(--sp-4)" }}>{T.branding}</h2>
        <div style={{ display: "grid", gap: "var(--sp-4)" }}>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>{T.accentColor}</label>
            <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
              <input type="color" value={form.accent_color ?? "#3b82f6"} onChange={e => setForm({ ...form, accent_color: e.target.value })} style={{ width: 44, height: 36, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }} />
              <input className="input" style={{ flex: 1 }} value={form.accent_color ?? "#3b82f6"} onChange={e => setForm({ ...form, accent_color: e.target.value })} />
            </div>
            {(() => {
              const ratioLight = contrastRatio(accentColor, "#ffffff");
              const ratioDark  = contrastRatio(accentColor, "#111827");
              return (
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { label: T.contrastLight, ratio: ratioLight, passes: passesLight },
                    { label: T.contrastDark,  ratio: ratioDark,  passes: passesDark  },
                  ].map(({ label, ratio, passes }) => (
                    <div key={label} style={{ fontSize: "var(--text-xs)", display: "flex", alignItems: "center", gap: 6, color: passes ? "var(--ok)" : "var(--danger)" }}>
                      <span style={{ fontWeight: 700 }}>{ratio.toFixed(1)}:1</span>
                      <span style={{ color: "var(--text-3)" }}>{label}</span>
                      <span>{passes ? T.contrastOk : T.contrastWarn}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
          <div>
            <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>{T.signature}</label>
            <textarea
              className="input"
              rows={4}
              style={{ width: "100%", resize: "vertical", fontFamily: "inherit" }}
              value={form.email_signature ?? ""}
              onChange={e => setForm({ ...form, email_signature: e.target.value })}
            />
          </div>
          {field("reminder_default_days", T.reminderDays, "number")}
        </div>
      </div>

      {/* Subscription (read-only) */}
      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <h2 style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "var(--sp-4)" }}>{T.subscription}</h2>
        <div style={{ display: "flex", gap: "var(--sp-6)" }}>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>{T.plan}</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginTop: 4 }}>{form.plan ?? "—"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--text-3)", fontWeight: 600 }}>{T.maxClients}</div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginTop: 4 }}>{form.max_clients ?? "—"}</div>
          </div>
        </div>
      </div>

      {contrastBlocked && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--danger)", marginBottom: "var(--sp-2)" }}>
          {isFA ? "رنگ برند باید حداقل کنتراست ۴.۵:۱ را بر روی یک پس‌زمینه داشته باشد (WCAG AA)."
                : isNL ? "Accentkleur moet minimaal 4,5:1 contrast hebben op één achtergrond (WCAG AA)."
                : "Brand color must pass 4.5:1 contrast on at least one background (WCAG AA)."}
        </p>
      )}
      <button
        className="btn btn-primary"
        onClick={handleSave}
        disabled={saving || contrastBlocked}
        style={{ minWidth: 140 }}
      >
        {saved ? T.saved : saving ? "…" : T.save}
      </button>
    </div>
  );
}
