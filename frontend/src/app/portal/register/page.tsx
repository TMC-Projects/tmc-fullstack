'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, User } from '@/store/auth';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowRight, User as UserIcon, Tag, UserCircle } from 'lucide-react';

export default function B2BRegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    password: '',
    category: 'owner' // default to owner
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
        throw new Error(data.message || 'Gagal melakukan registrasi');
      }

      const user = data.data.user as User;
      const token = data.data.token;
      const refreshToken = data.data.refresh_token;

      // If validation passed, save to Zustand and redirect
      setAuth(token, refreshToken, user);
      setSuccessMessage('Registrasi sukses! Mengalihkan ke pembuatan profil klub...');

      setTimeout(() => {
        router.push('/portal/club/create');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center relative overflow-hidden font-sans p-4 py-12">
      {/* Background Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Header/Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4 text-emerald-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
            DAFTAR PORTAL B2B
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Registrasi sebagai Owner atau Manager Klub
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
                Nama Lengkap
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <UserIcon className="w-5 h-5" />
                </span>
                <input
                  id="full_name"
                  type="text"
                  required
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <UserCircle className="w-5 h-5" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  placeholder="johndoe99"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Category Field */}
            <div className="space-y-2">
              <label htmlFor="category" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Peran (Role)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <Tag className="w-5 h-5" />
                </span>
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none appearance-none"
                >
                  <option value="owner">Club Owner</option>
                  <option value="manager">Club Manager</option>
                </select>
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Alamat Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="admin@yourclub.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Kata Sandi
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
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
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
              <p className="text-xs text-slate-500 dark:text-slate-500 text-right">Minimal 6 karakter.</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Daftar Sekarang
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
              <span className="bg-slate-100/90 dark:bg-slate-900/90 px-3 text-slate-500 dark:text-slate-500">Sudah punya akun?</span>
            </div>
          </div>

          {/* Redirect to Login */}
          <div className="text-center">
            <a
              href="/portal/login"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 hover:underline font-semibold transition-colors"
            >
              Masuk ke Portal B2B
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="text-center mt-4 pt-4 border-t border-slate-300/80 dark:border-slate-800/80">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Mencari aplikasi untuk Player/Coach?{' '}
              <a
                href="/app/register"
                className="text-cyan-400 hover:text-cyan-300 hover:underline font-semibold transition-colors"
              >
                Daftar Akun B2C
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
