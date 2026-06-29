'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Link from 'next/link';

export default function TeamPortalDashboardPage() {
  const router = useRouter();
  const { token, user, clearAuth, _hasHydrated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch profile for validation
      const profilePromise = fetch(`${baseUrl}/api/profile`, { headers }).then(res => res.json());

      const [profileRes] = await Promise.all([
        profilePromise,
      ]);

      // Category Validation
      if (!profileRes.success) {
        clearAuth();
        router.push('/team-portal/login');
        return;
      }
      
      const category = profileRes.data?.category;
      if (category !== 'team_owner' && category !== 'owner') {
        router.push('/portal/dashboard'); // redirect away if not team owner
        return;
      }

    } catch (err: any) {
      setError(err.message);
      if (err.message.toLowerCase().includes('unauthorized')) {
        clearAuth();
        router.push('/team-portal/login');
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, clearAuth, router]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/team-portal/login');
      return;
    }
    
    fetchDashboardData();
  }, [token, _hasHydrated, fetchDashboardData, router]);

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
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-8 space-y-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              Team Portal Dashboard
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Welcome back, {user?.full_name || 'Owner'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-lg mb-4">Manage Teams</h3>
                <p className="text-slate-500 mb-6">Create and manage your independent esports teams.</p>
                <Link href="/team-portal/teams" className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium inline-block">View Teams</Link>
            </div>
            <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-lg mb-4">Find Players</h3>
                <p className="text-slate-500 mb-6">Browse and recruit free agents to join your teams.</p>
                <Link href="/team-portal/player-freeagent" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium inline-block">View Free Agents</Link>
            </div>
            <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-3xl p-6">
                <h3 className="font-bold text-lg mb-4">Subscriptions</h3>
                <p className="text-slate-500 mb-6">Manage your Team Portal subscriptions and billing.</p>
                <Link href="/team-portal/subscriptions" className="px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-medium inline-block">View Subscriptions</Link>
            </div>
        </div>
      </div>
    </main>
  );
}
