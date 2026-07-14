'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Building2, ArrowRight, MapPin, Globe, Calendar, Settings, Edit3, X, Upload, Trophy, Plus, Trash2, Edit } from 'lucide-react';
import { useTranslations } from 'next-intl';
import OnboardingModal from '@/components/portal/club/OnboardingModal';

import { compressImageToWebp } from '@/utils/imageCompression';

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

    const compressedFile = await compressImageToWebp(file);
    const formDataObj = new FormData();
    formDataObj.append('logo', compressedFile);

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
                <img src={(formData.logo_url?.startsWith('http') ? formData.logo_url : (formData.logo_url?.startsWith('http') ? formData.logo_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${formData.logo_url}`))} alt="Club Logo" className="w-full h-full object-cover bg-white" />
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
      </div>

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
