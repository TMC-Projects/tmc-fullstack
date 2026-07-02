'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAlertStore } from '@/store/alertStore';

import ProfileHeader from '@/components/profile/ProfileHeader';
import StatList from '@/components/profile/StatList';
import SocialMediaList from '@/components/profile/SocialMediaList';
import AchievementList from '@/components/profile/AchievementList';
import HighlightList from '@/components/profile/HighlightList';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function SharedPlayerProfilePage() {
  const router = useRouter();
  const params = useParams();
  const playerId = params.id as string;
  const { token, _hasHydrated, user: currentUser } = useAuthStore();
  const { showAlert } = useAlertStore();

  const [profileData, setProfileData] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/app/login');
      return;
    }
    fetchPlayerProfile();
    checkFollowStatus();
  }, [token, _hasHydrated, playerId, router]);

  const fetchPlayerProfile = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/players/${playerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch player profile');
      }

      setProfileData(data.data.user);
      setFollowersCount(data.data.followers_count || 0);
      setFollowingCount(data.data.following_count || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFollowStatus = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/users/${playerId}/follow-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIsFollowing(data.data.is_following);
      }
    } catch (err) {
      console.error('Failed to check follow status', err);
    }
  };

  const toggleFollow = async () => {
    if (!token) return;
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/users/${playerId}/${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || `Failed to ${endpoint} user`);
      }
      
      setIsFollowing(!isFollowing);
      setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);
      showAlert(data.message, 'success');
    } catch (err: any) {
      showAlert(err.message, 'error');
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
          <p className="text-rose-400 mb-6">{error || 'Player not found'}</p>
          <div className="flex gap-4 w-full">
            <button 
              onClick={() => router.back()}
              className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl transition-colors"
            >
              Go Back
            </button>
            <button 
              onClick={fetchPlayerProfile}
              className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id?.toString() === playerId;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 overflow-x-hidden">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-violet-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-200">Player Profile</h1>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
          </div>

        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-12">
        {/* Profile Header */}
        <ProfileHeader 
          user={profileData} 
          isEditable={false} 
          followersCount={followersCount}
          followingCount={followingCount}
          isFollowing={isFollowing}
          onFollowToggle={isOwnProfile ? undefined : toggleFollow}
        />

        {/* Sections Wrapper */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 gap-12"
        >
          {/* Social Media Section */}
          <section>
            <SocialMediaList socialMedias={profileData.social_medias || []} isEditable={false} />
          </section>

          {/* Stats Section */}
          <section>
            <StatList stats={profileData.stats || []} isEditable={false} />
          </section>

          {/* Achievements Section */}
          <section>
            <AchievementList achievements={profileData.achievements || []} isEditable={false} />
          </section>

          {/* Highlights Section */}
          <section>
            <HighlightList highlights={profileData.highlights || []} isEditable={false} />
          </section>
        </motion.div>
      </div>
    </main>
  );
}
