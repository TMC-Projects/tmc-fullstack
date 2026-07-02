'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const router = useRouter();
  const [locale, setLocale] = useState('id'); // Default

  useEffect(() => {
    // Read the cookie
    const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'));
    if (match) {
      setLocale(match[2]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLocale = e.target.value;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    setLocale(newLocale);
    window.location.reload(); // Hard reload to apply language change globally
  };

  return (
    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-800">
      <Globe className="w-4 h-4 text-slate-500" />
      <select
        value={locale}
        onChange={handleChange}
        className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-0 cursor-pointer"
      >
        <option value="id">ID</option>
        <option value="en">EN</option>
      </select>
    </div>
  );
}
