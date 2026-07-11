'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCircle,
  Trophy,
  BarChart3,
  Star,
  Video,
  MessageCircle,
  Image as ImageIcon,
  Globe,
  Shield,
  Share2,
  Copy,
  Check,
  ArrowLeft,
  Calendar,
  TrendingUp,
  Play,
  Award,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

interface PublicPlayerData {
  id: number;
  username: string;
  full_name: string;
  bio: string;
  category: string;
  profile_picture_url?: string;
  club_name?: string;
  club_logo_url?: string;
  contract_until?: string;
  market_value?: number;
  stats?: { StatName: string; StatValue: string; Game?: { Name: string } }[];
  achievements?: { Title: string; Description?: string; Date?: string }[];
  highlights?: { Title: string; VideoURL: string }[];
  social_medias?: { Platform: string; URL: string }[];
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? `https://www.youtube.com/embed/${match[2]}` : null;
}

function getSocialIcon(platform: string) {
  const p = platform?.toLowerCase();
  if (p === 'youtube') return <Video className="w-4 h-4" />;
  if (p === 'twitter' || p === 'x') return <MessageCircle className="w-4 h-4" />;
  if (p === 'instagram') return <ImageIcon className="w-4 h-4" />;
  if (p === 'facebook') return <Globe className="w-4 h-4" />;
  if (p === 'tiktok') return <Play className="w-4 h-4" />;
  return <Globe className="w-4 h-4" />;
}

export default function PublicPlayerProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const t = useTranslations('PublicProfile');

  const [player, setPlayer] = useState<PublicPlayerData | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [locale, setLocale] = useState('id');

  useEffect(() => {
    const match = document.cookie.match(new RegExp('(^| )NEXT_LOCALE=([^;]+)'));
    if (match) setLocale(match[2]);
  }, []);

  const handleLangSwitch = (lang: string) => {
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
    setLocale(lang);
    window.location.reload();
  };

  useEffect(() => {
    if (!username) return;
    const fetchPlayer = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/public/players/${username}`
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Player not found');
        const user = data.data?.user || data.data;
        setPlayer(user);
        setFollowersCount(data.data?.followers_count || 0);
        setFollowingCount(data.data?.following_count || 0);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlayer();
  }, [username]);

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080B14] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm animate-pulse">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-[#080B14] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 rounded-full bg-slate-800/50 flex items-center justify-center mb-6">
          <UserCircle className="w-12 h-12 text-slate-600" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">{t('not_found')}</h1>
        <p className="text-slate-400 max-w-sm mb-8">{t('not_found_desc')}</p>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('back_to_platform')}
        </Link>
      </div>
    );
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const avatarSrc = player.profile_picture_url
    ? player.profile_picture_url.startsWith('http')
      ? player.profile_picture_url
      : `${apiUrl}${player.profile_picture_url}`
    : null;

  const clubLogoSrc = player.club_logo_url
    ? player.club_logo_url.startsWith('http')
      ? player.club_logo_url
      : `${apiUrl}${player.club_logo_url}`
    : null;

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 font-sans overflow-x-hidden">
      {/* Ambient Background Blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/8 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-indigo-600/6 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#080B14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
            >
              <div className="w-8 h-8 bg-slate-800/60 border border-slate-700/50 rounded-lg flex items-center justify-center group-hover:border-violet-500/50 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </div>
            </Link>
            <div className="h-5 w-px bg-slate-800" />
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="EMC" className="w-6 h-6 rounded object-contain opacity-80 group-hover:opacity-100 transition-opacity" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-sm font-semibold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                EMC Platform
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <button
                onClick={() => handleLangSwitch('id')}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                  locale === 'id'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => handleLangSwitch('en')}
                className={`px-3 py-1.5 text-xs font-semibold transition-all ${
                  locale === 'en'
                    ? 'bg-violet-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            {/* Share Button */}
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                copied
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-violet-600/10 border-violet-500/30 text-violet-400 hover:bg-violet-600/20'
              }`}
            >
              <AnimatePresence mode="wait">
                {copied ? (
                  <motion.span key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('link_copied')}</span>
                  </motion.span>
                ) : (
                  <motion.span key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex items-center gap-1.5">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('share_profile')}</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 md:px-8 py-10 space-y-8 relative z-10">

        {/* Hero Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl border border-white/8 bg-gradient-to-br from-slate-900/90 to-slate-950/90 backdrop-blur-md overflow-hidden shadow-2xl"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-violet-900/20 via-transparent to-cyan-900/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-violet-600/10 rounded-full blur-[80px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-10">
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-slate-800 border-2 border-violet-500/40 overflow-hidden shadow-2xl shadow-violet-900/30 flex items-center justify-center">
                  {avatarSrc ? (
                    <Image src={avatarSrc} alt={player.full_name} fill className="object-cover" unoptimized />
                  ) : (
                    <UserCircle className="w-20 h-20 text-slate-600" />
                  )}
                </div>
                <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left space-y-4">
                <div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-bold uppercase tracking-widest">
                      {t('category')}: {player.category}
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {player.full_name}
                  </h1>
                  <p className="text-violet-400 font-mono text-base mt-1">@{player.username}</p>
                </div>

                {/* Club */}
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  {clubLogoSrc ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-700 border border-slate-600">
                      <Image src={clubLogoSrc} alt={player.club_name || 'Club'} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <Shield className="w-4 h-4 text-slate-500" />
                  )}
                  <span className="text-slate-300 text-sm font-semibold">{player.club_name || t('free_agent')}</span>
                </div>

                {/* Followers / Following / Contract */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 text-sm">
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-2xl font-bold text-white">{followersCount.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs">{t('followers')}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800 hidden sm:block" />
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-2xl font-bold text-white">{followingCount.toLocaleString()}</span>
                    <span className="text-slate-500 text-xs">{t('following')}</span>
                  </div>
                  {player.contract_until && (
                    <>
                      <div className="w-px h-8 bg-slate-800 hidden sm:block" />
                      <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{t('contract_until')}: {new Date(player.contract_until).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Bio */}
                {player.bio ? (
                  <p className="text-slate-300 text-sm leading-relaxed max-w-2xl">{player.bio}</p>
                ) : (
                  <p className="text-slate-500 text-sm italic">{t('no_bio')}</p>
                )}

                {/* Social Media */}
                {player.social_medias && player.social_medias.length > 0 && (
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    {player.social_medias.map((social, idx) => (
                      <a
                        key={idx}
                        href={social.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/60 border border-slate-700/50 rounded-lg text-slate-400 hover:text-violet-400 hover:border-violet-500/40 transition-all text-xs font-medium"
                      >
                        {getSocialIcon(social.Platform)}
                        <span className="capitalize">{social.Platform}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Achievements + Highlights */}
          <div className="lg:col-span-2 space-y-8">

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5 }}
              className="rounded-2xl border border-white/8 bg-slate-900/70 backdrop-blur-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <h2 className="text-base font-bold text-white">{t('achievements')}</h2>
                {player.achievements && player.achievements.length > 0 && (
                  <span className="ml-auto text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {player.achievements.length}
                  </span>
                )}
              </div>
              <div className="p-6">
                {player.achievements && player.achievements.length > 0 ? (
                  <div className="space-y-3">
                    {player.achievements.map((ach, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + idx * 0.06 }}
                        className="group flex items-start gap-4 p-4 bg-slate-800/40 border border-slate-700/30 hover:border-amber-500/20 rounded-xl transition-all"
                      >
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center flex-shrink-0">
                          <Award className="w-5 h-5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-100 text-sm group-hover:text-amber-300 transition-colors">{ach.Title}</h3>
                          {ach.Description && (
                            <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{ach.Description}</p>
                          )}
                          {ach.Date && (
                            <span className="text-xs text-slate-600 mt-1 inline-block">
                              {new Date(ach.Date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 flex-shrink-0 mt-0.5 transition-colors" />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">{t('no_achievements')}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Highlights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="rounded-2xl border border-white/8 bg-slate-900/70 backdrop-blur-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                  <Star className="w-4 h-4 text-rose-400" />
                </div>
                <h2 className="text-base font-bold text-white">{t('highlights')}</h2>
                {player.highlights && player.highlights.length > 0 && (
                  <span className="ml-auto text-xs font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                    {player.highlights.length}
                  </span>
                )}
              </div>
              <div className="p-6">
                {player.highlights && player.highlights.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {player.highlights.map((hl, idx) => {
                      const embedUrl = getYouTubeEmbedUrl(hl.VideoURL);
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.3 + idx * 0.07 }}
                          className="group rounded-xl overflow-hidden border border-slate-700/30 hover:border-violet-500/30 transition-all bg-slate-800/40"
                        >
                          {embedUrl ? (
                            <div className="aspect-video relative">
                              <iframe
                                className="absolute inset-0 w-full h-full"
                                src={embedUrl}
                                title={hl.Title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : (
                            <a href={hl.VideoURL} target="_blank" rel="noopener noreferrer">
                              <div className="aspect-video bg-slate-800 flex items-center justify-center relative">
                                <div className="w-14 h-14 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <Play className="w-6 h-6 text-rose-400 ml-0.5" />
                                </div>
                              </div>
                            </a>
                          )}
                          <div className="p-3">
                            <p className="text-sm font-medium text-slate-300 group-hover:text-violet-300 transition-colors truncate">{hl.Title}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Star className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">{t('no_highlights')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Right Sidebar: Stats */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="rounded-2xl border border-white/8 bg-slate-900/70 backdrop-blur-sm overflow-hidden lg:sticky lg:top-24"
            >
              <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-base font-bold text-white">{t('stats')}</h2>
              </div>
              <div className="p-6">
                {player.stats && player.stats.length > 0 ? (
                  <div className="space-y-3">
                    {player.stats.map((stat, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + idx * 0.06 }}
                        className="p-3.5 bg-slate-800/50 border border-slate-700/30 rounded-xl flex items-center justify-between gap-3 group hover:border-emerald-500/20 transition-all"
                      >
                        <div className="min-w-0">
                          {stat.Game?.Name && (
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{stat.Game.Name}</div>
                          )}
                          <div className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors truncate">{stat.StatName}</div>
                        </div>
                        <div className="text-xl font-black text-emerald-400 flex-shrink-0">{stat.StatValue}</div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <TrendingUp className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">{t('no_stats')}</p>
                  </div>
                )}
              </div>

              {/* Market Value */}
              {player.market_value && (
                <div className="px-6 pb-6">
                  <div className="p-4 bg-gradient-to-r from-violet-900/30 to-indigo-900/20 border border-violet-500/20 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">{t('market_value')}</div>
                    <div className="text-lg font-bold text-violet-300">
                      Rp {player.market_value.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Share CTA Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-900/20 to-indigo-900/10 p-5 text-center"
            >
              <Share2 className="w-8 h-8 text-violet-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium mb-4">{t('share_profile')}</p>
              <button
                onClick={handleShare}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  copied
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                    : 'bg-violet-600 hover:bg-violet-500 text-white border border-transparent'
                }`}
              >
                {copied ? (
                  <><Check className="w-4 h-4" /> {t('link_copied')}</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Link</>
                )}
              </button>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-4 text-slate-600 text-xs border-t border-white/5">
          Powered by <span className="text-violet-400 font-semibold">EMC Platform</span>
        </div>
      </main>
    </div>
  );
}
