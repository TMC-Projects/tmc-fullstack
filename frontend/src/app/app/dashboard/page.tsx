'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, User, RefreshCw, ClipboardList } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import ClubList, { Club } from '@/components/dashboard/ClubList';
import OpenTrialList, { Trial } from '@/components/dashboard/OpenTrialList';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function B2CDashboardPage() {
  const router = useRouter();
  const { token, clearAuth, _hasHydrated } = useAuthStore();
  const t = useTranslations('Dashboard');
  const tProf = useTranslations('Profile'); // For logout

  const [clubs, setClubs] = useState<Club[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const apiKey = process.env.NEXT_PUBLIC_GLOBAL_API_KEY || '';
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Parallel fetching including Profile validation
      const [profileRes, clubsRes, trialsRes, appsRes] = await Promise.all([
        fetch(`${baseUrl}/api/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${baseUrl}/api/global/clubs`, { headers: { 'X-API-Key': apiKey } }),
        fetch(`${baseUrl}/api/global/trials?status=PUBLISHED`, { headers: { 'X-API-Key': apiKey } }),
        fetch(`${baseUrl}/api/my-applications`, { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);

      const [profileData, clubsData, trialsData, appsData] = await Promise.all([
        profileRes.json(),
        clubsRes.json(),
        trialsRes.json(),
        appsRes.json()
      ]);

      // Category Validation
      if (!profileRes.ok || !profileData.success) {
        clearAuth();
        router.push('/app/login');
        return;
      }
      const category = profileData.data?.category;
      if (!['player', 'coach'].includes(category)) {
        router.push('/portal/dashboard');
        return;
      }

      if (!clubsRes.ok) throw new Error(clubsData.message || 'Failed to fetch clubs');
      if (!trialsRes.ok) throw new Error(trialsData.message || 'Failed to fetch trials');
      
      // appsRes might fail if not fully authorized, but we handle it
      if (appsRes.ok) {
        setMyApplications(appsData.data || []);
      } else if (appsRes.status === 401) {
        clearAuth();
        router.push('/app/login');
        return;
      }

      setClubs(clubsData.data || []);
      setTrials(trialsData.data?.items || []);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, clearAuth, router]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/app/login');
      return;
    }
    fetchDashboardData();
  }, [token, _hasHydrated, fetchDashboardData]);

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

  const handleApplySuccess = () => {
    // Refresh only applications to update the count and buttons
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/my-applications`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.data) {
        setMyApplications(data.data);
      }
    })
    .catch(console.error);
  };

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-rose-400 mb-6">{error}</p>
          <button 
            onClick={fetchDashboardData}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <div className="flex items-center gap-3">
            <Link 
              href="/app/applications"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Trial</span>
            </Link>
            <Link 
              href="/app/profile"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">{t('view_profile')}</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-rose-400 transition-colors bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{tProf('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-12">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Welcome to Njara Platform</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">Find your dream club, apply for open trials, and start your professional esports journey today.</p>
        </motion.div>

        {/* Trials Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <OpenTrialList 
            trials={trials} 
            myApplications={myApplications} 
            onApplySuccess={handleApplySuccess} 
          />
        </motion.section>

        {/* Clubs Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ClubList clubs={clubs} />
        </motion.section>
      </div>
    </main>
  );
}
