'use client';

import React from 'react';
import { Check, Shield, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export interface Plan {
  id: number;
  name: string;
  duration_months: number;
  price: number;
  discount: number;
  description: string;
  is_active: boolean;
  created_at: string;
}

interface SubscriptionCardProps {
  plan: Plan;
  onSelect: (planId: number) => void;
  isPopular?: boolean;
  currency?: string;
  translationNamespace?: string;
}

export default function SubscriptionCard({ plan, onSelect, isPopular = false, currency = 'Rp', translationNamespace = 'Subscriptions' }: SubscriptionCardProps) {
  const t = useTranslations(translationNamespace as any);
  const finalPrice = plan.price - plan.discount;
  
  // Example features list based on the plan description for visual flair
  const features = [
    t('feature_1'),
    t('feature_2'),
    t('feature_3'),
    t('feature_4'),
    t('feature_5'),
    plan.duration_months > 1 ? `${t('save_amount')} ${currency} ${(plan.discount).toLocaleString('id-ID')}` : t('feature_flexible')
  ];

  const getIcon = () => {
    switch (plan.name.toLowerCase()) {
      case 'yearly': return <Star className="w-6 h-6 text-yellow-500" />;
      case 'quarterly': return <Zap className="w-6 h-6 text-blue-500" />;
      default: return <Shield className="w-6 h-6 text-emerald-500" />;
    }
  };

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`relative flex flex-col p-6 rounded-3xl border bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl transition-all duration-300 shadow-xl ${
        isPopular 
          ? 'border-blue-500 shadow-blue-500/20' 
          : 'border-slate-200 dark:border-slate-800 shadow-slate-200/50 dark:shadow-none hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-0 right-0 flex justify-center">
           <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
            {t('popular_badge')}
          </span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            {plan.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {plan.duration_months} {t('months_access')}
          </p>
        </div>
        <div className={`p-3 rounded-2xl ${isPopular ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-slate-100 dark:bg-slate-800'}`}>
          {getIcon()}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {currency} {(finalPrice).toLocaleString('id-ID')}
          </span>
          <span className="text-sm font-medium text-slate-500">
            / {plan.duration_months} {t('months_suffix')}
          </span>
        </div>
        
        {plan.discount > 0 && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm line-through text-slate-400">
              {currency} {(plan.price).toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              {t('save_amount')} {currency} {(plan.discount).toLocaleString('id-ID')}
            </span>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 h-10">
        {plan.description}
      </p>

      <div className="flex-1 space-y-3 mb-8">
        {features.map((feature, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-full p-1 ${isPopular ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
              <Check className="w-3 h-3 font-bold" />
            </div>
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{feature}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSelect(plan.id)}
        className={`w-full py-3 px-6 rounded-xl font-bold text-sm transition-all duration-300 ${
          isPopular
            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40'
            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-lg shadow-slate-900/10'
        }`}
      >
        {t('select_plan')} {plan.name}
      </button>
    </motion.div>
  );
}
