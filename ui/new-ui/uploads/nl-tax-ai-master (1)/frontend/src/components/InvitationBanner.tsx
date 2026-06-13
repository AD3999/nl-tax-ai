import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchClientInvitations, respondToInvitation, type ClientInvitation } from "../api/invitations";
import { useToast } from "../context/ToastContext";
import { apiBase, authHeader } from "../api/client";

interface ConnectedAccountant {
  id: number;
  firm_name: string;
  accountant_email: string;
  connected_since: string;
}

const TX = {
  en: {
    title:        "Accountant invitation",
    body:         (firm: string) => `${firm} has invited you to connect as your tax advisor.`,
    message:      "Message",
    accept:       "Accept",
    decline:      "Decline",
    accepted:     "You are now connected with",
    declined:     "Invitation declined.",
    my_accountant:"Your tax advisor",
    connected:    (firm: string) => `Connected with ${firm}`,
    disconnect:   "Disconnect",
    disconnected: "Disconnected from accountant.",
    confirm_disc: (firm: string) => `Disconnect from ${firm}? They will lose access to your file.`,
  },
  nl: {
    title:        "Accountant uitnodiging",
    body:         (firm: string) => `${firm} heeft u uitgenodigd om te verbinden als uw belastingadviseur.`,
    message:      "Bericht",
    accept:       "Accepteren",
    decline:      "Weigeren",
    accepted:     "U bent nu verbonden met",
    declined:     "Uitnodiging geweigerd.",
    my_accountant:"Uw belastingadviseur",
    connected:    (firm: string) => `Verbonden met ${firm}`,
    disconnect:   "Verbinding verbreken",
    disconnected: "Verbinding met accountant verbroken.",
    confirm_disc: (firm: string) => `Verbinding verbreken met ${firm}? Zij verliezen toegang tot uw dossier.`,
  },
  fa: {
    title:        "دعوت‌نامه حسابدار",
    body:         (firm: string) => `${firm} شما را دعوت کرده تا به عنوان مشاور مالیاتی‌تان متصل شوید.`,
    message:      "پیام",
    accept:       "قبول",
    decline:      "رد",
    accepted:     "اکنون با",
    declined:     "دعوت‌نامه رد شد.",
    my_accountant:"مشاور مالیاتی شما",
    connected:    (firm: string) => `متصل به ${firm}`,
    disconnect:   "قطع اتصال",
    disconnected: "از حسابدار جدا شدید.",
    confirm_disc: (firm: string) => `از ${firm} جدا می‌شوید؟ آنها دسترسی به پرونده شما را از دست می‌دهند.`,
  },
} as const;

export default function InvitationBanner() {
  const { i18n } = useTranslation();
  const { showToast } = useToast();
  const lang = (i18n.language in TX ? i18n.language : "en") as keyof typeof TX;
  const tx = TX[lang];

  const [invitations, setInvitations] = useState<ClientInvitation[]>([]);
  const [responding, setResponding] = useState<number | null>(null);
  const [accountants, setAccountants] = useState<ConnectedAccountant[]>([]);
  const [disconnecting, setDisconnecting] = useState<number | null>(null);

  useEffect(() => {
    fetchClientInvitations().then(setInvitations).catch(() => null);
    fetch(`${apiBase}/users/client/my-accountant/`, { headers: authHeader() })
      .then(r => r.ok ? r.json() as Promise<ConnectedAccountant[]> : [])
      .then(setAccountants)
      .catch(() => null);
  }, []);

  async function handle(id: number, action: "accept" | "decline") {
    setResponding(id);
    try {
      await respondToInvitation(id, action);
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === id ? { ...inv, status: action === "accept" ? "accepted" : "declined" } : inv))
      );
      const inv = invitations.find((i) => i.id === id);
      if (action === "accept" && inv) {
        showToast(`${tx.accepted} ${inv.firm_name} ✓`, "success");
        // Refresh connected accountants list after acceptance
        fetch(`${apiBase}/users/client/my-accountant/`, { headers: authHeader() })
          .then(r => r.ok ? r.json() as Promise<ConnectedAccountant[]> : [])
          .then(setAccountants)
          .catch(() => null);
      } else {
        showToast(tx.declined, "info");
      }
    } catch {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setResponding(null);
    }
  }

  async function handleDisconnect(acc: ConnectedAccountant) {
    if (!window.confirm(tx.confirm_disc(acc.firm_name))) return;
    setDisconnecting(acc.id);
    try {
      await fetch(`${apiBase}/users/client/my-accountant/${acc.id}/`, {
        method: "DELETE",
        headers: authHeader(),
      });
      setAccountants(prev => prev.filter(a => a.id !== acc.id));
      showToast(tx.disconnected, "info");
    } catch {
      showToast("Something went wrong.", "error");
    }
    setDisconnecting(null);
  }

  const pending = invitations.filter((inv) => inv.status === "pending");
  if (pending.length === 0 && accountants.length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>

      {/* Connected accountant(s) */}
      {accountants.map(acc => (
        <div
          key={acc.id}
          style={{
            padding: "12px 18px",
            borderRadius: "var(--r)",
            border: "1px solid var(--hairline)",
            background: "var(--paper-3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", marginBottom: 2 }}>{tx.my_accountant}</div>
            <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)" }}>{tx.connected(acc.firm_name)}</div>
            <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)" }}>{acc.accountant_email}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: "var(--danger)", flexShrink: 0 }}
            disabled={disconnecting === acc.id}
            onClick={() => handleDisconnect(acc)}
          >
            {disconnecting === acc.id ? "…" : tx.disconnect}
          </button>
        </div>
      ))}

      {/* Pending invitations */}
      {pending.map((inv) => (
        <div
          key={inv.id}
          style={{
            padding: "16px 20px",
            borderRadius: "var(--r)",
            border:  "1px solid oklch(0.78 0.08 230)",
            background: "oklch(0.97 0.025 230)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: "oklch(0.46 0.14 15)",
                  color: "white", display: "grid", placeItems: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  AC
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--ink)" }}>
                    {tx.title}
                  </div>
                  <div style={{ fontSize: "var(--text-xs)", color: "var(--ink-3)" }}>
                    {tx.body(inv.firm_name)}
                  </div>
                </div>
              </div>
              {inv.message && (
                <div style={{ marginTop: 8, padding: "8px 12px", background: "var(--paper)", borderRadius: "var(--r-sm)", fontSize: "var(--text-xs)", color: "var(--ink-2)", borderInlineStart: "3px solid oklch(0.46 0.14 15 / 0.4)" }}>
                  <span style={{ fontWeight: 600, color: "var(--ink-4)", marginInlineEnd: 6 }}>{tx.message}:</span>
                  {inv.message}
                </div>
              )}
            </div>
            <span style={{ fontSize: "var(--text-xs)", color: "var(--ink-4)", whiteSpace: "nowrap" }}>
              {inv.created_at}
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-accent btn-sm"
              disabled={responding === inv.id}
              onClick={() => handle(inv.id, "accept")}
            >
              {responding === inv.id ? "…" : tx.accept}
            </button>
            <button
              className="btn btn-ghost btn-sm"
              disabled={responding === inv.id}
              onClick={() => handle(inv.id, "decline")}
              style={{ color: "var(--ink-3)" }}
            >
              {tx.decline}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
