'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, User, RefreshCw, ClipboardList, Search, MessageSquare, X, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import ClubList, { Club } from '@/components/dashboard/ClubList';
import OpenTrialList, { Trial } from '@/components/dashboard/OpenTrialList';
import TeamInvitations from '@/components/dashboard/TeamInvitations';
import { ThemeToggle } from '@/components/ThemeToggle';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function B2CDashboardPage() {
  const router = useRouter();
  const { token, clearAuth, _hasHydrated } = useAuthStore();
  const t = useTranslations('Dashboard');
  const tProf = useTranslations('Profile'); // For logout

  const [clubs, setClubs] = useState<Club[]>([]);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [searchPlayerId, setSearchPlayerId] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState('');

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

  const handleSearchPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchPlayerId.trim()) {
      router.push(`/app/player/${searchPlayerId.trim()}`);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackMessage.trim()) return;

    setIsSubmittingFeedback(true);
    setFeedbackError('');
    setFeedbackSuccess('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: feedbackMessage })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit feedback');

      setFeedbackSuccess('Thank you! Your feedback has been submitted.');
      setFeedbackMessage('');
      setTimeout(() => {
        setIsFeedbackModalOpen(false);
        setFeedbackSuccess('');
      }, 2000);
    } catch (err: any) {
      setFeedbackError(err.message);
    } finally {
      setIsSubmittingFeedback(false);
    }
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
          <Link href="/app/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img src="/logo.png" alt="TMC Platform Logo" className="h-8 w-auto" />
            <h1 className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent hidden sm:block">
              {t('title')}
            </h1>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/app/applications"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Trial</span>
            </Link>
            <Link
              href="/app/invitations"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-400 transition-colors bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-800"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Invitations</span>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{t('welcome_title')}</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl">{t('welcome_desc')}</p>
            </div>

            <form onSubmit={handleSearchPlayer} className="w-full md:w-auto flex items-center gap-2 bg-white/50 dark:bg-slate-900/50 p-2 rounded-2xl border border-amber-500/30 backdrop-blur-sm shadow-sm">
              <input
                type="text"
                placeholder={t('search_player')}
                value={searchPlayerId}
                onChange={(e) => setSearchPlayerId(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm px-3 w-full md:w-48 text-slate-800 dark:text-slate-200 placeholder:text-slate-500"
              />
              <button
                type="submit"
                disabled={!searchPlayerId.trim()}
                className="p-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-white rounded-xl transition-colors flex items-center justify-center shrink-0"
              >
                <Search className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>

        {/* Invitations Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <TeamInvitations />
        </motion.section>

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

      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsFeedbackModalOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 z-40"
        title="Send Feedback"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Send Feedback</h3>
              <button 
                onClick={() => setIsFeedbackModalOpen(false)}
                className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleFeedbackSubmit}>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                We'd love to hear your thoughts on how we can improve the platform for you.
              </p>
              
              <textarea
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                placeholder="Type your feedback here..."
                className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none focus:ring-2 focus:ring-amber-500 focus:outline-none mb-4 text-slate-900 dark:text-white"
                required
              />

              {feedbackError && <p className="text-sm text-rose-500 mb-3">{feedbackError}</p>}
              {feedbackSuccess && <p className="text-sm text-emerald-500 mb-3">{feedbackSuccess}</p>}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback || !feedbackMessage.trim()}
                  className="px-4 py-2 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                >
                  {isSubmittingFeedback ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  );
}
