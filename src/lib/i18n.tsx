"use client";

// Lightweight client-side i18n: a locale context backed by the messages
// dictionary, persisted to localStorage, with the <html lang> kept in sync.
// Marketing components read copy via useI18n().t.<section>.<key>; the EN/FR
// toggle lives in Nav.tsx and calls setLocale().

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { messages, type Locale, type Messages } from "./messages";

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Messages;
};

const I18nContext = createContext<I18nValue | null>(null);
const STORAGE_KEY = "kojoLocale";

export function LocaleProvider({ children }: { children: ReactNode }) {
  // Always start "en" so server and first client render match (avoids hydration
  // mismatch); the saved choice is applied on mount.
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "fr") setLocaleState(saved);
    } catch {
      /* localStorage unavailable — stay on default */
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: messages[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  // Fallback to English if a component renders outside the provider.
  if (!ctx) return { locale: "en", setLocale: () => {}, t: messages.en };
  return ctx;
}
