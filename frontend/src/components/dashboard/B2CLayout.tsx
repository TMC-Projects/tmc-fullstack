'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ClipboardList, Shield, CreditCard, User, LogOut, Rss, LayoutDashboard } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import NotificationBell from '@/components/layout/NotificationBell';
import { useAuthStore } from '@/store/auth';

export default function B2CLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Dashboard');
  const tProf = useTranslations('Profile');
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, clearAuth } = useAuthStore();

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
    { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/app/applications', icon: ClipboardList, label: 'Trial' },
    { href: '/app/feed', icon: Rss, label: 'Feed' },
    { href: '/app/invitations', icon: Shield, label: 'Invitations' },
    { href: '/app/subscription', icon: CreditCard, label: 'Subscription' },
    { href: '/app/profile', icon: User, label: t('view_profile') || 'Profile' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* Sidebar (Desktop only) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md">
        <div className="h-16 flex items-center px-6 border-b border-slate-300 dark:border-slate-800">
          <Link href="/app/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="NJARA Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              {t('title') || 'NJARA'}
            </h1>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${isActive
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/50 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="relative z-40 h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md shrink-0">
          {/* Logo — mobile only */}
          <div className="flex items-center gap-2 md:hidden">
            <Link href="/app/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="NJARA Logo" className="h-7 w-auto" />
              <span className="text-lg font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                NJARA
              </span>
            </Link>
          </div>

          <div className="hidden md:block">
            {/* Empty space for desktop topbar left side */}
          </div>

          <div className="flex items-center gap-4">
            <NotificationBell />
            <LanguageSwitcher />

            <div className="flex items-center gap-3 pl-4 border-l border-slate-300 dark:border-slate-800">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold">{user?.full_name || user?.username || 'User'}</span>
                <span className="text-xs text-slate-500 capitalize">{user?.category || 'Member'}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/30 overflow-hidden flex items-center justify-center shrink-0">
                {user?.profile_picture_url ? (
                  <img src={user.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                )}
              </div>
              <button
                onClick={handleLogout}
                title={tProf('logout') || 'Logout'}
                className="p-2 ml-1 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative pb-16 md:pb-0">
          {children}
        </main>

      </div>

      {/* Bottom Navigation Bar (Mobile only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
        <div className="flex items-stretch justify-around h-16">
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-[10px] font-medium transition-colors relative ${isActive
                    ? 'text-amber-500 dark:text-amber-400'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                )}
                <link.icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

