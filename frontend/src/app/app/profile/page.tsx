'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import ProfileHeader from '@/components/profile/ProfileHeader';
import StatList from '@/components/profile/StatList';
import SocialMediaList from '@/components/profile/SocialMediaList';
import AchievementList from '@/components/profile/AchievementList';
import HighlightList from '@/components/profile/HighlightList';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function B2CProfilePage() {
  const router = useRouter();
  const { token, clearAuth, _hasHydrated } = useAuthStore();
  const t = useTranslations('Profile');

  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/app/login');
      return;
    }
    fetchProfile();
  }, [token, _hasHydrated, router]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch profile');
      }

      // Category Validation
      const category = data.data?.category;
      if (!['player', 'coach'].includes(category)) {
        router.push('/portal/dashboard');
        return;
      }

      setProfileData(data.data);
    } catch (err: any) {
      setError(err.message);
      if (err.message.toLowerCase().includes('unauthorized') || err.message.toLowerCase().includes('token')) {
        clearAuth();
        router.push('/app/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <p className="text-rose-400 mb-6">{error || 'Failed to load profile'}</p>
          <button 
            onClick={fetchProfile}
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
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">{t('title')}</h1>
          <div className="flex items-center gap-3">
            <Link 
              href="/app/dashboard"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-rose-400 transition-colors bg-slate-100 dark:bg-slate-900 hover:bg-rose-500/10 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-12">
        {/* Profile Header */}
        <ProfileHeader user={profileData} isEditable={true} onRefresh={fetchProfile} />

        {/* Sections Wrapper */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 gap-12"
        >
          {/* Social Media Section */}
          <section>
            <SocialMediaList socialMedias={profileData.social_medias || []} isEditable={true} onRefresh={fetchProfile} />
          </section>

          {/* Stats Section */}
          <section>
            <StatList stats={profileData.stats || []} isEditable={true} onRefresh={fetchProfile} />
          </section>

          {/* Highlights Section */}
          <section>
            <HighlightList highlights={profileData.highlights || []} isEditable={true} onRefresh={fetchProfile} />
          </section>

          {/* Bottom Grid for Achievements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section>
              <AchievementList achievements={profileData.achievements || []} isEditable={true} onRefresh={fetchProfile} />
            </section>
            {/* Empty section for layout balance or future expansion */}
            <section className="hidden lg:block"></section>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
