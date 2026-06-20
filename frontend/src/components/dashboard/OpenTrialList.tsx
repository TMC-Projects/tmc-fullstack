'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Trophy, Search, Calendar, Users, CheckCircle, AlertCircle, Gamepad2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

export interface Trial {
  ID: number;
  Title: string;
  Description: string;
  StartDate: string;
  EndDate: string;
  MaxParticipants: number;
  Status: string;
  Club: { name: string; logo_url: string };
  Game: { name: string };
}

interface OpenTrialListProps {
  trials: Trial[];
  myApplications: any[];
  onApplySuccess: () => void;
}

export default function OpenTrialList({ trials, myApplications, onApplySuccess }: OpenTrialListProps) {
  const t = useTranslations('Dashboard');
  const { token } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGame, setFilterGame] = useState('All');
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const safeTrials = Array.isArray(trials) ? trials : [];
  const uniqueGames = ['All', ...Array.from(new Set(safeTrials.map(t => t.Game?.name).filter(Boolean)))];

  const filteredTrials = safeTrials.filter(trial => {
    const titleMatch = trial.Title ? trial.Title.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const clubMatch = trial.Club?.name ? trial.Club.name.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesSearch = titleMatch || clubMatch;
    const matchesGame = filterGame === 'All' || trial.Game?.name === filterGame;
    
    // Accept published or draft/other status for now if platform is new
    return matchesSearch && matchesGame;
  });

  const safeApps = Array.isArray(myApplications) ? myApplications : [];
  const appliedTrialIds = new Set(safeApps.map(app => app.TrialID));
  const hasReachedLimit = safeApps.length >= 10;

  const handleApply = async (trialId: number) => {
    if (hasReachedLimit) {
      setErrorMsg(t('apply_failed'));
      setTimeout(() => setErrorMsg(''), 5000);
      return;
    }

    setApplyingId(trialId);
    setErrorMsg('');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trials/${trialId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to apply');
      }
      onApplySuccess(); // Refresh applications list
    } catch (err: any) {
      setErrorMsg(err.message || t('apply_failed'));
      setTimeout(() => setErrorMsg(''), 5000);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-400" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('trials')}</h2>
          <span className="text-sm bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
            {safeApps.length} / 10 Applied
          </span>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Game Filter */}
          <select
            className="bg-slate-200/50 dark:bg-slate-800/50 border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
            value={filterGame}
            onChange={(e) => setFilterGame(e.target.value)}
          >
            {uniqueGames.map(game => (
              <option key={game} value={game}>{game === 'All' ? t('filter_all') : game}</option>
            ))}
          </select>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500 dark:text-slate-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-400 dark:border-slate-700 rounded-xl leading-5 bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 sm:text-sm transition-colors"
              placeholder={t('search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0 }}
            className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-rose-400"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm">{errorMsg}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {filteredTrials.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTrials.map((trial, index) => {
            const isApplied = appliedTrialIds.has(trial.ID);
            return (
              <motion.div
                key={trial.ID}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-amber-500/30 rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{trial.Title}</h3>
                      <p className="text-sm text-amber-400 font-medium mt-1">{trial.Club?.name}</p>
                    </div>
                    {trial.Game?.name && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                        <Gamepad2 className="w-3.5 h-3.5" />
                        {trial.Game.name}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 mb-4">{trial.Description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-500 mb-6">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" /> 
                      {new Date(trial.StartDate).toLocaleDateString()} - {new Date(trial.EndDate).toLocaleDateString()}
                    </span>
                    {trial.MaxParticipants > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" /> Max {trial.MaxParticipants} slot
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-300 dark:border-slate-800">
                  {isApplied ? (
                    <button disabled className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl font-medium text-sm cursor-not-allowed">
                      <CheckCircle className="w-4 h-4" /> {t('applied')}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleApply(trial.ID)}
                      disabled={applyingId === trial.ID || hasReachedLimit}
                      className="px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl font-bold text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applyingId === trial.ID ? '...' : t('apply')}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-100/30 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 dark:text-slate-500">
          No open trials found
        </div>
      )}
    </div>
  );
}
