'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useTranslations, useLocale } from 'next-intl';
import {
  LayoutDashboard,
  Users,
  ArrowRightLeft,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Building2,
  Settings,
  UserCircle,
  Shield,
  ChevronDown,
  ChevronUp,
  Globe,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, clearAuth, _hasHydrated } = useAuthStore();
  const tCommon = useTranslations('Profile');
  const tSidebar = useTranslations('Sidebar');

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentLang = useLocale();

  const handleLanguageChange = (lang: string) => {
    document.cookie = `NEXT_LOCALE=${lang}; path=/`;
    setIsLangOpen(false);
    router.refresh();
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Logout failed', e);
    } finally {
      clearAuth();
      router.push('/portal/login');
    }
  };

  const navLinks = [
    {
      name: tSidebar('dashboard'),
      href: '/portal/dashboard',
      icon: LayoutDashboard,
      roles: ['owner', 'manager', 'staff', 'ba']
    },
    {
      name: tSidebar('talents'),
      href: '/portal/talents',
      icon: Users,
      roles: ['owner', 'manager', 'staff', 'ba']
    },
    {
      name: tSidebar('transfer_market'),
      href: '/portal/transfer-market',
      icon: ArrowRightLeft,
      roles: ['owner', 'manager']
    },
    {
      name: tSidebar('trials'),
      href: '/portal/trials',
      icon: ClipboardList,
      roles: ['owner', 'manager', 'staff', 'coach']
    },
    {
      name: tSidebar('teams'),
      href: '/portal/teams',
      icon: Shield,
      roles: ['owner', 'manager', 'coach']
    }
  ];

  const filteredLinks = navLinks.filter(link => {
    if (!user?.category || !link.roles.includes(user.category)) return false;
    if (link.name === tSidebar('transfer_market')) {
      if (!user.verify) return false;
    }
    return true;
  });

  if (!_hasHydrated) return null;
  if (pathname.startsWith('/portal/club/create')) return null;

  const renderSidebarContent = (collapsed: boolean) => (
    <div className="flex flex-col h-full bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-300 dark:border-slate-800 transition-all duration-300">
      {/* Brand */}
      <div className={`h-16 flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-6'} border-b border-slate-300 dark:border-slate-800 shrink-0 overflow-hidden transition-all duration-300`}>
        <Link href="/portal/dashboard" className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          {user?.club_logo_url ? (
            <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${user.club_logo_url}`} alt="Club Logo" className="w-8 h-8 rounded-xl object-cover bg-white shrink-0" />
          ) : (
            <img src="/logo.png" alt="TMC Logo" className="w-8 h-8 rounded-xl object-contain shrink-0" />
          )}
          {!collapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-wide truncate transition-opacity duration-300">
              {user?.club_name || 'TMC PORTAL'}
            </span>
          )}
        </Link>
        {!collapsed && <ThemeToggle />}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {filteredLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-xl transition-all duration-200 group ${isActive
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium'
                }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 shrink-0 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
              {!collapsed && <span className="truncate">{link.name}</span>}
            </Link>
          );
        })}
      </div>

      {/* User Footer */}
      <div className={`border-t border-slate-300 dark:border-slate-800 shrink-0 transition-all duration-300 ${collapsed ? 'p-3 flex flex-col gap-4 items-center' : 'p-4 space-y-3'}`}>
        
        {/* Language Switcher */}
        <div className="relative w-full">
          <button 
            onClick={() => setIsLangOpen(!isLangOpen)}
            className={`flex items-center transition-colors ${collapsed ? 'justify-center p-2 rounded-xl hover:bg-slate-300/50 dark:hover:bg-slate-800/50 w-full' : 'w-full justify-between px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'}`}
          >
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-slate-500 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {currentLang === 'id' ? 'Indonesia' : 'English'}
                </span>
              )}
            </div>
            {!collapsed && (isLangOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />)}
          </button>

          {isLangOpen && (
            <div className={`absolute bottom-full mb-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl p-1.5 shadow-xl shadow-slate-900/10 space-y-1 z-50 ${collapsed ? 'left-full ml-4 w-40' : 'w-full'}`}>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${currentLang === 'en' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span>English</span>
                {currentLang === 'en' && <Check className="w-4 h-4" />}
              </button>
              <button
                onClick={() => handleLanguageChange('id')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${currentLang === 'id' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
              >
                <span>Indonesia</span>
                {currentLang === 'id' && <Check className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

        {/* User Dropdown */}
        <div className="relative w-full">
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center transition-colors ${collapsed ? 'justify-center p-1 w-full rounded-full hover:bg-slate-300/50 dark:hover:bg-slate-800/50' : 'w-full gap-3 p-3 rounded-2xl border border-slate-300 dark:border-slate-800 bg-slate-200/50 dark:bg-slate-900/50 hover:bg-slate-300/50 dark:hover:bg-slate-800/50'}`}
          >
            <div className={`w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold shrink-0`}>
              {user?.full_name?.charAt(0)?.toUpperCase() || <UserCircle className="w-6 h-6" />}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {user?.full_name || 'Loading...'}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 capitalize truncate">
                    {user?.category || 'User'}
                  </p>
                </div>
                {isDropdownOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
              </>
            )}
          </button>

          {isDropdownOpen && (
            <div className={`absolute bottom-full mb-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-2 shadow-xl shadow-slate-900/10 space-y-1 z-50 ${collapsed ? 'left-full ml-4 w-56' : 'w-full'}`}>
              <Link
                href="/portal/profile"
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                {tSidebar('profile')}
              </Link>

              {(user?.category === 'owner' || user?.category === 'manager') && (
                <Link
                  href="/portal/club/edit"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {tSidebar('edit_club')}
                </Link>
              )}

              {user?.category === 'owner' && (
                <Link
                  href="/portal/subscriptions"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-500 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  {tSidebar('subscriptions')}
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {tCommon('logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800 z-40 flex items-center justify-between px-4">
        <Link href="/portal/dashboard" className="flex items-center gap-2">
          <img src="/logo.png" alt="TMC Logo" className="w-6 h-6 rounded-lg object-contain" />
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-wide">
            TMC
          </span>
        </Link>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-y-0 left-0 w-[280px] z-50 transform transition-transform duration-300 ease-in-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {renderSidebarContent(false)}
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden md:block h-screen shrink-0 sticky top-0 z-50 transition-[width] duration-300 ease-in-out ${isCollapsed ? 'w-[80px]' : 'w-[280px]'}`}>
        <div className="relative h-full">
          {renderSidebarContent(isCollapsed)}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-500 hover:text-blue-500 hover:border-blue-500 shadow-sm cursor-pointer z-50 transition-colors"
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
