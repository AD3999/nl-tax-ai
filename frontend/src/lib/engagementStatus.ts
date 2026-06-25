type Lang = "nl" | "en" | "fa";

// ── TaxEngagement.STATUS_CHOICES ───────────────────────────────────────────
// draft | collecting | waiting_client | needs_review | ready_to_file
// filed | completed | blocked
export const ENGAGEMENT_STATUS_LABELS: Record<string, Record<Lang, string>> = {
  draft: {
    en: "Draft",
    nl: "Concept",
    fa: "پیش‌نویس",
  },
  collecting: {
    en: "Collecting",
    nl: "Documenten verzamelen",
    fa: "جمع‌آوری",
  },
  waiting_client: {
    en: "Waiting on client",
    nl: "Wacht op klant",
    fa: "منتظر مشتری",
  },
  needs_review: {
    en: "Needs review",
    nl: "Beoordeling nodig",
    fa: "نیاز به بررسی",
  },
  ready_to_file: {
    en: "Ready to file",
    nl: "Klaar om in te dienen",
    fa: "آماده ارسال",
  },
  filed: {
    en: "Filed",
    nl: "Ingediend",
    fa: "ارسال شده",
  },
  completed: {
    en: "Completed",
    nl: "Voltooid",
    fa: "تکمیل شده",
  },
  blocked: {
    en: "Blocked",
    nl: "Geblokkeerd",
    fa: "مسدود",
  },
};

// ── AccountantClientProfile.STATUS_CHOICES ─────────────────────────────────
// invited | active | collecting | in_review | ready | completed | archived | deactivated
export const CLIENT_STATUS_LABELS: Record<string, Record<Lang, string>> = {
  invited: {
    en: "Invited",
    nl: "Uitgenodigd",
    fa: "دعوت شده",
  },
  active: {
    en: "Active",
    nl: "Actief",
    fa: "فعال",
  },
  collecting: {
    en: "Collecting",
    nl: "Documenten verzamelen",
    fa: "جمع‌آوری",
  },
  in_review: {
    en: "In review",
    nl: "In beoordeling",
    fa: "در بررسی",
  },
  ready: {
    en: "Ready",
    nl: "Klaar",
    fa: "آماده",
  },
  completed: {
    en: "Completed",
    nl: "Voltooid",
    fa: "تکمیل شده",
  },
  archived: {
    en: "Archived",
    nl: "Gearchiveerd",
    fa: "بایگانی شده",
  },
  deactivated: {
    en: "Deactivated",
    nl: "Gedeactiveerd",
    fa: "غیرفعال",
  },
};

/**
 * Returns a human-readable, localised label for any engagement or client
 * profile status. Checks ENGAGEMENT_STATUS_LABELS first, then CLIENT_STATUS_LABELS,
 * then falls back to replacing underscores with spaces.
 */
export function getStatusLabel(status: string, lang: Lang = "en"): string {
  return (
    ENGAGEMENT_STATUS_LABELS[status]?.[lang] ??
    CLIENT_STATUS_LABELS[status]?.[lang] ??
    status.replace(/_/g, " ")
  );
}

export function getEngagementStatusLabel(status: string, lang: Lang = "en"): string {
  return ENGAGEMENT_STATUS_LABELS[status]?.[lang] ?? status.replace(/_/g, " ");
}

export function getClientStatusLabel(status: string, lang: Lang = "en"): string {
  return CLIENT_STATUS_LABELS[status]?.[lang] ?? status.replace(/_/g, " ");
}
