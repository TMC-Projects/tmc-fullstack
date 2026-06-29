import React, { useState, useEffect } from 'react';
import { Building2, FileText, ArrowRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  clubId: number;
  onSuccess: () => void;
  initialData?: {
    organization_name?: string;
    nib?: string;
    npwp?: string;
  };
}

export default function OnboardingModal({
  isOpen,
  onClose,
  token,
  clubId,
  onSuccess,
  initialData
}: OnboardingModalProps) {
  const t = useTranslations('EditClub'); // Resuing some translations
  
  const [formData, setFormData] = useState({
    organization_name: initialData?.organization_name || '',
    nib: initialData?.nib || '',
    npwp: initialData?.npwp || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        organization_name: initialData.organization_name || '',
        nib: initialData.nib || '',
        npwp: initialData.npwp || '',
      });
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/clubs/${clubId}/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit onboarding');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 md:p-8 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Club Verification</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Please submit your official company details to verify your club. Verification is required to access the Transfer Market.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm rounded-2xl">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="organization_name" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              PT Name / Organization Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <Building2 className="w-5 h-5" />
              </span>
              <input
                id="organization_name"
                type="text"
                required
                value={formData.organization_name}
                onChange={handleChange}
                placeholder="e.g. PT Esport Indonesia Raya"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="nib" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              NIB (Nomor Induk Berusaha)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <FileText className="w-5 h-5" />
              </span>
              <input
                id="nib"
                type="text"
                required
                value={formData.nib}
                onChange={handleChange}
                placeholder="Enter 13 digit NIB"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="npwp" className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              NPWP
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400">
                <FileText className="w-5 h-5" />
              </span>
              <input
                id="npwp"
                type="text"
                required
                value={formData.npwp}
                onChange={handleChange}
                placeholder="Enter 15 or 16 digit NPWP"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 transition-all outline-none"
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-2xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Submit for Verification
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
