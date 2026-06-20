'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FileText, CheckCircle, XCircle, Eye, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '@/store/auth';

interface Trial {
  ID: number;
  Title: string;
}

interface Application {
  ID: number;
  TrialID: number;
  Trial?: Trial;
  PlayerID: number;
  Player: {
    ID: number;
    Username: string;
    Email: string;
    FullName: string;
    Bio: string;
  };
  Status: string;
  AppliedAt: string;
}

interface RecentApplicationsProps {
  trials: Trial[];
}

export default function RecentApplications({ trials }: RecentApplicationsProps) {
  const t = useTranslations('PortalDashboard');
  const { token } = useAuthStore();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modal
  const [selectedPlayer, setSelectedPlayer] = useState<Application['Player'] | null>(null);

  useEffect(() => {
    if (!token || trials.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchApplications = async () => {
      setIsLoading(true);
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        // Fetch applications for all trials
        const promises = trials.map(trial => 
          fetch(`${baseUrl}/api/trials/${trial.ID}/applications`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(res => res.json())
        );

        const results = await Promise.all(promises);
        
        let allApps: Application[] = [];
        results.forEach((res, index) => {
          if (res.success && res.data) {
            const appsWithTrial = res.data.map((app: any) => ({
              ...app,
              Trial: trials[index] // Attach trial info
            }));
            allApps = [...allApps, ...appsWithTrial];
          }
        });

        // Sort by AppliedAt descending
        allApps.sort((a, b) => new Date(b.AppliedAt).getTime() - new Date(a.AppliedAt).getTime());
        setApplications(allApps);
      } catch (err) {
        console.error('Failed to fetch applications', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApplications();
  }, [trials, token]);

  const handleAction = async (appId: number, action: 'shortlist' | 'reject') => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/trial-applications/${appId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ remarks: `Automatically ${action}ed from dashboard` })
      });

      if (res.ok) {
        // Update local state
        setApplications(prev => prev.map(app => 
          app.ID === appId ? { ...app, Status: action === 'shortlist' ? 'SHORTLISTED' : 'REJECTED' } : app
        ));
      }
    } catch (err) {
      console.error(`Failed to ${action} application`, err);
    }
  };

  const totalPages = Math.ceil(applications.length / itemsPerPage);
  const currentApps = applications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-6 h-6 text-indigo-400" />
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('recent_applications')}</h2>
      </div>

      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          </div>
        ) : applications.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200/50 dark:bg-slate-800/50 border-b border-slate-400 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
                    <th className="p-4 font-medium">{t('applicant')}</th>
                    <th className="p-4 font-medium">{t('trial')}</th>
                    <th className="p-4 font-medium">{t('status')}</th>
                    <th className="p-4 font-medium text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentApps.map((app, index) => (
                    <motion.tr 
                      key={app.ID}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="border-b border-slate-300/50 dark:border-slate-800/50 hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <UserIcon className="w-5 h-5 text-slate-500 dark:text-slate-500" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-200">{app.Player.FullName}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-500">@{app.Player.Username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-700 dark:text-slate-300">
                        {app.Trial?.Title || 'Unknown Trial'}
                      </td>
                      <td className="p-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                          app.Status === 'APPLIED' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          app.Status === 'SHORTLISTED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {app.Status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => setSelectedPlayer(app.Player)}
                            className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                            title={t('view_profile')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {app.Status === 'APPLIED' && (
                            <>
                              <button 
                                onClick={() => handleAction(app.ID, 'shortlist')}
                                className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors"
                                title={t('shortlist')}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleAction(app.ID, 'reject')}
                                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                                title={t('reject')}
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 p-4 border-t border-slate-300 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-500 font-medium">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-slate-500 dark:text-slate-500">
            {t('no_applications')}
          </div>
        )}
      </div>

      {/* Player Profile Modal */}
      <AnimatePresence>
        {selectedPlayer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-400 dark:border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-300 dark:border-slate-800 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-400 dark:border-slate-700">
                    <UserIcon className="w-8 h-8 text-slate-500 dark:text-slate-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{selectedPlayer.FullName}</h3>
                    <p className="text-sm text-indigo-400">@{selectedPlayer.Username}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPlayer(null)}
                  className="text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Email Contact</h4>
                  <p className="text-slate-700 dark:text-slate-300">{selectedPlayer.Email}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider mb-1">Biography</h4>
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap">
                    {selectedPlayer.Bio || 'No biography provided.'}
                  </p>
                </div>
              </div>
              <div className="p-4 border-t border-slate-300 dark:border-slate-800 bg-slate-200/30 dark:bg-slate-800/30 flex justify-end">
                <button 
                  onClick={() => setSelectedPlayer(null)}
                  className="px-6 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors text-sm font-medium"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
