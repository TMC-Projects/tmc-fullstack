'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, User } from '@/store/auth';
import { Mail, Lock, Eye, EyeOff, Gamepad2, ArrowRight, User as UserIcon, Tag, UserCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function B2CRegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const t = useTranslations('AppAuth');

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    category: 'player' // default to player
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/register`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('register_error'));
      }

      const user = data.data.user as User;
      const token = data.data.token;
      const refreshToken = data.data.refresh_token;

      // If validation passed, save to Zustand and redirect
      setAuth(token, refreshToken, user);
      setSuccessMessage(t('register_success'));

      setTimeout(() => {
        router.push('/app/dashboard');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || t('system_error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center relative overflow-hidden font-sans p-4 py-12">
      <LanguageSwitcher />
      {/* Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header/Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-violet-500/10 border border-violet-500/20 rounded-2xl mb-4 text-violet-400">
            <Gamepad2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-indigo-200 to-cyan-400 bg-clip-text text-transparent">
            {t('register_title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {t('register_subtitle')}
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-100/60 dark:bg-slate-900/60 border border-slate-300/80 dark:border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
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

            {/* Full Name Field */}
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                {t('fullname_label')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <UserIcon className="w-5 h-5" />
                </span>
                <input
                  id="full_name"
                  type="text"
                  required
                  placeholder={t('fullname_placeholder')}
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                {t('username_label')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <UserCircle className="w-5 h-5" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder={t('username_placeholder')}
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                {t('role_label')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <Tag className="w-5 h-5" />
                </span>
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none appearance-none"
                >
                  <option value="player">{t('player')}</option>
                  <option value="coach">{t('coach')}</option>
                </select>
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
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
                  minLength={6}
                  placeholder={t('password_placeholder')}
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-500 text-right">{t('password_hint')}</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-violet-900/20 hover:shadow-violet-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {t('register_button')}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Separation Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300/80 dark:border-slate-800/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-100/90 dark:bg-slate-900/90 px-3 text-slate-500 dark:text-slate-500">{t('have_account')}</span>
            </div>
          </div>

          {/* Redirect to Login */}
          <div className="text-center">
            <a
              href="/app/login"
              className="inline-flex items-center gap-2 text-violet-400 hover:text-violet-300 hover:underline font-semibold transition-colors"
            >
              {t('login_here')}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
