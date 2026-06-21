'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, User } from '@/store/auth';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function B2BLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const t = useTranslations('Auth');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('error_credentials'));
      }

      const user = data.data.user as User;
      const token = data.data.token;
      const refreshToken = data.data.refresh_token;

      // Rule: B2C accounts (player) must be rejected on B2B login page. Coach is allowed.
      const allowedPortalRoles = ['owner', 'manager', 'staff', 'ba', 'coach'];
      if (!allowedPortalRoles.includes(user.category)) {
        throw new Error(t('error_b2c'));
      }

      // If validation passed, save to Zustand and redirect
      setAuth(token, refreshToken, user);
      setSuccessMessage(t('login_success'));

      setTimeout(() => {
        if (user.category === 'coach') {
          router.push('/portal/trials');
        } else {
          router.push('/portal/dashboard');
        }
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || t('system_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center relative overflow-hidden font-sans p-4">
      <LanguageSwitcher />
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header/Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4 text-emerald-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
            {t('login_title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {t('login_subtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-100/60 dark:bg-slate-900/60 border border-slate-300/80 dark:border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl animate-shake">
                {errorMessage}
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl">
                {successMessage}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                {t('email_label')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder={t('email_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                {t('password_label')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder={t('password_placeholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('login_button')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Separation Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300/80 dark:border-slate-800/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-100/90 dark:bg-slate-900/90 px-3 text-slate-500 dark:text-slate-500">{t('other_portal')}</span>
            </div>
          </div>

          {/* Redirect to Register */}
          <div className="text-center mb-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('no_account')}{' '}
              <a
                href="/portal/register"
                className="text-emerald-400 hover:text-emerald-300 hover:underline font-semibold transition-colors"
              >
                {t('register_here')}
              </a>
            </p>
          </div>

          {/* Redirect B2C */}
          <div className="text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t('b2c_question')}{' '}
              <a
                href="/app/login"
                className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold transition-colors"
              >
                {t('b2c_login')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
