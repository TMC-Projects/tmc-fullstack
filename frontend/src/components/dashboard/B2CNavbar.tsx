'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ClipboardList, Shield, CreditCard, User, LogOut, Menu, X } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuthStore } from '@/store/auth';

export default function B2CNavbar() {
  const t = useTranslations('Dashboard');
  const tProf = useTranslations('Profile');
  const router = useRouter();
  const { token, clearAuth } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      clearAuth();
      router.push('/app/login');
    }
  };

  const navLinks = [
    { href: '/app/applications', icon: ClipboardList, label: 'Trial' },
    { href: '/app/invitations', icon: Shield, label: 'Invitations' },
    { href: '/app/subscription', icon: CreditCard, label: 'Subscription' },
    { href: '/app/profile', icon: User, label: t('view_profile') || 'View Profile' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
        <Link href="/app/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <img src="/logo.png" alt="TMC Platform Logo" className="h-8 w-auto" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent hidden sm:block">
            {t('title') || 'TMC Platform'}
          </h1>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <link.icon className="w-4 h-4" />
              <span>{link.label}</span>
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-rose-400 transition-colors bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
          >
            <LogOut className="w-4 h-4" />
            <span>{tProf('logout') || 'Logout'}</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden flex items-center gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-4 space-y-2 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 text-base text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-800 w-full"
            >
              <link.icon className="w-5 h-5" />
              <span>{link.label}</span>
            </Link>
          ))}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex items-center gap-3 text-base text-rose-500 hover:text-rose-600 transition-colors bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-800 w-full text-left"
          >
            <LogOut className="w-5 h-5" />
            <span>{tProf('logout') || 'Logout'}</span>
          </button>
        </div>
      )}
    </nav>
  );
}
