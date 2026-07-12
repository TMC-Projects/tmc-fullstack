'use client';

import Image from "next/image";
import Link from "next/link";
import { Rocket, Building2, BarChart2, Gamepad2, ArrowRight, Sun, Menu, X, Check } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const t = useTranslations('LandingPage');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-200 font-sans selection:bg-purple-500/30 overflow-x-hidden transition-colors">

      {/* --- Navbar --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="EMC Logo" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              EMC
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6">
            <Link href="#marketplace" className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-gray-400 transition-colors">{t('nav_marketplace')}</Link>
            <Link href="#scouting" className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-gray-400 transition-colors">{t('nav_scouting')}</Link>
            <Link href="#management" className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-gray-400 transition-colors">{t('nav_management')}</Link>
            <Link href="#pricing" className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:text-white dark:hover:text-gray-400 transition-colors">{t('nav_pricing')}</Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <ThemeToggle />
            <div className="flex items-center gap-2 border-r border-slate-300 dark:border-slate-700 pr-4">
              <button onClick={() => { document.cookie = 'NEXT_LOCALE=id; path=/'; window.location.reload(); }} className="text-xs font-medium text-slate-400 hover:text-slate-900 dark:text-white transition-colors">ID</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => { document.cookie = 'NEXT_LOCALE=en; path=/'; window.location.reload(); }} className="text-xs font-medium text-slate-400 hover:text-slate-900 dark:text-white transition-colors">EN</button>
            </div>

            {/* Player Auth */}
            <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-4">
              <Link href="/app/login" className="text-sm font-medium text-slate-300 hover:text-slate-900 dark:text-white dark:hover:text-gray-400 transition-colors">
                {t('nav_player_login')}
              </Link>
            </div>

            {/* Club Auth */}
            <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-4">
              <Link href="/team-portal/login" className="text-sm font-medium text-slate-300 hover:text-slate-900 dark:text-white dark:hover:text-gray-400 transition-colors">
                {t('nav_team_login', { defaultMessage: 'Team Login' })}
              </Link>
            </div>

            <div className="flex items-center gap-3 border-r border-slate-200 dark:border-slate-700 pr-4">
              <Link href="/portal/login" className="text-sm font-medium text-slate-300 hover:text-slate-900 dark:text-white dark:hover:text-gray-400 transition-colors">
                {t('nav_club_login')}
              </Link>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <button
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-[#0B0F19] border-b border-slate-200 dark:border-white/5 px-6 py-6 space-y-4 transition-colors">
            <Link href="#marketplace" className="block text-slate-400 hover:text-slate-900 dark:text-white font-medium">{t('nav_marketplace')}</Link>
            <Link href="#scouting" className="block text-slate-400 hover:text-slate-900 dark:text-white font-medium">{t('nav_scouting')}</Link>
            <Link href="#management" className="block text-slate-400 hover:text-slate-900 dark:text-white font-medium">{t('nav_management')}</Link>
            <Link href="#pricing" className="block text-slate-400 hover:text-slate-900 dark:text-white font-medium">{t('nav_pricing')}</Link>

            <div className="pt-4 border-t border-white/10 flex items-center gap-4 justify-center">
              <button onClick={() => { document.cookie = 'NEXT_LOCALE=id; path=/'; window.location.reload(); }} className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:text-white transition-colors">ID</button>
              <span className="text-slate-700">|</span>
              <button onClick={() => { document.cookie = 'NEXT_LOCALE=en; path=/'; window.location.reload(); }} className="text-sm font-medium text-slate-400 hover:text-slate-900 dark:text-white transition-colors">EN</button>
            </div>

            <div className="pt-4 border-t border-white/10 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <Link href="/app/login" className="w-full text-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border border-slate-200 dark:border-slate-700">{t('nav_player_login')}</Link>
                <Link href="/team-portal/login" className="w-full text-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border border-slate-200 dark:border-slate-700">{t('nav_team_login', { defaultMessage: 'Team Login' })}</Link>
                <Link href="/portal/login" className="w-full text-center px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg border border-slate-200 dark:border-slate-700">{t('nav_club_login')}</Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/app/register" className="w-full text-center px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg">{t('nav_player_register')}</Link>
                <Link href="/portal/register" className="w-full text-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/25">{t('nav_club_register')}</Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1px] h-[300px] bg-gradient-to-b from-cyan-500/50 to-transparent blur-[2px]"></div>

        {/* Laser Lines */}
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent -rotate-12 transform-gpu"></div>
        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent rotate-12 transform-gpu"></div>

        <div className="relative max-w-4xl mx-auto px-6 text-center z-10">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 border border-slate-300/50 dark:border-slate-700/50 text-xs font-semibold text-slate-700 dark:text-slate-300 tracking-widest uppercase mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            {t('hero_badge')}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            {t('hero_title')}<br />
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {t('hero_subtitle')}
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('hero_desc')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/app/register" className="w-full sm:w-auto px-8 py-4 bg-[#b58fff] hover:bg-[#a67cff] text-slate-950 font-bold rounded-xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(181,143,255,0.3)]">
              {t('hero_btn_player')} <Rocket className="w-5 h-5" />
            </Link>
            <Link href="/portal/login" className="w-full sm:w-auto px-8 py-4 bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white font-bold rounded-xl border border-slate-300/50 dark:border-slate-700/50 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 backdrop-blur-sm">
              {t('hero_secondary_cta')}
            </Link>
            <Link href="/team-portal/register" className="w-full sm:w-auto px-8 py-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 hover:text-emerald-300 font-bold rounded-xl border border-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 backdrop-blur-sm">
              {t('hero_team_cta', { defaultMessage: 'Create Independent Team' })} <Building2 className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="management" className="py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('feat_title')}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              {t('feat_desc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-slate-700 to-slate-800/50 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="h-full bg-white dark:bg-[#111624] p-8 rounded-2xl">
                <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 mb-6">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t('feat_1_title')}</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  {t('feat_1_desc')}
                </p>
                <div className="p-4 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between text-xs font-mono text-slate-500 mb-2 uppercase tracking-wider">
                    <span>{t('feat_1_synergy')}</span>
                    <span className="text-cyan-400">94%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 w-[94%]"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-cyan-500/50 to-slate-800/50 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.1)]">
              <div className="absolute inset-0 bg-gradient-to-bl from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="h-full bg-white dark:bg-[#111624] p-8 rounded-2xl">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 mb-6">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{t('feat_2_title')}</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">
                  {t('feat_2_desc')}
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-400">{t('feat_2_kd')}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">2.45</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-sm text-slate-400">{t('feat_2_winrate')}</span>
                    <span className="font-mono font-bold text-cyan-400">68.2%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Transfer Market Section --- */}
      <section id="marketplace" className="py-24 bg-slate-100 dark:bg-[#0F1420] transition-colors">
        <div className="max-w-7xl mx-auto px-6">

          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3">{t('tm_title')}</h2>
              <p className="text-slate-600 dark:text-slate-400">{t('tm_desc')}</p>
            </div>
            <Link href="/portal/talents" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group">
              {t('tm_view_all')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Player Card 1 */}
            <div className="bg-white dark:bg-[#151A28] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden">
                      <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Avatar" className="w-full h-full object-cover opacity-80" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">{t('tm_badge_global')}</div>
                    <h4 className="font-bold text-lg leading-tight">Kael "Vortex" J.</h4>
                    <span className="text-xs text-slate-500 font-mono mt-1 block">ID: EMC-8831</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_role')}</span>
                  <span className="text-sm font-medium">In-Game Leader (IGL)</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_rank')}</span>
                  <span className="text-sm font-medium text-cyan-400">Apex Predator</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_winrate')}</span>
                  <span className="text-sm font-mono">64.5%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_avg_damage')}</span>
                  <span className="text-sm font-mono">1,450</span>
                </div>
              </div>

              <div className="mb-6">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t('tm_interested')}</span>
                <div className="flex gap-2">
                  <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono">C9</div>
                  <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono">TL</div>
                </div>
              </div>

              <div className="mt-auto">
                <Link href="/portal/register" className="block w-full py-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                  {t('tm_view_profile')}
                </Link>
              </div>
            </div>

            {/* Player Card 2 - Active state */}
            <div className="bg-white dark:bg-[#151A28] rounded-2xl p-6 border-2 border-cyan-500/30 hover:border-cyan-500/50 transition-colors flex flex-col h-full relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.05)]">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 p-[2px]">
                    <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden">
                      <img src="https://i.pravatar.cc/150?u=a04258a2462d826712d" alt="Avatar" className="w-full h-full object-cover opacity-80" />
                    </div>
                  </div>
                  <div>
                    <div className="inline-block px-1.5 py-0.5 bg-cyan-500/20 text-cyan-400 text-[9px] font-mono tracking-widest uppercase mb-1 rounded border border-cyan-500/30">{t('tm_badge_open')}</div>
                    <h4 className="font-bold text-lg leading-tight">Sarah "Echo" M.</h4>
                    <span className="text-xs text-slate-500 font-mono mt-1 block">ID: EMC-9924</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_role')}</span>
                  <span className="text-sm font-medium">Support / Flex</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_rank')}</span>
                  <span className="text-sm font-medium text-cyan-400">Master Tier 1</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_winrate')}</span>
                  <span className="text-sm font-mono">71.2%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_assists')}</span>
                  <span className="text-sm font-mono">14.3</span>
                </div>
              </div>

              <div className="mb-6">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t('tm_interested')}</span>
                <div className="flex gap-2">
                  <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-xs font-mono">SEN</div>
                </div>
              </div>

              <div className="mt-auto">
                <Link href="/portal/register" className="block w-full py-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                  {t('tm_view_profile')}
                </Link>
              </div>
            </div>

            {/* Player Card 3 */}
            <div className="bg-white dark:bg-[#151A28] rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex flex-col h-full">
              <div className="flex items-start justify-between mb-6">
                <div className="flex gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 p-[2px]">
                    <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden">
                      <img src="https://i.pravatar.cc/150?u=a048581f4e29026701d" alt="Avatar" className="w-full h-full object-cover opacity-80" />
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">{t('tm_badge_global')}</div>
                    <h4 className="font-bold text-lg leading-tight">David "Null" C.</h4>
                    <span className="text-xs text-slate-500 font-mono mt-1 block">ID: EMC-4420</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_role')}</span>
                  <span className="text-sm font-medium">Entry Fragger</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_rank')}</span>
                  <span className="text-sm font-medium text-cyan-400">Apex Predator</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_winrate')}</span>
                  <span className="text-sm font-mono">59.8%</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1">{t('tm_kd')}</span>
                  <span className="text-sm font-mono">2.85</span>
                </div>
              </div>

              <div className="mb-6">
                <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-2">{t('tm_interested')}</span>
                <div className="text-xs text-slate-500 italic">{t('tm_no_offers')}</div>
              </div>

              <div className="mt-auto">
                <Link href="/portal/register" className="block w-full py-3 text-center text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                  {t('tm_view_profile')}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- Pricing Section --- */}
      <section id="pricing" className="py-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('price_title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
              {t('price_desc')}
            </p>

            {/* Toggle (Only affects club pricing now) */}
            <div className="inline-flex items-center p-1 bg-slate-200/80 dark:bg-slate-900/80 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-800 dark:text-slate-200'}`}
              >
                {t('price_monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${billingCycle === 'yearly' ? 'bg-cyan-500/20 text-cyan-400 shadow-sm' : 'text-slate-400 hover:text-slate-800 dark:text-slate-200'}`}
              >
                {t('price_yearly')} <span className="ml-1 text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full whitespace-nowrap">{t('price_save')}</span>
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Player Plan */}
            <div className="bg-white dark:bg-[#151A28] rounded-3xl p-8 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-colors flex flex-col relative overflow-hidden">
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{t('price_player_title')}</h3>
                <p className="text-sm text-slate-400">{t('price_player_desc')}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">{t('price_player_price')}</span>
                  <span className="text-slate-500 mb-1">/{t('price_player_period')}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-300">
                <li className="flex gap-3"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> {t('price_player_feat_1')}</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> {t('price_player_feat_2')}</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> {t('price_player_feat_3')}</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-cyan-400 shrink-0" /> {t('price_player_feat_4')}</li>
              </ul>
              <Link href="/app/register" className="w-full py-3.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-xl transition-colors border border-slate-200 dark:border-slate-700 text-center">
                {t('price_player_btn')}
              </Link>
            </div>

            {/* Club Plan */}
            <div className="bg-slate-50 dark:bg-[#111624] rounded-3xl p-8 border-2 border-purple-500/30 hover:border-purple-500/50 transition-colors flex flex-col relative overflow-hidden shadow-[0_0_40px_rgba(168,85,247,0.1)]">
              <div className="absolute top-0 right-0 px-3 py-1 bg-purple-500/20 text-purple-700 dark:text-purple-400 text-xs font-bold rounded-bl-xl border-b border-l border-purple-500/30">
                {t('price_club_badge')}
              </div>
              <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('price_club_title')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('price_club_desc')}</p>
              </div>
              <div className="mb-8">
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-4xl font-bold text-slate-900 dark:text-white">Rp {billingCycle === 'monthly' ? t('price_club_monthly') : t('price_club_yearly')}</span>
                  <span className="text-slate-500 mb-1">/{billingCycle === 'monthly' ? t('price_monthly').toLowerCase() : t('price_yearly').toLowerCase()}</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-1 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex gap-3"><Check className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" /> {t('price_club_feat_1')}</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" /> {t('price_club_feat_2')}</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" /> {t('price_club_feat_3')}</li>
                <li className="flex gap-3"><Check className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0" /> {t('price_club_feat_4')}</li>
              </ul>
              <Link href="/portal/register" className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(168,85,247,0.3)] text-center">
                {t('price_club_btn')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19] pt-16 pb-8 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="EMC Logo" className="w-6 h-6 rounded object-contain grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                EMC
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_privacy')}</Link>
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_tos')}</Link>
              <Link href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">{t('footer_contact')}</Link>
            </div>
          </div>

          <div className="text-center md:text-right text-xs text-slate-600 flex flex-col md:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800/50 pt-8">
            <p className="mb-2 md:mb-0">{t('footer_copyright')}</p>
            <p className="tracking-widest uppercase">{t('footer_tagline')}</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
