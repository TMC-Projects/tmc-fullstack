'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { CreditCard, Building, Copy, CheckCircle, ChevronLeft, Shield, AlertCircle, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  bank: string;
  type: string;
  is_active: boolean;
}

export default function PaySubscriptionPage() {
  const router = useRouter();
  const params = useParams();
  const subId = params.id as string;
  const { token, user, _hasHydrated } = useAuthStore();
  const t = useTranslations('Subscriptions');

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodCode, setSelectedMethodCode] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  
  // Payment Result State
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchMethods = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/payment-methods`);
        const data = await res.json();
        if (data.success && data.data) {
          setPaymentMethods(data.data);
          if (data.data.length > 0) {
            setSelectedMethodCode(data.data[0].code);
          }
        }
      } catch (err) {
        console.error('Failed to fetch payment methods', err);
      }
    };
    fetchMethods();
  }, []);

  useEffect(() => {
    if (_hasHydrated) {
      if (!user) {
        router.push('/portal/login');
      } else if (user.category !== 'owner') {
        router.push('/portal/dashboard');
      }
    }
  }, [_hasHydrated, user, router]);

  const handlePay = async () => {
    if (!token) return;
    setIsProcessing(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/subscriptions/${subId}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ payment_method_code: selectedMethodCode })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memproses pembayaran');
      }
      
      setPaymentResult(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!_hasHydrated) return null;

  return (
    <main className="min-h-screen pb-20 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/portal/subscriptions')}
            className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700 dark:text-slate-300" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('pay_title')}</h1>
            <p className="text-slate-500 dark:text-slate-400">{t('pay_subtitle')}</p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex gap-3 text-rose-700 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Content */}
        {!paymentResult ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('select_method_title')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('select_method_subtitle')}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {paymentMethods.map((pm) => (
                <label 
                  key={pm.code}
                  className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    selectedMethodCode === pm.code 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-xs uppercase bg-blue-600">
                      {pm.type === 'qris' ? 'QRIS' : pm.bank || pm.code.slice(0, 3)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{pm.name}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {pm.type === 'qris' ? 'Scan QR Code' : t('auto_check')}
                      </p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedMethodCode === pm.code ? 'border-blue-500' : 'border-slate-300 dark:border-slate-700'
                  }`}>
                    {selectedMethodCode === pm.code && <div className="w-3 h-3 bg-blue-500 rounded-full"></div>}
                  </div>
                  <input 
                    type="radio" 
                    name="paymentMethod" 
                    value={pm.code} 
                    checked={selectedMethodCode === pm.code} 
                    onChange={() => setSelectedMethodCode(pm.code)} 
                    className="sr-only" 
                  />
                </label>
              ))}
            </div>

            <button
              onClick={handlePay}
              disabled={isProcessing}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-70 flex justify-center items-center gap-2"
            >
              {isProcessing ? t('processing') : t('get_va')}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {paymentResult.payment_type === 'qris' && paymentResult.qris_url ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 md:p-8 text-center shadow-lg">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-800/50 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Scan QRIS</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">Scan QR code di bawah ini menggunakan aplikasi pembayaran Anda</p>
                <div className="bg-white p-4 rounded-2xl inline-block shadow-inner mb-6">
                  <img src={paymentResult.qris_url} alt="QRIS" className="w-64 h-64 mx-auto" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('total_payment')}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    Rp {parseInt(paymentResult.gross_amount || '0').toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ) : (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 md:p-8 text-center shadow-lg">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-800/50 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t('va_created_title')}</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">{t('va_created_subtitle')}</p>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 inline-block text-left w-full max-w-md mx-auto shadow-inner">
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('bank_label')}</p>
                  <div className="flex items-center gap-2">
                    <Building className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                    <span className="font-bold text-slate-900 dark:text-white uppercase">{paymentResult.payment_type === 'bank_transfer' ? paymentMethods.find(p => p.code === selectedMethodCode)?.bank || paymentResult.payment_type : paymentResult.payment_type}</span>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('va_label')}</p>
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-xl font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                      {paymentResult.va_numbers?.[0]?.va_number || paymentResult.biller_code + paymentResult.bill_key || 'Hubungi Admin'}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(paymentResult.va_numbers?.[0]?.va_number || paymentResult.biller_code + paymentResult.bill_key)}
                      className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      {copied ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{t('total_payment')}</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    Rp {parseInt(paymentResult.gross_amount || '0').toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-6 flex gap-4">
              <Info className="w-6 h-6 text-blue-500 shrink-0" />
              <div>
                <h4 className="font-bold text-blue-900 dark:text-blue-400 mb-1">{t('simulation_title')}</h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                  {t('simulation_desc')}
                </p>
                <a 
                  href="https://dashboard.sandbox.midtrans.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  {t('open_simulator')}
                </a>
              </div>
            </div>

            <div className="text-center pt-4">
              <button 
                onClick={() => router.push('/portal/subscriptions')}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium underline underline-offset-4"
              >
                {t('back_to_subs')}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
