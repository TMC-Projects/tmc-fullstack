'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Shield, Search, Users, Info } from 'lucide-react';
import Link from 'next/link';

export interface Club {
  id: number;
  name: string;
  logo_url: string;
  status: string;
  category: string;
  member_count: number;
}

interface ClubListProps {
  clubs: Club[];
}

export default function ClubList({ clubs }: ClubListProps) {
  const t = useTranslations('Dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeClubId, setActiveClubId] = useState<number | null>(null);
  const itemsPerPage = 6;

  const safeClubs = Array.isArray(clubs) ? clubs : [];
  const filteredClubs = safeClubs.filter(club => 
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) && club.name !== "Free Agent"
  );

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.ceil(filteredClubs.length / itemsPerPage);
  const currentClubs = filteredClubs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleOverlay = (id: number) => {
    setActiveClubId(prev => prev === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('clubs')}</h2>
        </div>
        
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500 dark:text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-400 dark:border-slate-700 rounded-xl leading-5 bg-slate-200/50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-200 dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-colors"
            placeholder={t('search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredClubs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentClubs.map((club, index) => (
              <motion.div
                key={club.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-indigo-500/30 transition-all cursor-pointer group relative overflow-hidden"
                onClick={() => toggleOverlay(club.id)}
              >
                {/* Hover overlay with buttons */}
                <div className={`absolute inset-0 bg-slate-100/85 dark:bg-slate-900/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 transition-all duration-300 z-10 ${activeClubId === club.id ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}>
                  <div className="flex gap-2">
                    <button onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
                      Request Trial
                    </button>
                    <button onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-semibold rounded-xl transition-colors shadow-lg shadow-amber-500/20">
                      Apply!
                    </button>
                  </div>
                  <Link href={`/app/clubs/${club.id}`} onClick={(e) => e.stopPropagation()} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium rounded-xl transition-colors border border-slate-400 dark:border-slate-700 flex items-center gap-1.5 shadow-lg">
                    <Info className="w-4 h-4" /> Detail Klub
                  </Link>
                </div>

                <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-400 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 relative z-0">
                  {club.logo_url ? (
                    <img src={club.logo_url} alt={club.name} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-8 h-8 text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0 relative z-0">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-400 transition-colors break-words whitespace-normal">
                    {club.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${
                      club.status === 'open' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {club.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                      <Users className="w-3 h-3" /> {club.member_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
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
        <div className="bg-slate-100/30 dark:bg-slate-900/30 border border-slate-300 dark:border-slate-800 border-dashed rounded-2xl p-8 text-center text-slate-500 dark:text-slate-500">
          No clubs found
        </div>
      )}
    </div>
  );
}
