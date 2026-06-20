'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { motion } from 'framer-motion';
import { ChevronLeft, UserCircle, Trophy, BarChart3, Star, Video, MessageCircle, Image as ImageIcon, Globe, Shield, Check, X as XIcon } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ThemeToggle';

interface PlayerDetail {
  ID: number;
  FullName: string;
  Username: string;
  ProfilePictureUrl?: string;
  Bio?: string;
  Stats?: any[];
  Achievements?: any[];
  Highlights?: any[];
  SocialMedias?: any[];
  Email?: string;
  Category?: string;
  ContractUntil?: string;
  MarketValue?: number;
  VoteCount?: number;
  Club?: {
    ID: number;
    Name: string;
    LogoUrl?: string;
  };
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11)
    ? `https://www.youtube.com/embed/${match[2]}`
    : null;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = params.id as string;
  const { token, _hasHydrated } = useAuthStore();

  const appId = searchParams.get('appId');
  const appStatus = searchParams.get('appStatus');

  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Action Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState<'shortlist' | 'reject'>('shortlist');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!_hasHydrated || !token || !playerId) return;

    const fetchPlayer = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/players/${playerId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Gagal memuat detail pemain');
        }
        setPlayer(data.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayer();
  }, [playerId, token, _hasHydrated]);

  const openActionModal = (type: 'shortlist' | 'reject') => {
    setActionType(type);
    setRemarks('');
    setIsModalOpen(true);
  };

  const closeActionModal = () => {
    setIsModalOpen(false);
    setRemarks('');
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !appId) return;
    setIsSubmitting(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trial-applications/${appId}/${actionType}`;

      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ remarks })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to ${actionType} application`);
      }

      closeActionModal();
      router.back();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!_hasHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <UserCircle className="w-16 h-16 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">Pemain Tidak Ditemukan</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6">{error || 'Data pemain tidak tersedia atau Anda tidak memiliki akses.'}</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors">
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 pb-20">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-300 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-400 rounded-xl transition-colors border border-slate-300 dark:border-slate-800"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profil Pemain</h1>
          </div>

          {appId && appStatus === 'APPLIED' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openActionModal('shortlist')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-sm font-medium transition-colors"
              >
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Terima</span>
              </button>
              <button
                onClick={() => openActionModal('reject')}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl text-sm font-medium transition-colors"
              >
                <XIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Tolak</span>
              </button>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Header Profile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 sm:p-10 relative overflow-hidden w-full"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

          <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start relative z-10">
            <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-slate-50 dark:bg-slate-950 border-4 border-slate-300 dark:border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-2xl shadow-indigo-500/10">
              {player.ProfilePictureUrl ? (
                <Image
                  src={player.ProfilePictureUrl.startsWith('http') ? player.ProfilePictureUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${player.ProfilePictureUrl}`}
                  alt={player.FullName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <UserCircle className="w-16 h-16 text-slate-700" />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1">{player.FullName}</h1>
                <p className="text-indigo-400 text-lg mb-3">@{player.Username}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm">
                  {player.Club?.LogoUrl ? (
                    <div className="relative w-6 h-6 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
                      <Image
                        src={player.Club.LogoUrl.startsWith('http') ? player.Club.LogoUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${player.Club.LogoUrl}`}
                        alt={player.Club.Name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <Shield className="w-5 h-5 text-slate-500 dark:text-slate-500" />
                  )}
                  <span className="text-slate-700 dark:text-slate-300 font-semibold">{player.Club?.Name || 'Free Agent'}</span>
                </div>
              </div>

              {player.SocialMedias && player.SocialMedias.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                  {player.SocialMedias.map((social, idx) => (
                    <a key={idx} href={social.URL} target="_blank" rel="noopener noreferrer" className="p-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors">
                      {social.Platform?.toLowerCase() === 'youtube' && <Video className="w-4 h-4" />}
                      {social.Platform?.toLowerCase() === 'twitter' && <MessageCircle className="w-4 h-4" />}
                      {social.Platform?.toLowerCase() === 'instagram' && <ImageIcon className="w-4 h-4" />}
                      {social.Platform && !['youtube', 'twitter', 'instagram'].includes(social.Platform.toLowerCase()) && <Globe className="w-4 h-4" />}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full">

          {/* Main Info Column */}
          <div className="lg:col-span-2 flex flex-col gap-6 lg:gap-8">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-indigo-400" /> Biodata & Informasi Profesional
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 mb-1">ID Pengguna</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">#{player.ID}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 mb-1">Email</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">{player.Email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 mb-1">Kategori</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium capitalize">{player.Category || 'Player'}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 mb-1">Kontrak (Berlaku Hingga)</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {player.ContractUntil ? new Date(player.ContractUntil).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Unavailable'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 mb-1">Nilai Pasar (Market Value)</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {player.MarketValue ? `Rp ${player.MarketValue.toLocaleString('id-ID')}` : 'Unavailable'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 dark:text-slate-500 mb-1">Total Vote</div>
                    <div className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400" /> {player.VoteCount || 0}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-300/50 dark:border-slate-800/50">
                <div className="text-sm text-slate-500 dark:text-slate-500 mb-2">Tentang</div>
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">{player.Bio || 'Pemain ini belum menuliskan biodatanya.'}</p>
              </div>
            </motion.div>

            {player.Achievements && player.Achievements.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" /> Pencapaian
                </h3>
                <div className="space-y-3">
                  {player.Achievements.map((ach, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <Trophy className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200">{ach.Title}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">{ach.Description || 'Tidak ada deskripsi'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {player.Highlights && player.Highlights.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-indigo-400" /> Video Sorotan (Highlights)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {player.Highlights.map((hl, idx) => {
                    const embedUrl = getYouTubeEmbedUrl(hl.VideoURL);
                    if (embedUrl) {
                      return (
                        <div key={idx} className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden">
                          <div className="aspect-video bg-slate-200 dark:bg-slate-800 relative">
                            <iframe
                              className="absolute inset-0 w-full h-full"
                              src={embedUrl}
                              title={hl.Title}
                              frameBorder="0"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate" title={hl.Title}>{hl.Title}</h4>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <a key={idx} href={hl.VideoURL} target="_blank" rel="noopener noreferrer" className="block group">
                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl overflow-hidden">
                          <div className="aspect-video bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative">
                            <Video className="w-10 h-10 text-slate-600 group-hover:text-indigo-500 transition-colors" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm text-slate-800 dark:text-slate-200 truncate group-hover:text-indigo-400 transition-colors" title={hl.Title}>{hl.Title}</h4>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar Stats Column */}
          <div className="flex flex-col gap-6 lg:gap-8">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl p-6 lg:sticky lg:top-24">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-400" /> Statistik Permainan
              </h3>

              {player.Stats && player.Stats.length > 0 ? (
                <div className="space-y-4">
                  {player.Stats.map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-300 dark:border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="text-xs font-medium text-slate-500 dark:text-slate-500 mb-1">{stat.Game?.Name || 'Game'}</div>
                        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{stat.StatName}</div>
                      </div>
                      <div className="text-xl font-bold text-emerald-400">{stat.StatValue}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 dark:text-slate-500 text-sm">
                  Belum ada data statistik.
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      {isModalOpen && appId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeActionModal} />

          <div className="relative bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {actionType === 'shortlist' ? (
                  <><Check className="w-5 h-5 text-emerald-400" /> Terima Pemain</>
                ) : (
                  <><XIcon className="w-5 h-5 text-rose-400" /> Tolak Pemain</>
                )}
              </h3>
              <button
                onClick={closeActionModal}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                Anda akan <strong className={actionType === 'shortlist' ? 'text-emerald-400' : 'text-rose-400'}>
                  {actionType === 'shortlist' ? 'menerima (shortlist)' : 'menolak'}
                </strong> aplikasi dari <strong className="text-white">{player.FullName}</strong>.
              </div>

              <form id="action-form" onSubmit={handleActionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Catatan / Alasan (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder={actionType === 'shortlist' ? "Contoh: Lolos ke tahap seleksi tatap muka." : "Contoh: Belum memenuhi kriteria minimum."}
                    value={remarks} onChange={e => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors placeholder:text-slate-600"
                  />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button
                type="button" onClick={closeActionModal}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                form="action-form" type="submit" disabled={isSubmitting}
                className={`px-4 py-2 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center min-w-[100px] ${actionType === 'shortlist' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
              >
                {isSubmitting ? 'Memproses...' : 'Konfirmasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
