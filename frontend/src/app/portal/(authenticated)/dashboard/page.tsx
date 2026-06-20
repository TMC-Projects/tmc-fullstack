'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, RefreshCw, Building2, UserCircle, Menu, X , Settings} from "lucide-react";
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import MemberStats from '@/components/portal/dashboard/MemberStats';
import RecentApplications from '@/components/portal/dashboard/RecentApplications';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function PortalDashboardPage() {
  const router = useRouter();
  const { token, user, clearAuth, _hasHydrated } = useAuthStore();
  const t = useTranslations('PortalDashboard');
  const tCommon = useTranslations('Profile');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // States for MemberStats
  const [counts, setCounts] = useState({
    player: 0,
    coach: 0,
    staff: 0,
    ba: 0
  });

  // States for RecentApplications
  const [trials, setTrials] = useState<any[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch member lists & profile validation
      const endpoints = ['players', 'coaches', 'staff', 'ba'];
      const countPromises = endpoints.map(ep => 
        fetch(`${baseUrl}/api/${ep}`, { headers }).then(res => res.json())
      );

      // Fetch profile for validation
      const profilePromise = fetch(`${baseUrl}/api/profile`, { headers }).then(res => res.json());

      // Fetch trials for this club
      const trialsPromise = fetch(`${baseUrl}/api/trials?club_id=${user?.club_id}`, { headers })
        .then(res => res.json());

      const [profileRes, playersRes, coachesRes, staffRes, baRes, trialsRes] = await Promise.all([
        profilePromise,
        ...countPromises,
        trialsPromise
      ]);

      // Category Validation
      if (!profileRes.success) {
        clearAuth();
        router.push('/portal/login');
        return;
      }
      const category = profileRes.data?.category;
      if (['player', 'coach'].includes(category)) {
        router.push('/app/dashboard');
        return;
      }

      if (!playersRes.success) throw new Error(playersRes.message || 'Failed to fetch players');
      
      setCounts({
        player: playersRes.data?.length || 0,
        coach: coachesRes.data?.length || 0,
        staff: staffRes.data?.length || 0,
        ba: baRes.data?.length || 0
      });

      // Handle trials pagination object vs array
      const trialsArray = trialsRes.data?.items || trialsRes.data || [];
      setTrials(Array.isArray(trialsArray) ? trialsArray : []);

    } catch (err: any) {
      setError(err.message);
      if (err.message.toLowerCase().includes('unauthorized')) {
        clearAuth();
        router.push('/portal/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.club_id, clearAuth, router]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/portal/login');
      return;
    }
    // RBAC
    if (['player'].includes(user?.category || '')) {
      router.push('/app/dashboard');
      return;
    }
    if (user?.category === 'coach') {
      router.push('/portal/trials');
      return;
    }
    
    fetchDashboardData();
  }, [token, user, _hasHydrated, fetchDashboardData, router]);

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

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
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


      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-12">
        {/* Welcome Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">Welcome Back, {user?.full_name}</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">Manage your club members and review incoming trial applications to build your perfect roster.</p>
        </motion.div>

        {/* Stats Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <MemberStats 
            playerCount={counts.player} 
            coachCount={counts.coach} 
            staffCount={counts.staff} 
            baCount={counts.ba} 
          />
        </motion.section>

        {/* Applications Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <RecentApplications trials={trials} />
        </motion.section>
      </div>
    </main>
  );
}
