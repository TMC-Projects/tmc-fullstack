'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ClipboardList, Shield, ChevronLeft , CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { motion } from 'framer-motion';

import TeamInvitations from '@/components/dashboard/TeamInvitations';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function InvitationsPage() {
  const router = useRouter();
  const { token, clearAuth, _hasHydrated } = useAuthStore();
  const t = useTranslations('Dashboard');
  const tProf = useTranslations('Profile'); 

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/app/login');
    }
  }, [token, _hasHydrated, router]);

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

  if (!_hasHydrated) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <Link href="/app/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="TMC Platform Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent hidden sm:block">
              {t('title')}
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/app/applications"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Trial</span>
            </Link>
            <Link
              href="/app/invitations"
              className="flex items-center gap-2 text-sm text-amber-500 dark:text-amber-500 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-amber-300 dark:border-amber-900"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Invitations</span>
            </Link>
            <Link
              href="/app/subscription"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Subscription</span>
            </Link>

            <Link
              href="/app/profile"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('view_profile')}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-rose-400 transition-colors bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{tProf('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 md:px-8 mt-8 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/app/dashboard" className="p-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Undangan Tim</h2>
            <p className="text-slate-500 dark:text-slate-400">Kelola semua undangan bergabung dari Klub maupun Tim.</p>
          </div>
        </div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <TeamInvitations showEmptyState={true} />
        </motion.section>
      </div>
    </main>
  );
}
