'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, MapPin, Calendar, Building2, ChevronLeft, Flag , CreditCard } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import B2CNavbar from '@/components/dashboard/B2CNavbar';

interface ClubDetail {
  id: number;
  name: string;
  logo_url: string;
  status: string;
  category: string;
  address: string;
  country: string;
  established_year: number;
}

export default function ClubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clubId) return;

    const fetchClub = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GLOBAL_API_KEY || '';
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/global/clubs/${clubId}`, {
          headers: {
            'X-API-Key': apiKey,
          }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Gagal memuat data klub');
        }
        setClub(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClub();
  }, [clubId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <Shield className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Klub Tidak Ditemukan</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'Data klub tidak tersedia.'}</p>
        <Link href="/app/dashboard" className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 pb-20">
      <B2CNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 sm:p-10 relative overflow-hidden"
        >
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start relative z-10">
            {/* Logo */}
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl shadow-indigo-500/10">
              {club.logo_url ? (
                <img src={club.logo_url.startsWith('http') ? club.logo_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${club.logo_url.startsWith('/') ? '' : '/'}${club.logo_url}`} alt={club.name} className="w-full h-full object-cover" />
              ) : (
                <Shield className="w-16 h-16 text-slate-700" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2">{club.name}</h1>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-medium capitalize">
                    {club.category}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium border rounded-lg uppercase ${
                    club.status === 'open' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {club.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-300 dark:border-slate-800">
                <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-5 h-5 text-slate-500 dark:text-slate-500" />
                  <span>{club.address || 'Alamat tidak tersedia'}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-600 dark:text-slate-400">
                  <Flag className="w-5 h-5 text-slate-500 dark:text-slate-500" />
                  <span>{club.country || 'Negara tidak tersedia'}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-5 h-5 text-slate-500 dark:text-slate-500" />
                  <span>Berdiri tahun {club.established_year || '-'}</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-3 text-slate-600 dark:text-slate-400">
                  <Building2 className="w-5 h-5 text-slate-500 dark:text-slate-500" />
                  <span>Penyelenggara B2B Berizin</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
