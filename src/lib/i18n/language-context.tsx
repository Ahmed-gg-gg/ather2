"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type DictionaryKey, type Lang, translate } from "./dictionary";

const COOKIE_NAME = "athar_lang";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: DictionaryKey) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "ar",
  setLang: () => {},
  t: (key) => translate(key, "ar"),
});

function readCookieLang(): Lang {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie.match(/athar_lang=(ar|en)/);
  return (match?.[1] as Lang) ?? "ar";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    setLangState(readCookieLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === "ar" ? "ar" : "en";
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  function setLang(next: Lang) {
    setLangState(next);
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000`;
  }

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t: (key) => translate(key, lang) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
