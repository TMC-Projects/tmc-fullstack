'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Building2, ArrowRight, MapPin, Globe, Calendar, Settings, Edit3, X, Upload, Trophy, Plus, Trash2, Edit } from 'lucide-react';
import { useTranslations } from 'next-intl';
import OnboardingModal from '@/components/portal/club/OnboardingModal';

export default function EditClubPage() {
  const router = useRouter();
  const t = useTranslations('EditClub');
  const { token, user, _hasHydrated, clearAuth, updateUser } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    country: '',
    established_year: new Date().getFullYear(),
    organization_name: '',
    nib: '',
    npwp: '',
    logo_url: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Achievements State
  const [achievements, setAchievements] = useState<any[]>([]);
  const [isAchModalOpen, setIsAchModalOpen] = useState(false);
  const [editingAch, setEditingAch] = useState<any>(null);
  const [achForm, setAchForm] = useState({ title: '', description: '', date: '' });
  const [isSavingAch, setIsSavingAch] = useState(false);

  // Onboarding State
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // Protect route
  useEffect(() => {
    if (_hasHydrated) {
      if (!token) {
        router.push('/portal/login');
      } else if (user?.category !== 'owner' && user?.category !== 'manager') {
        router.push('/portal/dashboard');
      }
    }
  }, [token, user, _hasHydrated, router]);

  // Fetch current club data
  const fetchClub = async () => {
    if (!user?.club_id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      let onboardingResData = null;
      if (!user.verify) {
        try {
          const obRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}/onboarding`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (obRes.ok) {
            const obData = await obRes.json();
            if (obData.data) {
              setOnboardingStatus(obData.data.status);
            }
          }
        } catch (e) {
          console.error('Failed to fetch onboarding status', e);
        }
      }

      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.data.name || '',
          address: data.data.address || '',
          country: data.data.country || '',
          established_year: data.data.established_year || new Date().getFullYear(),
          organization_name: data.data.organization_name || '',
          nib: data.data.nib || '',
          npwp: data.data.npwp || '',
          logo_url: data.data.logo_url || ''
        });
        setAchievements(data.data.achievements || []);
      }
    } catch (err) {
      console.error('Failed to fetch club data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (_hasHydrated && user?.club_id) {
      fetchClub();
    }
  }, [user, _hasHydrated]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.id]: value
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.club_id) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage(t('error_max_size'));
      setTimeout(() => setErrorMessage(''), 3000);
      return;
    }

    setIsUploadingLogo(true);
    setErrorMessage('');

    const formDataObj = new FormData();
    formDataObj.append('logo', file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}/upload-logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || t('error_upload_logo'));

      const newLogoUrl = resData.data.logo_url;
      setFormData(prev => ({ ...prev, logo_url: newLogoUrl }));
      updateUser({ club_logo_url: newLogoUrl });
      setSuccessMessage(t('success_upload_logo'));
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || t('error_upload_logo'));
      setTimeout(() => setErrorMessage(''), 3000);
    } finally {
      setIsUploadingLogo(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.club_id) return;

    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
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
        throw new Error(data.message || t('error_save_profile'));
      }

      setSuccessMessage(t('success_save_profile'));
      setIsEditing(false); // Switch back to view mode
      await fetchClub(); // Refresh data

    } catch (err: any) {
      setErrorMessage(err.message || t('error_save_profile'));
    } finally {
      setIsSaving(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleOpenAddAch = () => {
    setAchForm({ title: '', description: '', date: '' });
    setEditingAch(null);
    setIsAchModalOpen(true);
  };

  const handleOpenEditAch = (ach: any) => {
    setAchForm({
      title: ach.title,
      description: ach.description,
      date: ach.date ? ach.date.substring(0, 10) : ''
    });
    setEditingAch(ach);
    setIsAchModalOpen(true);
  };

  const handleSaveAchievement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.club_id) return;

    setIsSavingAch(true);
    setErrorMessage('');

    try {
      const url = editingAch
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}/achievements/${editingAch.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}/achievements`;

      const method = editingAch ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(achForm)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || t('error_save_ach'));
      }

      setSuccessMessage(t('success_save_ach'));
      setIsAchModalOpen(false);
      await fetchClub();
    } catch (err: any) {
      setErrorMessage(err.message || t('error_save_ach'));
    } finally {
      setIsSavingAch(false);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleDeleteAchievement = async (id: number) => {
    if (!user?.club_id || !confirm(t('confirm_delete_ach'))) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${user.club_id}/achievements/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(t('error_delete_ach'));
      setSuccessMessage(t('success_delete_ach'));
      await fetchClub();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-start justify-center relative overflow-hidden font-sans p-4 py-12">
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-4xl z-10">
        <div className="text-center mb-8 relative">
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 via-teal-200 to-cyan-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {t('subtitle')}
          </p>
        </div>

        <div className="bg-slate-100/60 dark:bg-slate-900/60 border border-slate-300/80 dark:border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl">
              {successMessage}
            </div>
          )}

          <div className="flex flex-col items-center mb-8">
            <div className="relative group w-24 h-24 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 shadow-sm flex items-center justify-center">
              {formData.logo_url ? (
                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${formData.logo_url}`} alt="Club Logo" className="w-full h-full object-cover bg-white" />
              ) : (
                <Building2 className="w-10 h-10 text-slate-400" />
              )}
              {isEditing && (
                <label className={`absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity ${isUploadingLogo ? 'opacity-100 cursor-not-allowed' : ''}`}>
                  {isUploadingLogo ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">{t('change_logo')}</span>
                    </>
                  )}
                  <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} disabled={isUploadingLogo} />
                </label>
              )}
            </div>
          </div>

          {!user?.verify && !isEditing && (user?.category === 'owner' || user?.category === 'manager') && (
            <div
              className={`mb-8 border rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                onboardingStatus === 'pending'
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}
            >
              <div>
                <h3 className={`text-md font-bold ${onboardingStatus === 'pending' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {onboardingStatus === 'pending' ? t('onboarding_pending_title') : t('onboarding_unverified_title')}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {onboardingStatus === 'pending' 
                    ? t('onboarding_pending_desc')
                    : t('onboarding_unverified_desc')}
                </p>
              </div>
              
              {onboardingStatus !== 'pending' && (
                <button
                  onClick={() => setIsOnboardingModalOpen(true)}
                  className="whitespace-nowrap px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl transition-colors shadow-lg shadow-emerald-900/20"
                >
                  {t('onboarding_btn')}
                </button>
              )}
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">{t('club_name')}</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.name || t('empty_value')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">{t('organization_name')}</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.organization_name || t('empty_value')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">{t('country')}</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.country || t('empty_value')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">{t('established_year')}</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.established_year || t('empty_value')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">{t('nib')}</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.nib || t('empty_value')}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">{t('npwp')}</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{formData.npwp || t('empty_value')}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">{t('full_address')}</h3>
                  <p className="text-slate-800 dark:text-slate-200 font-medium bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-300/50 dark:border-slate-800/50">{formData.address || t('empty_value')}</p>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-300 dark:border-slate-800 flex gap-4">
                <button
                  onClick={() => router.back()}
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 hover:text-slate-300 text-slate-700 dark:text-slate-300 font-medium rounded-2xl transition-colors text-center"
                >
                  {t('back')}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  {t('edit_profile')}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm rounded-2xl animate-shake">
                  {errorMessage}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    {t('club_name')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-600 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="organization_name" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    {t('organization_name')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                      <Building2 className="w-5 h-5" />
                    </span>
                    <input
                      id="organization_name"
                      type="text"
                      value={formData.organization_name}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="country" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    {t('country')}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                      <Globe className="w-5 h-5" />
                    </span>
                    <input
                      id="country"
                      type="text"
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="established_year" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    {t('established_year')}
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
                      value={formData.established_year}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="nib" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    {t('nib')}
                  </label>
                  <input
                    id="nib"
                    type="text"
                    value={formData.nib}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="npwp" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    {t('npwp')}
                  </label>
                  <input
                    id="npwp"
                    type="text"
                    value={formData.npwp}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                  {t('full_address')}
                </label>
                <div className="relative">
                  <span className="absolute top-3 left-0 pl-4 flex items-center text-slate-500 dark:text-slate-500">
                    <MapPin className="w-5 h-5" />
                  </span>
                  <textarea
                    id="address"
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-2xl transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      {t('save')}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Achievements Section */}
        <div className="mt-8 bg-slate-100/60 dark:bg-slate-900/60 border border-slate-300/80 dark:border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl relative">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                <Trophy className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{t('achievements_title')}</h2>
            </div>
            <button
              onClick={handleOpenAddAch}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium rounded-xl transition-colors flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              {t('add_achievement')}
            </button>
          </div>

          {achievements.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              {t('no_achievements')}
            </div>
          ) : (
            <div className="space-y-4">
              {achievements.map((ach) => (
                <div key={ach.id} className="p-5 bg-white/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-start justify-between group">
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200">{ach.title}</h4>
                    {ach.description && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{ach.description}</p>}
                    <p className="text-xs text-slate-500 mt-2">{new Date(ach.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEditAch(ach)} className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteAchievement(ach.id)} className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Achievement Modal */}
      {isAchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setIsAchModalOpen(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              {editingAch ? t('edit_achievement_modal') : t('add_achievement_modal')}
            </h3>

            <form onSubmit={handleSaveAchievement} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">{t('ach_title')}</label>
                <input
                  type="text"
                  required
                  value={achForm.title}
                  onChange={e => setAchForm({ ...achForm, title: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                  placeholder={t('ach_title_placeholder')}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">{t('ach_date')}</label>
                <input
                  type="date"
                  required
                  value={achForm.date}
                  onChange={e => setAchForm({ ...achForm, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">{t('ach_desc')}</label>
                <textarea
                  rows={3}
                  value={achForm.description}
                  onChange={e => setAchForm({ ...achForm, description: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-2xl text-slate-900 dark:text-slate-100 transition-all outline-none resize-none"
                  placeholder={t('ach_desc_placeholder')}
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAchModalOpen(false)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-2xl transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSavingAch}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg transition-all"
                >
                  {isSavingAch ? t('saving') : t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <OnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        token={token || ''}
        clubId={user?.club_id || 0}
        initialData={{
          organization_name: formData.organization_name,
          nib: formData.nib,
          npwp: formData.npwp
        }}
        onSuccess={() => {
          setIsOnboardingModalOpen(false);
          setOnboardingStatus('pending');
        }}
      />
    </main>
  );
}
