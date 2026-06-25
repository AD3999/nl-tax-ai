import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { client as apiClient } from "../api/client";
import { useMobile } from "../hooks/useMobile";
import {
  Building2, Phone, Hash, Receipt, MapPin, Mail,
  Palette, Clock, Users, CreditCard, CheckCircle, Save,
} from "lucide-react";

// ── WCAG 2.1 contrast helpers ───────────────────────────────────────
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
  is_verified?: boolean;
}

// ── Reusable field components ────────────────────────────────────────
function FieldGroup({
  label, hint, icon: Icon, children,
}: {
  label: string; hint?: string; icon?: React.ElementType; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{
        fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-2)",
        letterSpacing: "0.02em", textTransform: "uppercase",
        display: "flex", alignItems: "center", gap: 5,
      }}>
        {Icon && <Icon size={11} style={{ color: "var(--text-4)", flexShrink: 0 }} />}
        {label}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: "var(--text-xs)", color: "var(--text-4)", margin: 0, lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      className="input"
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      style={{ width: "100%", boxSizing: "border-box" }}
    />
  );
}

// ── Section card wrapper ─────────────────────────────────────────────
function Section({
  icon: Icon, title, description, children,
}: {
  icon: React.ElementType; title: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ padding: "var(--sp-6)", marginBottom: "var(--sp-5)" }}>
      <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "flex-start", marginBottom: "var(--sp-5)" }}>
        <div style={{
          width: 36, height: 36, borderRadius: "var(--r-sm)",
          background: "var(--accent-soft)", border: "1px solid var(--accent-line)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={16} style={{ color: "var(--accent)" }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text)" }}>
            {title}
          </h2>
          <p style={{ margin: "2px 0 0", fontSize: "var(--text-xs)", color: "var(--text-3)", lineHeight: 1.5 }}>
            {description}
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function AccountantSettingsPage() {
  const { i18n } = useTranslation();
  const isMobile = useMobile();
  const isFA = i18n.language?.startsWith("fa");
  const isNL = i18n.language?.startsWith("nl");

  const T = {
    title:        isFA ? "تنظیمات حسابدار" : isNL ? "Accountantsinstellingen" : "Accountant Settings",
    subtitle:     isFA ? "اطلاعات شرکت، برندینگ و اشتراک خود را مدیریت کنید"
                : isNL ? "Beheer uw kantoorgegevens, huisstijl en abonnement"
                : "Manage your firm information, branding and subscription",
    contact:      isFA ? "اطلاعات تماس" : isNL ? "Contactgegevens" : "Contact Information",
    contactDesc:  isFA ? "این اطلاعات در اسناد مشتری نمایش داده می‌شود"
                : isNL ? "Deze gegevens verschijnen op cliëntdocumenten"
                : "This information appears on client-facing documents and invoices",
    firmName:     isFA ? "نام شرکت" : isNL ? "Naam kantoor" : "Firm Name",
    phone:        isFA ? "تلفن" : isNL ? "Telefoon" : "Phone",
    kvk:          isFA ? "شماره KvK" : isNL ? "KvK-nummer" : "KvK Number",
    btw:          isFA ? "شماره BTW" : isNL ? "BTW-nummer" : "BTW Number",
    street:       isFA ? "آدرس خیابان" : isNL ? "Straat" : "Street Address",
    city:         isFA ? "شهر" : isNL ? "Stad" : "City",
    postcode:     isFA ? "کد پستی" : isNL ? "Postcode" : "Postcode",
    branding:     isFA ? "برندینگ" : isNL ? "Huisstijl" : "Branding",
    brandingDesc: isFA ? "رنگ و امضای برند خود را سفارشی کنید"
                : isNL ? "Pas uw merkkleur en handtekening aan"
                : "Customise your brand color and email signature",
    accentColor:  isFA ? "رنگ برند" : isNL ? "Merkkleur" : "Brand Color",
    colorHint:    isFA ? "این رنگ در داشبورد مشتری و ایمیل‌های شما نمایش داده می‌شود"
                : isNL ? "Wordt gebruikt in het cliëntportaal en uw e-mails"
                : "Used across the client portal and your outgoing emails",
    signature:    isFA ? "امضای ایمیل" : isNL ? "E-mailhandtekening" : "Email Signature",
    sigHint:      isFA ? "در پایین همه ایمیل‌های خروجی اضافه می‌شود"
                : isNL ? "Wordt toegevoegd aan alle uitgaande e-mails"
                : "Appended to the bottom of all outgoing client emails",
    preferences:  isFA ? "تنظیمات" : isNL ? "Voorkeuren" : "Preferences",
    prefDesc:     isFA ? "رفتار پیش‌فرض برای یادآوری‌ها را تنظیم کنید"
                : isNL ? "Stel standaardgedrag voor herinneringen in"
                : "Configure default behaviour for reminders and workflows",
    reminderDays: isFA ? "روزهای پیش‌فرض یادآوری" : isNL ? "Standaard herinnering (dagen)" : "Default Reminder Days",
    reminderHint: isFA ? "چند روز قبل از مهلت به مشتریان یادآوری شود"
                : isNL ? "Hoeveel dagen vóór een deadline een herinnering sturen"
                : "How many days before a deadline to send client reminders",
    subscription: isFA ? "اشتراک" : isNL ? "Abonnement" : "Subscription",
    subDesc:      isFA ? "مشخصات طرح فعلی شما (فقط خواندنی)"
                : isNL ? "Details van uw huidige abonnement (alleen-lezen)"
                : "Your current plan details (read-only — contact support to upgrade)",
    plan:         isFA ? "طرح" : isNL ? "Abonnement" : "Plan",
    maxClients:   isFA ? "حداکثر مشتریان" : isNL ? "Max. cliënten" : "Max Clients",
    save:         isFA ? "ذخیره تغییرات" : isNL ? "Wijzigingen opslaan" : "Save Changes",
    saved:        isFA ? "تغییرات ذخیره شد!" : isNL ? "Wijzigingen opgeslagen!" : "Changes saved!",
    contrastOk:   isFA ? "کنتراست کافی" : isNL ? "Contrast voldoende" : "Contrast OK",
    contrastWarn: isFA ? "کنتراست ضعیف (WCAG AA: ۴.۵:۱)" : isNL ? "Contrast te laag (WCAG AA: 4,5:1)" : "Contrast too low (WCAG AA: 4.5:1)",
    contrastLight: isFA ? "پس‌زمینه روشن" : isNL ? "Lichte achtergrond" : "Light bg",
    contrastDark:  isFA ? "پس‌زمینه تاریک" : isNL ? "Donkere achtergrond" : "Dark bg",
    wcagBlock:    isFA ? "رنگ باید حداقل ۴.۵:۱ کنتراست روی یک پس‌زمینه داشته باشد (WCAG AA)"
                : isNL ? "Kleur moet minimaal 4,5:1 contrast hebben op één achtergrond (WCAG AA)"
                : "Brand color must pass 4.5:1 contrast on at least one background (WCAG AA)",
    pendingTitle: isFA ? "تأیید در انتظار" : isNL ? "Verificatie in behandeling" : "Verification Pending",
    pendingBody:  isFA ? "حساب شما هنوز توسط TaxWijs تأیید نشده است. پس از تأیید یک ایمیل دریافت خواهید کرد."
                : isNL ? "Uw account is nog niet geverifieerd door TaxWijs. U ontvangt een e-mail zodra uw account is goedgekeurd."
                : "Your account is pending verification by TaxWijs. You will receive an email once your account has been approved.",
  };

  const [form, setForm]     = useState<Partial<AccountantSetup>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);

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

  const set = (key: keyof AccountantSetup) =>
    (value: string) => setForm(f => ({ ...f, [key]: value }));

  const accentColor   = form.accent_color ?? "#3b82f6";
  const ratioLight    = contrastRatio(accentColor, "#ffffff");
  const ratioDark     = contrastRatio(accentColor, "#111827");
  const passesLight   = ratioLight >= 4.5;
  const passesDark    = ratioDark  >= 4.5;
  const contrastBlocked = !passesLight && !passesDark;

  if (loading) return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "var(--sp-8) var(--sp-5)" }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="skel" style={{ height: 180, marginBottom: "var(--sp-4)", borderRadius: "var(--r-lg)" }} />
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "var(--sp-6) var(--sp-4)" : "var(--sp-8) var(--sp-6)" }}>

      {/* ── Page header ── */}
      <div style={{ marginBottom: "var(--sp-7)" }}>
        <h1 style={{ margin: 0, fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--text)", letterSpacing: "-0.02em" }}>
          {T.title}
        </h1>
        <p style={{ margin: "var(--sp-1) 0 0", fontSize: "var(--text-sm)", color: "var(--text-3)" }}>
          {T.subtitle}
        </p>
      </div>

      {/* ── Pending verification notice (M-2) ── */}
      {form.is_verified === false && (
        <div style={{
          display: "flex", gap: "var(--sp-3)", alignItems: "flex-start",
          padding: "var(--sp-4)",
          borderRadius: "var(--r)",
          background: "var(--amber-s, #fff8e1)",
          border: "1px solid var(--amber-b, #f0c040)",
          marginBottom: "var(--sp-5)",
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⏳</span>
          <div>
            <div style={{ fontWeight: 700, color: "var(--amber-text, #7a5a00)", marginBottom: 4, fontSize: "var(--text-sm)" }}>
              {T.pendingTitle}
            </div>
            <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--ink-3)", lineHeight: 1.6 }}>
              {T.pendingBody}
            </p>
          </div>
        </div>
      )}

      {/* ── Contact Information ── */}
      <Section icon={Building2} title={T.contact} description={T.contactDesc}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "var(--sp-4)" }}>
          <FieldGroup label={T.firmName} icon={Building2}>
            <TextInput value={form.firm_name ?? ""} onChange={set("firm_name")} placeholder="e.g. Bakker & Partners" />
          </FieldGroup>
          <FieldGroup label={T.phone} icon={Phone}>
            <TextInput value={form.phone ?? ""} onChange={set("phone")} placeholder="+31 20 123 4567" />
          </FieldGroup>
          <FieldGroup label={T.kvk} icon={Hash}>
            <TextInput value={form.kvk_number ?? ""} onChange={set("kvk_number")} placeholder="12345678" />
          </FieldGroup>
          <FieldGroup label={T.btw} icon={Receipt}>
            <TextInput value={form.btw_number ?? ""} onChange={set("btw_number")} placeholder="NL123456789B01" />
          </FieldGroup>
          <FieldGroup label={T.street} icon={MapPin}>
            <TextInput value={form.address_street ?? ""} onChange={set("address_street")} placeholder="Keizersgracht 1" />
          </FieldGroup>
          <FieldGroup label={T.city} icon={MapPin}>
            <TextInput value={form.address_city ?? ""} onChange={set("address_city")} placeholder="Amsterdam" />
          </FieldGroup>
          <FieldGroup label={T.postcode}>
            <TextInput value={form.address_postcode ?? ""} onChange={set("address_postcode")} placeholder="1015 CJ" />
          </FieldGroup>
        </div>
      </Section>

      {/* ── Branding ── */}
      <Section icon={Palette} title={T.branding} description={T.brandingDesc}>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-5)" }}>

          {/* Color picker */}
          <FieldGroup label={T.accentColor} icon={Palette} hint={T.colorHint}>
            <div style={{ display: "flex", gap: "var(--sp-3)", alignItems: "center" }}>
              {/* Native color swatch */}
              <label style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={e => set("accent_color")(e.target.value)}
                  style={{ opacity: 0, position: "absolute", inset: 0, width: "100%", height: "100%", cursor: "pointer" }}
                />
                <div style={{
                  width: 40, height: 40,
                  borderRadius: "var(--r-sm)",
                  background: accentColor,
                  border: "2px solid var(--border-2)",
                  boxShadow: "var(--sh-sm)",
                  transition: "background 0.1s",
                }} />
              </label>
              {/* Hex text input */}
              <input
                className="input"
                style={{ flex: 1, fontFamily: "var(--mono)", fontSize: "var(--text-sm)", letterSpacing: "0.04em" }}
                value={accentColor}
                onChange={e => set("accent_color")(e.target.value)}
                placeholder="#3b82f6"
                maxLength={7}
              />
              {/* Live preview badge */}
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "0 10px", height: 36,
                borderRadius: "var(--r-sm)",
                background: accentColor,
                color: passesLight ? "#fff" : "#000",
                fontSize: "var(--text-xs)", fontWeight: 700,
                flexShrink: 0,
                boxShadow: "var(--sh-sm)",
              }}>
                Preview
              </span>
            </div>

            {/* WCAG contrast feedback */}
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
              {[
                { label: T.contrastLight, ratio: ratioLight, passes: passesLight },
                { label: T.contrastDark,  ratio: ratioDark,  passes: passesDark  },
              ].map(({ label, ratio, passes }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: "var(--text-xs)",
                  color: passes ? "var(--ok, #16a34a)" : "var(--danger)",
                }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: passes ? "var(--ok-soft, #dcfce7)" : "var(--danger-soft, #fee2e2)",
                    flexShrink: 0,
                  }}>
                    {passes ? "✓" : "✗"}
                  </span>
                  <span style={{ fontWeight: 700 }}>{ratio.toFixed(1)}:1</span>
                  <span style={{ color: "var(--text-4)" }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{passes ? T.contrastOk : T.contrastWarn}</span>
                </div>
              ))}
            </div>
          </FieldGroup>

          {/* Email signature */}
          <FieldGroup label={T.signature} icon={Mail} hint={T.sigHint}>
            <textarea
              className="input"
              rows={4}
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
              value={form.email_signature ?? ""}
              onChange={e => setForm(f => ({ ...f, email_signature: e.target.value }))}
              placeholder={isNL ? "Uw naam\nKantoor B.V.\ncontact@kantoor.nl"
                         : isFA ? "نام شما\nشرکت شما\ncontact@example.nl"
                         : "Your Name\nFirm Name B.V.\ncontact@example.nl"}
            />
          </FieldGroup>
        </div>
      </Section>

      {/* ── Preferences ── */}
      <Section icon={Clock} title={T.preferences} description={T.prefDesc}>
        <div style={{ maxWidth: 280 }}>
          <FieldGroup label={T.reminderDays} icon={Clock} hint={T.reminderHint}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-3)" }}>
              <input
                className="input"
                type="number"
                min={1}
                max={90}
                style={{ width: 100 }}
                value={form.reminder_default_days ?? 7}
                onChange={e => setForm(f => ({ ...f, reminder_default_days: +e.target.value }))}
              />
              <span style={{ fontSize: "var(--text-sm)", color: "var(--text-3)", fontWeight: 500 }}>
                {isFA ? "روز" : isNL ? "dagen" : "days"}
              </span>
            </div>
          </FieldGroup>
        </div>
      </Section>

      {/* ── Subscription (read-only) ── */}
      <Section icon={CreditCard} title={T.subscription} description={T.subDesc}>
        <div style={{ display: "flex", gap: "var(--sp-4)", flexWrap: "wrap" }}>
          <div style={{
            flex: 1, minWidth: 140,
            padding: "var(--sp-4)",
            borderRadius: "var(--r-md)",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
              <CreditCard size={13} style={{ color: "var(--text-4)" }} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {T.plan}
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)" }}>
              <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--text)", textTransform: "capitalize" }}>
                {form.plan ?? "—"}
              </span>
              {form.plan && (
                <span className="pill pill-accent" style={{ fontSize: 10 }}>Active</span>
              )}
            </div>
          </div>
          <div style={{
            flex: 1, minWidth: 140,
            padding: "var(--sp-4)",
            borderRadius: "var(--r-md)",
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", marginBottom: "var(--sp-2)" }}>
              <Users size={13} style={{ color: "var(--text-4)" }} />
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {T.maxClients}
              </span>
            </div>
            <span style={{ fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--text)" }}>
              {form.max_clients ?? "—"}
            </span>
          </div>
        </div>
      </Section>

      {/* ── WCAG block warning ── */}
      {contrastBlocked && (
        <div style={{
          display: "flex", gap: "var(--sp-3)", alignItems: "flex-start",
          padding: "var(--sp-3) var(--sp-4)",
          borderRadius: "var(--r-sm)",
          background: "var(--danger-soft, #fee2e2)",
          border: "1px solid var(--danger, #ef4444)",
          marginBottom: "var(--sp-4)",
        }}>
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>⚠️</span>
          <p style={{ margin: 0, fontSize: "var(--text-xs)", color: "var(--danger)", lineHeight: 1.5 }}>
            {T.wcagBlock}
          </p>
        </div>
      )}

      {/* ── Save button ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--sp-3)", paddingTop: "var(--sp-2)" }}>
        {saved && (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", color: "var(--ok, #16a34a)", fontSize: "var(--text-sm)", fontWeight: 600 }}>
            <CheckCircle size={15} />
            {T.saved}
          </div>
        )}
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || contrastBlocked}
          style={{ display: "flex", alignItems: "center", gap: "var(--sp-2)", minWidth: 160 }}
        >
          <Save size={14} />
          {saving ? "…" : T.save}
        </button>
      </div>

    </div>
  );
}
