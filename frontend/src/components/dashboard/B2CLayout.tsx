'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ClipboardList, Shield, CreditCard, User, LogOut, Menu, X, Rss, LayoutDashboard } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuthStore } from '@/store/auth';

export default function B2CLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Dashboard');
  const tProf = useTranslations('Profile');
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, clearAuth } = useAuthStore();
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
    { href: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/app/applications', icon: ClipboardList, label: 'Trial' },
    { href: '/app/feed', icon: Rss, label: 'Feed' },
    { href: '/app/invitations', icon: Shield, label: 'Invitations' },
    { href: '/app/subscription', icon: CreditCard, label: 'Subscription' },
    { href: '/app/profile', icon: User, label: t('view_profile') || 'View Profile' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      
      {/* Sidebar (Desktop) */}
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive 
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
        <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link href="/app/dashboard" className="flex items-center gap-2">
              <img src="/logo.png" alt="NJARA Logo" className="h-7 w-auto" />
            </Link>
          </div>
          
          <div className="hidden md:block">
            {/* Empty space for desktop topbar left side */}
          </div>

          <div className="flex items-center gap-4">
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

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex">
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="relative w-72 max-w-[80%] h-full bg-slate-50 dark:bg-slate-950 border-r border-slate-300 dark:border-slate-800 flex flex-col shadow-2xl">
              <div className="h-16 flex items-center justify-between px-4 border-b border-slate-300 dark:border-slate-800">
                <Link href="/app/dashboard" className="flex items-center gap-3">
                  <img src="/logo.png" alt="NJARA Logo" className="h-8 w-auto" />
                  <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    NJARA
                  </h1>
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 -mr-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
                        isActive 
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
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>

      </div>
    </div>
  );
}
