'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Building2, ArrowRight, MapPin, Globe, Calendar } from 'lucide-react';

export default function CreateClubPage() {
  const router = useRouter();
  const { token, _hasHydrated, clearAuth } = useAuthStore();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    country: '',
    established_year: new Date().getFullYear()
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (_hasHydrated && !token) {
      router.push('/portal/login');
    }
  }, [token, _hasHydrated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.id]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            category: 'club',
            status: 'trial'
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          clearAuth();
          router.push('/portal/login');
          return;
        }
        throw new Error(data.message || 'Gagal membuat profil klub');
      }

      setSuccessMessage('Profil klub berhasil dibuat! Mengalihkan ke dashboard...');

      setTimeout(() => {
        router.push('/portal/dashboard');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!_hasHydrated) return null;

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
            PROFIL KLUB
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Lengkapi data klub Anda untuk melanjutkan
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

            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Nama Klub
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <Building2 className="w-5 h-5" />
                </span>
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="e.g. EVOS Esports"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Country Field */}
            <div className="space-y-2">
              <label htmlFor="country" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Negara
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <Globe className="w-5 h-5" />
                </span>
                <input
                  id="country"
                  type="text"
                  placeholder="e.g. Indonesia"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Established Year Field */}
            <div className="space-y-2">
              <label htmlFor="established_year" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Tahun Berdiri
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <Calendar className="w-5 h-5" />
                </span>
                <input
                  id="established_year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="e.g. 2021"
                  value={formData.established_year}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                />
              </div>
            </div>

            {/* Address Field */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                Alamat Lengkap (Opsional)
              </label>
              <div className="relative">
                <span className="absolute top-3 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                  <MapPin className="w-5 h-5" />
                </span>
                <textarea
                  id="address"
                  rows={3}
                  placeholder="Alamat kantor pusat atau basecamp..."
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none resize-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Simpan Profil Klub
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
