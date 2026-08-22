"use client";

import { createContext, useCallback, useContext, useMemo, ReactNode } from "react";
import { useLocalStorage } from "@/app/hooks/useLocalStorage";
import { Locale, defaultLocale, locales, t as translate, TranslationKey } from "@/app/lib/translations";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  locales: { value: Locale; label: string; flag: string }[];
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useLocalStorage<Locale>("r-bot-locale", defaultLocale);

  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      locales,
      t,
    }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
