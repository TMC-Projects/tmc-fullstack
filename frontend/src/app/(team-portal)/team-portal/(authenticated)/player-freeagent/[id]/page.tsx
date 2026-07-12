'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useAuthStore } from '@/store/auth';
import { 
  ArrowLeft, Star, MapPin, Calendar, DollarSign, 
  Shield, Activity, Link as LinkIcon, Trophy, Award, 
  Briefcase, CheckCircle, XCircle, Globe, Coins
} from 'lucide-react';

export default function TalentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { token, _hasHydrated, clearAuth } = useAuthStore();
  const [talent, setTalent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const locale = useLocale();
  const lang = locale === 'id' ? 'id' : 'en';
  const [currency, setCurrency] = useState<'USD' | 'IDR'>('USD');
  const [usdToIdrRate, setUsdToIdrRate] = useState(16000);

  const t = {
    en: {
      back: 'Back to Talents',
      blocked: 'Blocked',
      active: 'Active',
      noBio: 'No bio provided for this talent.',
      currentClub: 'Current Club',
      unknownClub: 'Unknown Club',
      careerStats: 'Career Statistics',
      noStats: 'No statistics recorded yet.',
      achievements: 'Achievements',
      noAchievements: 'No achievements listed.',
      highlightsMedia: 'Highlights & Media',
      socialLinks: 'Social Links',
      noSocial: 'No social media links.',
      videoHighlights: 'Video Highlights',
      noHighlights: 'No highlight videos.',
      contractDetails: 'Contract Details',
      contractUntil: 'Contract Until',
      notSpecified: 'Not Specified',
      salaryMonthly: 'Salary (Monthly)',
      undisclosed: 'Undisclosed',
      marketValue: 'Market Value',
      releaseClause: 'Release Clause',
      notEnabled: 'Not Enabled',
      systemInfo: 'System Info',
      langPref: 'Language Pref',
      joinDate: 'Join Date',
      lastUpdated: 'Last Updated',
      voteCount: 'Vote Count'
    },
    id: {
      back: 'Kembali ke Talenta',
      blocked: 'Diblokir',
      active: 'Aktif',
      noBio: 'Tidak ada bio yang disediakan.',
      currentClub: 'Klub Saat Ini',
      unknownClub: 'Klub Tidak Diketahui',
      careerStats: 'Statistik Karir',
      noStats: 'Belum ada statistik.',
      achievements: 'Pencapaian',
      noAchievements: 'Belum ada pencapaian.',
      highlightsMedia: 'Sorotan & Media',
      socialLinks: 'Tautan Sosial',
      noSocial: 'Tidak ada tautan sosial.',
      videoHighlights: 'Sorotan Video',
      noHighlights: 'Tidak ada video sorotan.',
      contractDetails: 'Detail Kontrak',
      contractUntil: 'Kontrak Hingga',
      notSpecified: 'Tidak Ditentukan',
      salaryMonthly: 'Gaji (Bulanan)',
      undisclosed: 'Dirahasiakan',
      marketValue: 'Nilai Pasar',
      releaseClause: 'Klausul Pelepasan',
      notEnabled: 'Tidak Diaktifkan',
      systemInfo: 'Info Sistem',
      langPref: 'Preferensi Bahasa',
      joinDate: 'Tanggal Bergabung',
      lastUpdated: 'Terakhir Diperbarui',
      voteCount: 'Jumlah Suara'
    }
  };

  const renderCurrency = (value: number | undefined | null) => {
    if (!value) return t[lang].undisclosed;
    if (currency === 'USD') {
      return `$${value.toLocaleString('en-US')}`;
    } else {
      return `Rp ${(value * usdToIdrRate).toLocaleString('id-ID')}`;
    }
  };

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

      try {
        const currRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/global/currencies?from=USD&to=IDR`);
        if (currRes.ok) {
          const currData = await currRes.json();
          if (currData.success && currData.data?.rate) {
            setUsdToIdrRate(currData.data.rate);
          }
        }
      } catch (e) {
        console.error('Currency fetch failed', e);
      }

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

  const initials = (talent.FullName || talent.full_name || 'T').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-emerald-500/30 overflow-y-auto">
      {/* Background Gradient & Pattern */}
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 opacity-80 pointer-events-none" />
      
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-24">
        <div className="flex justify-between items-center mb-8">
          {/* Back Button */}
          <button 
            onClick={() => router.back()} 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group bg-slate-900/50 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{t[lang].back}</span>
          </button>

          {/* Toggles */}
          <div className="flex gap-3">
            <button 
              onClick={() => setCurrency(currency === 'USD' ? 'IDR' : 'USD')}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded-full border border-slate-700 transition-colors text-sm font-medium"
            >
              <Coins className="w-4 h-4 text-emerald-400" />
              {currency}
            </button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-10 mb-8 shadow-2xl flex flex-col md:flex-row gap-8 items-start md:items-center relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>

          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-3xl overflow-hidden border-2 border-slate-700/50 shadow-xl bg-slate-800 flex items-center justify-center">
              {(talent.ProfilePictureUrl || talent.profile_picture_url) ? (
                <img src={(talent.ProfilePictureUrl || talent.profile_picture_url?.startsWith('http') ? talent.ProfilePictureUrl || talent.profile_picture_url : (talent.ProfilePictureUrl || talent.profile_picture_url?.startsWith('http') ? talent.ProfilePictureUrl || talent.profile_picture_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${talent.ProfilePictureUrl || talent.profile_picture_url}`))} alt={talent.FullName || talent.full_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl font-bold text-slate-500">{initials}</span>
              )}
            </div>
            {(talent.Category || talent.category) === 'player' && (
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
                  {(talent.Category || talent.category)?.replace('_', ' ')}
                </span>
                {(talent.Blocked || talent.status === 'inactive') ? (
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-xs font-bold tracking-wider uppercase rounded-lg border border-rose-500/20 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {t[lang].blocked}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-wider uppercase rounded-lg border border-blue-500/20 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> {t[lang].active}
                  </span>
                )}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-1">{talent.FullName || talent.full_name}</h1>
              <div className="text-slate-400 font-medium text-lg flex items-center gap-2">
                @{talent.Username || talent.username} <span className="text-slate-600">•</span> {talent.Email || talent.email}
              </div>
            </div>

            <p className="text-slate-300 leading-relaxed max-w-2xl">
              {talent.Bio || talent.bio || t[lang].noBio}
            </p>

            {(talent.Club || talent.club_id) && (
              <div className="mt-6 flex items-center gap-3 p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl w-fit">
                <Shield className="w-6 h-6 text-indigo-400" />
                <div>
                  <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-0.5">{t[lang].currentClub}</div>
                  <div className="text-white font-bold">{talent.Club?.name || talent.club_name || t[lang].unknownClub}</div>
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
                <Activity className="w-5 h-5 text-emerald-400" /> {t[lang].careerStats}
              </h2>
              {(talent.Stats || talent.stats) && (talent.Stats || talent.stats).length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(talent.Stats || talent.stats).map((stat: any, idx: number) => (
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
                  {t[lang].noStats}
                </div>
              )}
            </div>

            {/* Achievements Section */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" /> {t[lang].achievements}
              </h2>
              {(talent.Achievements || talent.achievements) && (talent.Achievements || talent.achievements).length > 0 ? (
                <div className="space-y-4">
                  {(talent.Achievements || talent.achievements).map((ach: any, idx: number) => (
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
                  {t[lang].noAchievements}
                </div>
              )}
            </div>

            {/* Highlights & Media Section */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 sm:p-8 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-cyan-400" /> {t[lang].highlightsMedia}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Social Medias */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">{t[lang].socialLinks}</h3>
                  {(talent.SocialMedias || talent.social_medias) && (talent.SocialMedias || talent.social_medias).length > 0 ? (
                    <div className="space-y-3">
                      {(talent.SocialMedias || talent.social_medias).map((social: any, idx: number) => (
                        <a key={idx} href={social.URL || social.Url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                            <LinkIcon className="w-4 h-4" />
                          </div>
                          <span className="truncate">{social.Platform || 'Link'}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">{t[lang].noSocial}</p>
                  )}
                </div>

                {/* Highlights */}
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">{t[lang].videoHighlights}</h3>
                  {(talent.Highlights || talent.highlights) && (talent.Highlights || talent.highlights).length > 0 ? (
                    <div className="space-y-3">
                      {(talent.Highlights || talent.highlights).map((hl: any, idx: number) => (
                        <a key={idx} href={hl.VideoURL || hl.Url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800/50">
                          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                            ▶
                          </div>
                          <span className="truncate">{hl.Title || 'Highlight Video'}</span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm">{t[lang].noHighlights}</p>
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
                <Briefcase className="w-5 h-5 text-emerald-400" /> {t[lang].contractDetails}
              </h2>

              <div className="space-y-6 relative z-10">
                <div>
                  <div className="text-sm text-slate-400 mb-1 font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {t[lang].contractUntil}
                  </div>
                  <div className="text-xl font-bold text-white">
                    {(talent.ContractUntil || talent.contract_until) ? new Date(talent.ContractUntil || talent.contract_until).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : t[lang].notSpecified}
                  </div>
                </div>

                <div className="h-px bg-slate-800/50 w-full"></div>

                <div>
                  <div className="text-sm text-slate-400 mb-1 font-medium flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> {t[lang].salaryMonthly}
                  </div>
                  <div className="text-2xl font-black text-emerald-400">
                    {renderCurrency(talent.Salary || talent.salary)}
                  </div>
                </div>

                <div className="h-px bg-slate-800/50 w-full"></div>

                <div>
                  <div className="text-sm text-slate-400 mb-1 font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4" /> {t[lang].marketValue}
                  </div>
                  <div className="text-2xl font-black text-cyan-400">
                    {renderCurrency(talent.MarketValue || talent.market_value)}
                  </div>
                </div>

                <div className="h-px bg-slate-800/50 w-full"></div>

                <div>
                  <div className="text-sm text-slate-400 mb-1 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {t[lang].releaseClause}
                  </div>
                  {(talent.ReleaseClauseEnable || talent.release_clause_enable) ? (
                    <div className="text-xl font-bold text-white">
                      {renderCurrency(talent.ReleaseClauseAmount || talent.release_clause_amount)}
                    </div>
                  ) : (
                    <div className="text-slate-500 font-medium">
                      {t[lang].notEnabled}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-bold text-white mb-6">{t[lang].systemInfo}</h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">{t[lang].langPref}</span>
                  <span className="text-white font-medium uppercase">{talent.Language || talent.language || 'EN'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">Club ID</span>
                  <span className="text-white font-medium">{talent.ClubID || talent.club_id}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">{t[lang].joinDate}</span>
                  <span className="text-white font-medium">
                    {(talent.CreatedAt || talent.created_at) ? new Date(talent.CreatedAt || talent.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-800/50">
                  <span className="text-slate-400 text-sm">{t[lang].lastUpdated}</span>
                  <span className="text-white font-medium">
                    {(talent.UpdatedAt || talent.updated_at) ? new Date(talent.UpdatedAt || talent.updated_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'id-ID') : '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">{t[lang].voteCount}</span>
                  <span className="text-amber-400 font-bold">{talent.VoteCount || talent.vote_count || 0}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
