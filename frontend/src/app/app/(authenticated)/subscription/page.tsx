'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CreditCard, Check, AlertTriangle, ArrowLeft, Loader2, QrCode, Banknote, Shield, ClipboardList, User, LogOut, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface Plan {
  id: number;
  name: string;
  duration_months: number;
  price: number;
  description: string;
}

interface Subscription {
  id: number;
  plan_id: number;
  status: string;
  payment_order_id: string;
  payment_type: string;
  amount: number;
  paid_at?: string;
  expired_at?: string;
  plan?: Plan;
}

export default function SubscriptionPage() {
  const t = useTranslations('Subscription');
  const router = useRouter();
  const { token, clearAuth, _hasHydrated } = useAuthStore();

  const [isLoading, setIsLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeSub, setActiveSub] = useState<Subscription | null>(null);
  const [history, setHistory] = useState<Subscription[]>([]);

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [pendingSub, setPendingSub] = useState<Subscription | null>(null);

  const [paymentType, setPaymentType] = useState('bank_transfer');
  const [bank, setBank] = useState('bca');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const fetchSubscriptionData = useCallback(async () => {
    setIsLoading(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const headers = { 'Authorization': `Bearer ${token}` };

      const [plansRes, meRes, historyRes] = await Promise.all([
        fetch(`${baseUrl}/api/b2c/subscription/plans`, { headers }),
        fetch(`${baseUrl}/api/b2c/subscription/me`, { headers }),
        fetch(`${baseUrl}/api/b2c/subscription/history`, { headers })
      ]);

      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.data || []);
      }
      if (meRes.ok) {
        const mData = await meRes.json();
        setActiveSub(mData.data || null);
      }
      if (historyRes.ok) {
        const hData = await historyRes.json();
        setHistory(hData.data || []);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!_hasHydrated) return;
    if (!token) {
      router.push('/app/login');
      return;
    }
    fetchSubscriptionData();
  }, [token, _hasHydrated, fetchSubscriptionData]);

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
      router.push('/app/login');
    }
  };

  const handleCreateSubscription = async (plan: Plan) => {
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/subscription`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_id: plan.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('error_create'));

      setPendingSub(data.data);
      setSelectedPlan(plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!pendingSub) return;
    setIsProcessing(true);
    setError('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/b2c/subscription/${pendingSub.id}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ payment_type: paymentType, bank: bank })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t('error_process'));

      setPaymentResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20">

      <div className="max-w-4xl mx-auto px-4 mt-8">
        {activeSub ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-3xl p-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-4 bg-amber-500/20 rounded-2xl text-amber-500">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('title_active')}</h2>
                <p className="text-slate-600 dark:text-slate-400">{t('desc_active_1')} {activeSub.plan?.name} {t('desc_active_2')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 mb-1">{t('label_status')}</p>
                <p className="font-semibold text-emerald-500 uppercase">{activeSub.status}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 mb-1">{t('label_valid_until')}</p>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {activeSub.expired_at ? new Date(activeSub.expired_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </motion.div>
        ) : paymentResult ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto"
          >
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Banknote className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold">{t('title_complete_payment')}</h2>
              <p className="text-slate-600 dark:text-slate-400 mt-2">
                {t('label_order_id')} <span className="font-mono text-sm">{paymentResult.order_id}</span>
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                {t('label_amount')} <span className="font-bold text-slate-900 dark:text-white">Rp {parseInt(paymentResult.gross_amount).toLocaleString('id-ID')}</span>
              </p>
            </div>

            {paymentResult.payment_type === 'bank_transfer' && paymentResult.va_numbers?.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl text-center mb-6 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 mb-2">{t('label_va')} ({paymentResult.va_numbers[0].bank.toUpperCase()})</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{paymentResult.va_numbers[0].va_number}</p>
              </div>
            )}

            {paymentResult.payment_type === 'echannel' && paymentResult.payment_code && (
              <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl text-center mb-6 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 mb-2">{t('label_mandiri_bill')}</p>
                <p className="text-2xl font-mono font-bold tracking-wider">{paymentResult.payment_code}</p>
              </div>
            )}

            {paymentResult.payment_type === 'qris' && paymentResult.qris_url && (
              <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl mb-6 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 mb-4">{t('label_qris')}</p>
                <img src={paymentResult.qris_url} alt="QRIS" className="w-48 h-48 rounded-lg bg-white p-2" />
              </div>
            )}

            {['gopay', 'credit_card'].includes(paymentResult.payment_type) && paymentResult.actions?.length > 0 && (
              <div className="flex flex-col items-center bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl mb-6 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 mb-4">{t('label_click_pay')}</p>
                {paymentResult.actions.map((act: any, idx: number) => (
                  <a key={idx} href={act.url} target="_blank" rel="noopener noreferrer" className="block w-full py-3 mb-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl text-center transition-colors">
                    {act.name.replace(/-/g, ' ').toUpperCase()}
                  </a>
                ))}
              </div>
            )}

            <div className="text-center">
              <button onClick={() => {
                setPaymentResult(null);
                setPendingSub(null);
                fetchSubscriptionData();
              }} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors">
                I have completed the payment
              </button>
            </div>
          </motion.div>
        ) : pendingSub ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 max-w-2xl mx-auto"
          >
            <h2 className="text-2xl font-bold mb-6">{t('title_select_payment')}</h2>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <label className={`block p-4 border rounded-xl cursor-pointer transition-colors ${paymentType === 'bank_transfer' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="paymentType" value="bank_transfer" checked={paymentType === 'bank_transfer'} onChange={() => setPaymentType('bank_transfer')} className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{t('label_va_transfer')}</span>
                </div>
                {paymentType === 'bank_transfer' && (
                  <div className="mt-4 ml-7 grid grid-cols-2 gap-2">
                    {['bca', 'bni', 'bri', 'permata', 'mandiri'].map(b => (
                      <label key={b} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="bank" value={b} checked={bank === b} onChange={() => setBank(b)} />
                        <span className="uppercase">{b}</span>
                      </label>
                    ))}
                  </div>
                )}
              </label>

              <label className={`block p-4 border rounded-xl cursor-pointer transition-colors ${paymentType === 'qris' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="paymentType" value="qris" checked={paymentType === 'qris'} onChange={() => setPaymentType('qris')} className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{t('label_qris_method')}</span>
                </div>
              </label>

              <label className={`block p-4 border rounded-xl cursor-pointer transition-colors ${paymentType === 'gopay' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700 hover:border-amber-300'}`}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="paymentType" value="gopay" checked={paymentType === 'gopay'} onChange={() => setPaymentType('gopay')} className="w-4 h-4 text-amber-500" />
                  <span className="font-medium">{t('label_gopay')}</span>
                </div>
              </label>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setPendingSub(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors">
                Cancel
              </button>
              <button onClick={handlePay} disabled={isProcessing} className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors flex justify-center items-center gap-2 disabled:opacity-50">
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('btn_pay')} {selectedPlan?.price.toLocaleString('id-ID')}
              </button>
            </div>
          </motion.div>
        ) : (
          <div>
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">{t('title_upgrade')}</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">{t('desc_upgrade')}</p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-start gap-3 max-w-2xl mx-auto">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {plans.map((plan, idx) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 flex flex-col relative overflow-hidden"
                >
                  {idx === 1 && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500" />
                  )}
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-amber-500">Rp {(plan.price / 1000).toFixed(0)}k</span>
                    <span className="text-slate-500">/{plan.duration_months} {t('label_mo')}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-8 flex-1">{plan.description}</p>

                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-medium">{t('feature_trial')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-medium">{t('feature_highlight')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-medium">{t('feature_achievement')}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-sm font-medium">{t('feature_badge')}</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => handleCreateSubscription(plan)}
                    disabled={isProcessing}
                    className={`w-full py-3 rounded-xl font-medium transition-colors flex justify-center items-center gap-2 ${idx === 1
                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                      }`}
                  >
                    {isProcessing && selectedPlan?.id === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : t('btn_select_plan')}
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction History Table */}
        {history.length > 0 && (
          <div className="mt-16 mb-8">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Transaction History
            </h3>
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">{t('th_order_id')}</th>
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">{t('th_plan')}</th>
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">{t('th_amount')}</th>
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">{t('label_status')}</th>
                      <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-400">{t('th_date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {history.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-mono text-sm">{sub.payment_order_id}</td>
                        <td className="px-6 py-4 font-medium">{sub.plan?.name || '-'}</td>
                        <td className="px-6 py-4">Rp {sub.amount.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${sub.status === 'paid' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                              sub.status === 'pending' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400' :
                                'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'
                            }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-sm">
                          {sub.paid_at ? new Date(sub.paid_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
