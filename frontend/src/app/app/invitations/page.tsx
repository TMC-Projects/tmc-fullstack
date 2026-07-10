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
import B2CNavbar from '@/components/dashboard/B2CNavbar';

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
      <B2CNavbar />

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
