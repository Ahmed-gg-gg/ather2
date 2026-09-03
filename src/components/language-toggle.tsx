"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/language-context";

export default function LanguageToggle() {
  const router = useRouter();
  const { lang, setLang, t } = useLanguage();

  function toggle() {
    setLang(lang === "ar" ? "en" : "ar");
    router.refresh();
  }

  return (
    <button
      onClick={toggle}
      className="text-sm text-ink-soft border border-line rounded-md px-3.5 py-1.5"
      title="Switch language"
    >
      {t("language")}
    </button>
  );
}
