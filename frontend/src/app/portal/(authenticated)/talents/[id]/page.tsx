'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { 
  ArrowLeft, Star, MapPin, Calendar, DollarSign, 
  Shield, Activity, Link as LinkIcon, Trophy, Award, 
  Briefcase, CheckCircle, XCircle 
} from 'lucide-react';

export default function TalentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, _hasHydrated, clearAuth } = useAuthStore();
  const [talent, setTalent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTalentDetail = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/talents/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) {
          clearAuth();
          router.push('/portal/login');
          return;
        }
        throw new Error(data.message || 'Failed to fetch talent details');
      }
      
      setTalent(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, token, clearAuth, router]);

  useEffect(() => {
    if (_hasHydrated && token) {
      fetchTalentDetail();
    } else if (_hasHydrated && !token) {
      router.push('/portal/login');
    }
  }, [_hasHydrated, token, fetchTalentDetail, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!talent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white flex-col gap-4">
        <div className="text-2xl font-bold">Talent Not Found</div>
        <button onClick={() => router.back()} className="px-6 py-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  const initials = talent.FullName?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'T';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 overflow-y-auto">
      {/* Background Gradient & Pattern */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-80" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24">
        {/* Back Button */}
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800 w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Talents</span>
        </button>

        {/* Hero Section */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-10 mb-8 shadow-2xl flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-2 border-slate-700/50 shadow-xl bg-slate-800 flex items-center justify-center">
              {talent.ProfilePictureUrl ? (
                <img src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${talent.ProfilePictureUrl}`} alt={talent.FullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-slate-500">{initials}</span>
              )}
            </div>
            {talent.Category === 'player' && (
              <div className="absolute -bottom-4 -right-4 bg-amber-500 text-slate-900 text-xs font-black px-3 py-1.5 rounded-xl shadow-lg border-2 border-slate-900 flex items-center gap-1">
                <Star className="w-3 h-3 fill-slate-900" /> RATING 0.0
              </div>
            )}
          </div>

          {/* Core Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold tracking-wider uppercase rounded-lg border border-emerald-500/20">
                  {talent.Category?.replace('_', ' ')}
                </span>
                {talent.Blocked ? (
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold tracking-wider uppercase rounded-lg border border-rose-500/20 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Blocked
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-wider uppercase rounded-lg border border-blue-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-1">{talent.FullName}</h1>
              <div className="text-slate-400 font-medium text-lg flex items-center gap-2">
                @{talent.Username} <span className="text-slate-600">•</span> {talent.Email}
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed max-w-2xl">
              {talent.Bio || 'No bio provided for this talent.'}
            </p>

            {talent.Club && (
              <div className="mt-6 flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl w-fit">
                <Shield className="w-6 h-6 text-indigo-400" />
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">Current Club</div>
                  <div className="text-white font-bold">{talent.Club.name || 'Unknown Club'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column (2/3 width) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Section */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" /> Career Statistics
              </h2>
              {talent.Stats && talent.Stats.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {talent.Stats.map((stat: any, idx: number) => (
                    <div key={idx} className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                      <span className="text-3xl font-black text-white mb-1">{stat.StatValue || '-'}</span>
                      <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.StatName || 'Stat'}</span>
                      {stat.Game && stat.Game.Name && (
                        <div className="mt-2 text-[10px] bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600/50 truncate max-w-full">
                          {stat.Game.Name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-800/50 border-dashed">
                  No statistics recorded yet.
                </div>
              )}
            </div>

            {/* Achievements Section */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> Achievements
              </h2>
              {talent.Achievements && talent.Achievements.length > 0 ? (
                <div className="space-y-4">
                  {talent.Achievements.map((ach: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                      <div className="w-12 h-12 shrink-0 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Award className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-lg">{ach.Title}</h4>
                        <p className="text-slate-400 text-sm">{ach.Description}</p>
                        <div className="text-slate-500 text-xs mt-2 font-medium">
                          {ach.Year || ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 bg-slate-800/20 rounded-2xl border border-slate-800/50 border-dashed">
                  No achievements listed.
                </div>
              )}
            </div>

            {/* Highlights & Media Section */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-cyan-400" /> Highlights & Media
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Social Medias */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Social Links</h3>
                  {talent.SocialMedias && talent.SocialMedias.length > 0 ? (
                    <div className="space-y-3">
                      {talent.SocialMedias.map((social: any, idx: number) => (
                        <a key={idx} href={social.URL || social.Url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <span className="truncate">{social.Platform || 'Link'}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No social media links.</p>
                  )}
                </div>

                {/* Highlights */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">Video Highlights</h3>
                  {talent.Highlights && talent.Highlights.length > 0 ? (
                    <div className="space-y-3">
                      {talent.Highlights.map((hl: any, idx: number) => (
                        <a key={idx} href={hl.VideoURL || hl.Url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                            ▶
                          </div>
                          <span className="truncate">{hl.Title || 'Highlight Video'}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">No highlight videos.</p>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Sidebar Column (1/3 width) */}
          <div className="space-y-8">
            
            {/* Financials & Contract */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl"></div>
              
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-400" /> Contract Details
              </h2>

              <div className="space-y-6 relative z-10">
                <div>
                  <div className="text-sm text-slate-400 mb-1 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Contract Until
                  </div>
                  <div className="text-xl font-bold text-white">
                    {talent.ContractUntil ? new Date(talent.ContractUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not Specified'}
                  </div>
                </div>

                <div className="h-px bg-slate-800/50 w-full"></div>

                <div>
                  <div className="text-sm text-slate-400 mb-1 font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Salary (Monthly)
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    {talent.Salary ? `$${talent.Salary.toLocaleString()}` : 'Undisclosed'}
                  </div>
                </div>

                <div className="h-px bg-slate-800/50 w-full"></div>

                <div>
                  <div className="text-sm text-slate-400 mb-1 font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Market Value
                  </div>
                  <div className="text-2xl font-black text-cyan-400">
                    {talent.MarketValue ? `$${talent.MarketValue.toLocaleString()}` : 'Undisclosed'}
                  </div>
                </div>

                <div className="h-px bg-slate-800/50 w-full"></div>

                <div>
                  <div className="text-sm text-slate-400 mb-1 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> Release Clause
                  </div>
                  {talent.ReleaseClauseEnable ? (
                    <div className="text-xl font-bold text-white">
                      ${talent.ReleaseClauseAmount?.toLocaleString()}
                    </div>
                  ) : (
                    <div className="text-slate-500 font-medium">
                      Not Enabled
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6">System Info</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">Language Pref</span>
                  <span className="text-white font-medium uppercase">{talent.Language || 'EN'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">Club ID</span>
                  <span className="text-white font-medium">{talent.ClubID}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">Join Date</span>
                  <span className="text-white font-medium">
                    {talent.CreatedAt ? new Date(talent.CreatedAt).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">Last Updated</span>
                  <span className="text-white font-medium">
                    {talent.UpdatedAt ? new Date(talent.UpdatedAt).toLocaleDateString() : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">Vote Count</span>
                  <span className="text-amber-400 font-bold">{talent.VoteCount || 0}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
