type Lang = "nl" | "en" | "fa";

export const STATUS_LABELS: Record<string, Record<Lang, string>> = {
  active:          { en: "Active",            nl: "Actief",              fa: "فعال"             },
  waiting_client:  { en: "Waiting on client", nl: "Wacht op klant",      fa: "منتظر مشتری"      },
  needs_review:    { en: "Needs review",       nl: "Beoordeling nodig",   fa: "نیاز به بررسی"    },
  ready_to_file:   { en: "Ready to file",      nl: "Klaar om in te dienen", fa: "آماده ارسال"   },
  filed:           { en: "Filed",              nl: "Ingediend",           fa: "ارسال شده"        },
  blocked:         { en: "Blocked",            nl: "Geblokkeerd",         fa: "مسدود"            },
  on_hold:         { en: "On hold",            nl: "In de wacht",         fa: "در انتظار"        },
  cancelled:       { en: "Cancelled",          nl: "Geannuleerd",         fa: "لغو شده"          },
};

export function getStatusLabel(status: string, lang: Lang = "en"): string {
  return STATUS_LABELS[status]?.[lang] ?? status.replace(/_/g, " ");
}
