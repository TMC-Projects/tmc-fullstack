'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const currentLang = useLocale();

  const handleLanguageChange = (lang: string) => {
    document.cookie = `NEXT_LOCALE=${lang}; path=/`;
    setIsLangOpen(false);
    router.refresh();
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="relative">
        <button
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors shadow-sm"
        >
          <Globe className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {currentLang === 'id' ? 'ID' : 'EN'}
          </span>
          {isLangOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {isLangOpen && (
          <div className="absolute top-full mt-2 right-0 w-36 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-1.5 shadow-xl shadow-slate-900/10 space-y-1">
            <button
              onClick={() => handleLanguageChange('id')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${currentLang === 'id' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <span>Indonesia</span>
              {currentLang === 'id' && <Check className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${currentLang === 'en' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <span>English</span>
              {currentLang === 'en' && <Check className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
