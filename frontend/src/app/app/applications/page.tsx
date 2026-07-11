'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';
import { 
  ChevronLeft, Calendar, MessageSquare, ShieldAlert, Building2, CheckCircle2, XCircle, Clock
, CreditCard } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import B2CNavbar from '@/components/dashboard/B2CNavbar';

interface Trial {
  ID: number;
  Title: string;
  StartDate: string;
  EndDate: string;
  Club: {
    ID?: number;
    id?: number;
    Name?: string;
    name?: string;
    LogoUrl?: string;
    logo_url?: string;
  };
}

interface Application {
  ID: number;
  TrialID: number;
  Trial: Trial;
  Status: string;
  AppliedAt: string;
  Remarks: string;
}

export default function MyApplicationsPage() {
  const t = useTranslations('MyApplications');
  const router = useRouter();
  const { token, _hasHydrated } = useAuthStore();

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplications = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/my-applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || t('error_fetch'));
      }
      setApplications(data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (_hasHydrated) {
      if (!token) {
        router.push('/app/login');
        return;
      }
      fetchApplications();
    }
  }, [_hasHydrated, token, fetchApplications, router]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SHORTLISTED': return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case 'REJECTED': return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'WITHDRAWN': return <ShieldAlert className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
      default: return <Clock className="w-5 h-5 text-indigo-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SHORTLISTED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'WITHDRAWN': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20';
      default: return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'APPLIED': return t('status_applied');
      case 'SHORTLISTED': return t('status_shortlisted');
      case 'REJECTED': return t('status_rejected');
      case 'WITHDRAWN': return t('status_withdrawn');
      default: return status;
    }
  };

  if (!_hasHydrated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 pb-20">
      <B2CNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl h-32"></div>
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-500 dark:text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{t('no_applications_title')}</h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md">{t('no_applications_desc')}</p>
            <Link 
              href="/app/dashboard"
              className="mt-6 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-xl transition-colors"
            >
              Cari Trial
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div 
                key={app.ID} 
                className="bg-slate-100/50 dark:bg-slate-900/50 hover:bg-slate-200/40 dark:hover:bg-slate-800/40 border border-slate-300 dark:border-slate-800 rounded-2xl p-5 transition-colors group relative overflow-hidden"
              >
                {/* Decorative background glow for shortlisted */}
                {app.Status === 'SHORTLISTED' && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                )}
                
                <div className="flex flex-col sm:flex-row justify-between gap-4 relative z-10">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-400 transition-colors">
                        {app.Trial?.Title || t('unknown_trial')}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                        <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-500" />
                        {app.Trial?.Club?.Name || app.Trial?.Club?.name || t('unknown_club')}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-500 flex-wrap mt-2">
                      <div className="flex items-center gap-1.5 bg-slate-50/50 dark:bg-slate-950/50 px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        <span>{t('execution')} <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(app.Trial?.StartDate)}</span> {t('to')} <span className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(app.Trial?.EndDate)}</span></span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                        <span>{t('applied_on')} {formatDate(app.AppliedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end gap-3 sm:min-w-[140px]">
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${getStatusColor(app.Status)}`}>
                      {getStatusIcon(app.Status)}
                      {getStatusLabel(app.Status)}
                    </div>
                  </div>
                </div>

                {app.Remarks && (
                  <div className="mt-4 pt-4 border-t border-slate-300/50 dark:border-slate-800/50 relative z-10">
                    <div className="flex items-start gap-2 bg-slate-50/50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-300/50 dark:border-slate-800/50">
                      <MessageSquare className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('club_notes')}</div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{app.Remarks}"</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
