'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Users, User, UserCheck, Megaphone, Shield } from 'lucide-react';

interface MemberStatsProps {
  playerCount: number;
  coachCount: number;
  staffCount: number;
  baCount: number;
}

export default function MemberStats({ playerCount, coachCount, staffCount, baCount }: MemberStatsProps) {
  const t = useTranslations('PortalDashboard');

  const stats = [
    {
      title: t('players'),
      count: playerCount,
      icon: <User className="w-6 h-6 text-indigo-400" />,
      color: 'from-indigo-500/20 to-blue-500/20',
      borderColor: 'border-indigo-500/30'
    },
    {
      title: t('coaches'),
      count: coachCount,
      icon: <Users className="w-6 h-6 text-emerald-400" />,
      color: 'from-emerald-500/20 to-teal-500/20',
      borderColor: 'border-emerald-500/30'
    },
    {
      title: t('staff'),
      count: staffCount,
      icon: <Shield className="w-6 h-6 text-amber-400" />,
      color: 'from-amber-500/20 to-orange-500/20',
      borderColor: 'border-amber-500/30'
    },
    {
      title: t('bas'),
      count: baCount,
      icon: <Megaphone className="w-6 h-6 text-rose-400" />,
      color: 'from-rose-500/20 to-pink-500/20',
      borderColor: 'border-rose-500/30'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserCheck className="w-6 h-6 text-indigo-400" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('member_overview')}</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} border ${stat.borderColor} rounded-2xl p-6 flex flex-col items-center text-center`}
          >
            <div className="bg-slate-100/50 dark:bg-slate-900/50 p-3 rounded-xl mb-4">
              {stat.icon}
            </div>
            <h3 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-1">{stat.count}</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.title}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
