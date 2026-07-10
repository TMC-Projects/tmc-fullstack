'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Shield, Activity, Calendar, CreditCard, Clock, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SubscriptionCard, { Plan } from '@/components/portal/subscriptions/SubscriptionCard';

interface ActiveSubscription {
  id: number;
  club_id: number;
  plan_id: number;
  paid_at: string;
  expired_at: string;
  status: string; // "pending", "paid", "expired", "failed"
  created_at: string;
  plan: Plan;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const { token, user, _hasHydrated } = useAuthStore();
  const t = useTranslations('Subscriptions');
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const fetchPlans = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/subscriptions/plans`);
      const data = await res.json();
      if (res.ok && data.data) {
        // Map data to handle PascalCase from backend just in case json tags are not applied
        const mappedPlans = data.data.map((p: any) => ({
          id: p.id ?? p.ID,
          name: p.name ?? p.Name,
          duration_months: p.duration_months ?? p.DurationMonths,
          price: p.price ?? p.Price ?? 0,
          discount: p.discount ?? p.Discount ?? 0,
          description: p.description ?? p.Description,
          is_active: p.is_active ?? p.IsActive,
          created_at: p.created_at ?? p.CreatedAt
        }));
        setPlans(mappedPlans);
      }
    } catch (err) {
      console.error("Failed to fetch plans", err);
    }
  }, []);

  const fetchMySub = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/subscriptions/my-club`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.data && data.data.length > 0) {
        // Map data to handle PascalCase from backend
        const mappedSubs = data.data.map((s: any) => ({
          id: s.id || s.ID,
          club_id: s.club_id || s.ClubID,
          plan_id: s.plan_id || s.PlanID,
          paid_at: s.paid_at || s.PaidAt,
          expired_at: s.expired_at || s.ExpiredAt,
          status: s.status || s.Status,
          created_at: s.created_at || s.CreatedAt,
          plan: s.plan || s.Plan ? {
            name: (s.plan || s.Plan).name || (s.plan || s.Plan).Name
          } : undefined
        }));

        // Find the latest paid or pending subscription
        const active = mappedSubs.find((s: ActiveSubscription) => s.status === 'paid') 
                    || mappedSubs.find((s: ActiveSubscription) => s.status === 'pending')
                    || mappedSubs[0];
        setActiveSub(active);
      }
    } catch (err) {
      console.error("Failed to fetch my subscription", err);
    }
  }, [token]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchPlans(), fetchMySub()]);
    setIsLoading(false);
  }, [fetchPlans, fetchMySub]);

  useEffect(() => {
    if (_hasHydrated) {
      if (!user) {
        router.push('/portal/login');
      } else if (user.category !== 'owner') {
        router.push('/portal/dashboard');
      } else {
        loadData();
      }
    }
  }, [_hasHydrated, user, router, loadData]);

  const handleSelectPlan = async (planId: number) => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan_id: planId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('error_create_billing'));
      
      // Redirect to payment page
      const createdId = data.data.id || data.data.ID;
      router.push(`/portal/subscriptions/${createdId}/pay`);
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (!_hasHydrated || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
        <Activity className="w-8 h-8 animate-spin text-blue-500 mb-4" />
        <p>{t('loading_plans')}</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen pb-20">
      {/* Premium Header */}
      <div className="relative bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-50 dark:to-slate-950 pt-20 pb-32 px-4 md:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl backdrop-blur-md mb-6 ring-1 ring-white/20">
            <Shield className="w-8 h-8 text-blue-300" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            {t('hero_title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">{t('hero_highlight')}</span>
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto font-medium">
            {t('hero_subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-24 relative z-20 space-y-12">
        
        {/* Active Subscription Status */}
        {activeSub && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl flex-shrink-0 ${
                activeSub.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' :
                activeSub.status === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' :
                'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400'
              }`}>
                {activeSub.status === 'paid' ? <CheckCircle className="w-8 h-8" /> : 
                 activeSub.status === 'pending' ? <Clock className="w-8 h-8" /> : 
                 <Shield className="w-8 h-8" />}
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                  {t('status_label')} {
                    activeSub.status === 'paid' ? t('status_active') :
                    activeSub.status === 'pending' ? t('status_pending') : 
                    activeSub.status === 'expired' ? t('status_expired') : t('status_failed')
                  }
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  {t('current_plan')} <strong className="text-slate-900 dark:text-white">{activeSub.plan?.name || 'Unknown'}</strong>
                </p>
                
                {activeSub.status === 'paid' && activeSub.expired_at && (
                  <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Calendar className="w-4 h-4" />
                    {t('valid_until')} {formatDate(activeSub.expired_at)}
                  </div>
                )}
              </div>
            </div>

            {activeSub.status === 'pending' && (
              <button 
                onClick={() => router.push(`/portal/subscriptions/${activeSub.id}/pay`)}
                className="w-full md:w-auto px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                <CreditCard className="w-5 h-5" />
                {t('continue_payment')}
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-2xl text-center font-medium">
            {error}
          </div>
        )}

        {/* Pricing Plans */}
        <div>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('choose_plan_title')}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">{t('choose_plan_subtitle')}</p>
          </div>
          
          {plans.length === 0 ? (
            <div className="text-center text-slate-500 py-10">
              {t('no_plans')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan, index) => (
                <div key={plan.id} className={index === 1 ? 'md:-mt-4 md:mb-4 relative z-10' : ''}>
                  <SubscriptionCard 
                    plan={plan} 
                    onSelect={handleSelectPlan}
                    isPopular={index === 1} // The middle one is usually the most popular
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Loading Overlay when processing */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col items-center">
            <Activity className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-slate-900 dark:text-white font-bold">{t('processing')}</p>
            <p className="text-sm text-slate-500 mt-1">{t('preparing_payment')}</p>
          </div>
        </div>
      )}
    </main>
  );
}
