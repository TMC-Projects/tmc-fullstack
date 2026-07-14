'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, RefreshCw, LayoutDashboard , CreditCard, X, Key } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useAlertStore } from '@/store/alertStore';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import ProfileHeader from '@/components/profile/ProfileHeader';
import StatList from '@/components/profile/StatList';
import SocialMediaList from '@/components/profile/SocialMediaList';
import AchievementList from '@/components/profile/AchievementList';
import HighlightList from '@/components/profile/HighlightList';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import B2CNavbar from '@/components/dashboard/B2CNavbar';

export default function B2CProfilePage() {
  const router = useRouter();
  const { token, clearAuth, _hasHydrated } = useAuthStore();
  const showAlert = useAlertStore((state) => state.showAlert);
  const t = useTranslations('Profile');

  const [profileData, setProfileData] = useState<any>(null);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

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

      // Fetch followers/following count
      try {
        const countsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/players/${data.data.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const countsData = await countsRes.json();
        if (countsRes.ok && countsData.success) {
          setFollowersCount(countsData.data.followers_count || 0);
          setFollowingCount(countsData.data.following_count || 0);
        }
      } catch (err) {
        // gracefully ignore
      }
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showAlert('New passwords do not match', 'error');
      return;
    }

    setLoadingPassword(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          old_password: passwordForm.old_password,
          new_password: passwordForm.new_password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Password updated successfully!', 'success');
        setIsPasswordModalOpen(false);
        setPasswordForm({
          old_password: '',
          new_password: '',
          confirm_password: '',
        });
      } else {
        showAlert(data.message || 'Failed to update password', 'error');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      showAlert('An error occurred while updating password', 'error');
    } finally {
      setLoadingPassword(false);
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
      <B2CNavbar />

      <div className="max-w-5xl mx-auto px-4 md:px-8 mt-8 space-y-12">
        {/* Profile Header */}
        <ProfileHeader 
          user={profileData} 
          isEditable={true} 
          onRefresh={fetchProfile}
          followersCount={followersCount}
          followingCount={followingCount}
          onChangePasswordClick={() => setIsPasswordModalOpen(true)}
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
          </div>
        </motion.div>
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
                <Key className="w-5 h-5 text-violet-500" />
                Change Password
              </h3>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">Old Password</label>
                  <input
                    type="password"
                    value={passwordForm.old_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                    required
                  />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-2xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loadingPassword}
                    className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-400 hover:to-fuchsia-400 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    {loadingPassword ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
