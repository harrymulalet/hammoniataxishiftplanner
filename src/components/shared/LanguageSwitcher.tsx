
// src/components/shared/LanguageSwitcher.tsx
"use client";

import { Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Locale } from '@/lib/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage, availableLocales } = useLanguage();

  const getLanguageDisplayName = (locale: Locale) => {
    switch (locale) {
      case 'en':
        return 'English';
      case 'de':
        return 'Deutsch';
      default:
        return locale.toUpperCase();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change language">
          <Languages className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLocales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => setLanguage(locale)}
            disabled={language === locale}
          >
            {getLanguageDisplayName(locale)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

    