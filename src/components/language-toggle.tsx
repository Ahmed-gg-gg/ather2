"use client";

import { useLanguage } from "@/lib/i18n/language-context";

export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "ar" ? "en" : "ar")}
      className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5"
      title="Switch language"
    >
      {t("language")}
    </button>
  );
}
