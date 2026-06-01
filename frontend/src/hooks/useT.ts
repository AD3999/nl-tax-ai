import { useTranslation } from "react-i18next";

/**
 * Wrapper around react-i18next's `t()` that strips trailing periods
 * from translated strings when the active language is Persian (fa).
 *
 * Persian writing convention does not use the Latin period at the end
 * of sentences. Use this hook everywhere in place of raw useTranslation()
 * for user-visible strings.
 *
 * Usage:
 *   const { t, lang } = useT();
 *   <p>{t("some.key")}</p>  // trailing "." auto-removed in Persian
 */
export function useT() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as "nl" | "en" | "fa";

  const tClean = (key: string, opts?: Record<string, unknown>): string => {
    const raw = t(key, opts) as string;
    if (lang === "fa" && typeof raw === "string") {
      return raw.replace(/\.+$/, "");
    }
    return raw;
  };

  return { t: tClean, lang, i18n };
}
