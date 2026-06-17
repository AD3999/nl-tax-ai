/**
 * Dutch-locale formatting utilities (F18 + F19).
 * All money and dates rendered through these helpers — never hand-formatted.
 *
 * Currency:  Intl.NumberFormat('nl-NL') → "€ 28.000,00" / "€ 1.200,50"
 * Date:      Intl.DateTimeFormat('nl-NL') → "31-07-2026"
 */

const _eur = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,   // round euros only; no cents in tax breakdowns
  minimumFractionDigits: 0,
});

const _eurCents = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const _date = new Intl.DateTimeFormat("nl-NL", {
  day:   "2-digit",
  month: "2-digit",
  year:  "numeric",
});

const _dateLong = new Intl.DateTimeFormat("nl-NL", {
  day:   "numeric",
  month: "long",
  year:  "numeric",
});

const _dateMedium = new Intl.DateTimeFormat("nl-NL", {
  day:   "numeric",
  month: "short",
  year:  "numeric",
});

/** Format a euro amount Dutch-style, no cents: € 28.000 */
export function formatEUR(amount: number): string {
  return _eur.format(amount);
}

/** Format a euro amount with cents: € 28.000,50 */
export function formatEURCents(amount: number): string {
  return _eurCents.format(amount);
}

/** Format a date Dutch-style: 31-07-2026 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return _date.format(d);
}

/** Format a date long Dutch-style: 31 juli 2026 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return _dateLong.format(d);
}

/** Format a date medium Dutch-style: 31 jul 2026 */
export function formatDateMedium(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);
  return _dateMedium.format(d);
}

/** Format a percentage: 35,75% */
export function formatPct(fraction: number, decimals = 1): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(fraction);
}
