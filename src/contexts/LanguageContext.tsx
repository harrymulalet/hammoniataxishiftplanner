
// src/contexts/LanguageContext.tsx
"use client";

import type React from 'react';
import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import type { Locale } from '@/lib/translations';
import { defaultLocale, locales } from '@/lib/translations';

interface LanguageContextType {
  language: Locale;
  setLanguage: (language: Locale) => void;
  availableLocales: Locale[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Locale>(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('appLanguage') as Locale | null;
      if (storedLang && locales.includes(storedLang)) {
        return storedLang;
      }
    }
    return defaultLocale;
  });

  const setLanguage = useCallback((lang: Locale) => {
    if (locales.includes(lang)) {
      setLanguageState(lang);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appLanguage', lang);
        document.documentElement.lang = lang;
      }
    } else {
      console.warn(`Attempted to set unsupported language: ${lang}`);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, availableLocales: locales }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

    