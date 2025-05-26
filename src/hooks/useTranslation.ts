
// src/hooks/useTranslation.ts
"use client";

import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translations, uiStrings, type Locale, defaultLocale } from '@/lib/translations';

// Define a type for the translation keys
export type TranslationKey = keyof typeof uiStrings;

export const useTranslation = () => {
  const { language } = useLanguage();

  const t = useCallback((key: TranslationKey, interpolationData?: Record<string, string | number>): string => {
    const langTranslations = translations[language] || translations.en;
    let translation = langTranslations[key] || translations.en[key] || key;

    if (interpolationData) {
      Object.keys(interpolationData).forEach((paramKey) => {
        const regex = new RegExp(`{${paramKey}}`, 'g');
        translation = translation.replace(regex, String(interpolationData[paramKey]));
      });
    }
    return translation;
  }, [language]);

  return { t, currentLanguage: language };
};

// Helper for direct usage outside React components if needed, defaults to English or defaultLocale
// Note: This static 't' won't be reactive. Use useTranslation in components.
export const staticT = (key: TranslationKey, lang: Locale = defaultLocale, interpolationData?: Record<string, string | number>): string => {
  const langTranslations = translations[lang] || translations.en;
  let translation = langTranslations[key] || translations.en[key] || key;

  if (interpolationData) {
    Object.keys(interpolationData).forEach((paramKey) => {
      const regex = new RegExp(`{${paramKey}}`, 'g');
      translation = translation.replace(regex, String(interpolationData[paramKey]));
    });
  }
  return translation;
};

    
