'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  ChevronLeft, Check, X as XIcon, UserCircle, Calendar, MessageSquare, ClipboardList, FileSignature
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAlertStore } from '@/store/alertStore';
import { useTranslations } from 'next-intl';

interface Player {
  ID: number;
  FullName: string;
  Username: string;
  ProfilePictureUrl?: string;
  Bio?: string;
  Stats?: any[];
  Achievements?: any[];
  Highlights?: any[];
  SocialMedias?: any[];
}

interface Application {
  ID: number;
  TrialID: number;
  PlayerID: number;
  Player: Player;
  Status: string;
  AppliedAt: string;
  Remarks: string;
}

interface Participant {
  ID: number;
  TrialID: number;
  PlayerID: number;
  ApplicationID: number;
  ParticipantNo: number;
  AttendanceStatus: string;
  CurrentStage: string;
  FinalResult: string;
}


function ApplicationRow({ app, participant, trialId, token, userCategory, openActionModal, openAssessModal, openViewAssessModal, openDecisionModal }: any) {
  const [hasAssessment, setHasAssessment] = useState(false);

  useEffect(() => {
    if (participant && token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/participants/${participant.ID}/assessments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.data && data.data.length > 0) {
            setHasAssessment(true);
          }
        })
        .catch(console.error);
    }
  }, [participant, token]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <tr className="hover:bg-slate-200/20 dark:hover:bg-slate-800/20 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          {app.Player.ProfilePictureUrl ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-400 dark:border-slate-700">
              <Image
                src={app.Player.ProfilePictureUrl.startsWith('http') ? app.Player.ProfilePictureUrl : (app.Player.ProfilePictureUrl?.startsWith('http') ? app.Player.ProfilePictureUrl : (app.Player.ProfilePictureUrl?.startsWith('http') ? app.Player.ProfilePictureUrl : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${app.Player.ProfilePictureUrl}`))}
                alt={app.Player.FullName}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border border-slate-400 dark:border-slate-700">
              <UserCircle className="w-6 h-6 text-slate-500 dark:text-slate-500" />
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-800 dark:text-slate-200">{app.Player.FullName}</div>
            <div className="text-slate-500 dark:text-slate-500 text-xs">@{app.Player.Username}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
          {formatDate(app.AppliedAt)}
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${app.Status === 'SIGNED' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            app.Status === 'SHORTLISTED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              app.Status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                app.Status === 'WITHDRAWN' ? 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' :
                  'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' // APPLIED
          }`}>
          {app.Status}
        </span>
        {app.Remarks && (
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-500 max-w-xs">
            <MessageSquare className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="truncate">{app.Remarks}</span>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          {app.Status === 'APPLIED' && (
            <>
              <Link
                href={`/portal/players/${app.PlayerID}?appId=${app.ID}&trialId=${trialId}&appStatus=${app.Status}`}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors"
                title="Detail Player"
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Detail</span>
              </Link>
              {userCategory !== 'coach' && (
                <>
                  <button
                    onClick={() => openActionModal(app, 'shortlist')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-xs font-medium transition-colors"
                    title="Terima (Shortlist)"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Terima</span>
                  </button>
                  <button
                    onClick={() => openActionModal(app, 'reject')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-lg text-xs font-medium transition-colors"
                    title="Tolak (Reject)"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Tolak</span>
                  </button>
                </>
              )}
            </>
          )}
          {app.Status === 'SHORTLISTED' && (
            <>
              {userCategory === 'coach' && (
                <button
                  onClick={() => openAssessModal(app, participant)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-xs font-medium transition-colors"
                  title="Assessment"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Assessment</span>
                </button>
              )}
              {userCategory !== 'coach' && hasAssessment && (
                <button
                  onClick={() => openViewAssessModal(app, participant)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-xs font-medium transition-colors"
                  title="Lihat Nilai"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lihat Nilai</span>
                </button>
              )}
              {userCategory !== 'coach' && (
                <button
                  onClick={() => openDecisionModal(app, participant)}
                  disabled={!hasAssessment}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${hasAssessment
                      ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed border border-slate-400 dark:border-slate-700'
                    }`}
                  title={hasAssessment ? "Final Decision" : "Harus Assessment Dulu"}
                >
                  <FileSignature className="w-4 h-4" />
                  <span className="hidden sm:inline">Final Decision</span>
                </button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}


interface Criteria {
  ID: number;
  Name: string;
  Weight: number;
  Description: string;
  IsActive: boolean;
  id?: number;
  name?: string;
}

export default function TrialApplicationsPage() {

  const router = useRouter();
  const params = useParams();
  const trialId = params.id as string;
  const { token, user, _hasHydrated } = useAuthStore();
  const { showAlert } = useAlertStore();
  const t = useTranslations('TrialApplications');

  const [applications, setApplications] = useState<Application[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Action Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionType, setActionType] = useState<'shortlist' | 'reject'>('shortlist');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assessment Modal State
  const [isAssessModalOpen, setIsAssessModalOpen] = useState(false);
  const [isAssessViewOnly, setIsAssessViewOnly] = useState(false);
  const [assessmentTotalScore, setAssessmentTotalScore] = useState(0);

  const [assessForm, setAssessForm] = useState({ recommendation: 'RECOMMENDED', summary: '' });
  const [criteriaList, setCriteriaList] = useState<Criteria[]>([]);
  const [scoresForm, setScoresForm] = useState<Record<number, { score: number; note: string }>>({});


  // Decision Modal State
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionForm, setDecisionForm] = useState({ decision: 'ACCEPTED', remarks: '' });


  const fetchApplications = useCallback(async () => {
    if (!token || !trialId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trials/${trialId}/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch applications');
      }
      setApplications(data.data || []);

      // Fetch participants to get Participant IDs for shortlisted applications
      const pRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trials/${trialId}/participants`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const pData = await pRes.json();
      if (pRes.ok) {
        setParticipants(pData.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [token, trialId]);

  useEffect(() => {
    if (_hasHydrated) {
      fetchApplications();
    }
  }, [_hasHydrated, fetchApplications]);

  const openAssessModal = (app: Application, participant: Participant) => {
    setSelectedApp(app);
    setAssessForm({ recommendation: 'RECOMMENDED', summary: '' });
    setIsAssessViewOnly(false);
    setAssessmentTotalScore(0);
    setIsAssessModalOpen(true);

    // reset scores
    const initScores: Record<number, { score: number; note: string }> = {};
    criteriaList.forEach(c => {
      initScores[c.ID || c.id || 0] = { score: 50, note: '' };
    });
    setScoresForm(initScores);
  };

  const openViewAssessModal = async (app: Application, participant: Participant) => {
    setSelectedApp(app);
    setIsAssessViewOnly(true);

    try {
      // Fetch assessment result
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/participants/${participant.ID}/assessments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.data && data.data.length > 0) {
        const assessment = data.data[0];
        setAssessForm({ recommendation: assessment.Recommendation, summary: assessment.Summary });
        setAssessmentTotalScore(assessment.TotalScore);

        // Fetch scores
        const sRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/assessments/${assessment.ID}/scores`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const sData = await sRes.json();
        if (sData.data) {
          const loadedScores: Record<number, { score: number; note: string }> = {};
          sData.data.forEach((s: any) => {
            loadedScores[s.CriteriaID] = { score: s.Score, note: s.Note };
          });
          setScoresForm(loadedScores);
        }
      }
    } catch (e) {
      console.error("Failed to load assessment details", e);
    }

    setIsAssessModalOpen(true);
  };

  const closeAssessModal = () => setIsAssessModalOpen(false);


  // Fetch criteria
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/global/criteria`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setCriteriaList(data.data);
          const initScores: Record<number, { score: number; note: string }> = {};
          data.data.forEach((c: Criteria) => {
            const cid = c.ID || c.id || 0;
            initScores[cid] = { score: 50, note: '' };
          });
          setScoresForm(initScores);
        }
      })
      .catch(console.error);
  }, []);

  const handleAssessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    const participant = participants.find(p => p.ApplicationID === selectedApp.ID);
    if (!participant) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          participant_id: participant.ID,
          recommendation: assessForm.recommendation,
          summary: assessForm.summary
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit assessment');

      const assessmentId = data.data.ID || data.data.id;

      const scoresArray = Object.entries(scoresForm).map(([criteriaId, val]) => ({
        criteria_id: Number(criteriaId),
        score: val.score,
        note: val.note
      }));

      const resScores = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/assessments/${assessmentId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ scores: scoresArray })
      });

      if (!resScores.ok) {
        const dataScores = await resScores.json();
        throw new Error(dataScores.message || 'Failed to submit scores');
      }

      closeAssessModal();
      window.location.reload();
      showAlert('Assessment berhasil disimpan', 'success');
    } catch (err: any) {
      console.error(err);
      showAlert('Gagal menyimpan assessment: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDecisionModal = (app: Application, participant: Participant) => {
    setSelectedApp(app);
    setDecisionForm({ decision: 'ACCEPTED', remarks: '' });
    setIsDecisionModalOpen(true);
  };

  const closeDecisionModal = () => setIsDecisionModalOpen(false);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;
    const participant = participants.find(p => p.ApplicationID === selectedApp.ID);
    if (!participant) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/recruitment-decisions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          trial_id: Number(trialId),
          participant_id: participant.ID,
          decision: decisionForm.decision,
          remarks: decisionForm.remarks
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit decision');

      closeDecisionModal();
      window.location.reload();
      showAlert('Recruitment decision berhasil disimpan', 'success');
    } catch (err) {
      console.error(err);
      showAlert('Gagal menyimpan recruitment decision', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openActionModal = (app: Application, type: 'shortlist' | 'reject') => {
    setSelectedApp(app);
    setActionType(type);
    setRemarks('');
    setIsModalOpen(true);
  };

  const closeActionModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
    setRemarks('');
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedApp) return;
    setIsSubmitting(true);

    try {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/trial-applications/${selectedApp.ID}/${actionType}`;

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
      fetchApplications();
      showAlert('Aksi berhasil', 'success');
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (!_hasHydrated) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/portal/trials"
              className="p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('title')}</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8 bg-slate-100/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="text-xs text-slate-600 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-300 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">{t('player')}</th>
                  <th className="px-6 py-4 font-medium">{t('apply_time')}</th>
                  <th className="px-6 py-4 font-medium">{t('status')}</th>
                  <th className="px-6 py-4 font-medium text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-500">
                      <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="text-xs">Memuat data pendaftar...</div>
                      </div>
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {t('no_data')}
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <ApplicationRow
                      key={app.ID} app={app} trialId={trialId as string}
                      token={token} userCategory={user?.category}
                      participant={participants.find(p => p.ApplicationID === app.ID)}
                      openActionModal={openActionModal}
                      openAssessModal={openAssessModal}
                      openViewAssessModal={openViewAssessModal}
                      openDecisionModal={openDecisionModal}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Action Modal */}
      {isModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
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
                </strong> aplikasi dari <strong className="text-white">{selectedApp.Player.FullName}</strong>.
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

      {/* Assessment Modal */}
      {isAssessModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAssessModal} />

          <div className="relative bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-cyan-400" /> {isAssessViewOnly ? 'Detail Nilai Assessment' : 'Assessment Player'}
              </h3>
              <button
                onClick={closeAssessModal}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                {isAssessViewOnly ? 'Nilai assessment untuk' : 'Buat assessment untuk'} <strong className="text-white">{selectedApp.Player.FullName}</strong>.
              </div>

              {isAssessViewOnly && assessmentTotalScore > 0 && (
                <div className="mb-4 flex justify-between items-center bg-slate-200 dark:bg-slate-800 p-3 rounded-xl border border-slate-300 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Skor Akhir</span>
                  <span className="text-lg font-bold text-cyan-500">{assessmentTotalScore.toFixed(2)}</span>
                </div>
              )}

              <form id="assess-form" onSubmit={handleAssessSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rekomendasi</label>
                  <select
                    disabled={isAssessViewOnly}
                    value={assessForm.recommendation}
                    onChange={e => setAssessForm({ ...assessForm, recommendation: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors disabled:opacity-70"
                  >
                    <option value="HIGHLY_RECOMMENDED">Sangat Direkomendasikan</option>
                    <option value="RECOMMENDED">Direkomendasikan</option>
                    <option value="POTENTIAL">Memiliki Potensi</option>
                    <option value="NOT_RECOMMENDED">Tidak Direkomendasikan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Ringkasan Evaluasi</label>
                  <textarea
                    rows={2} required disabled={isAssessViewOnly}
                    placeholder="Masukkan ringkasan evaluasi..."
                    value={assessForm.summary} onChange={e => setAssessForm({ ...assessForm, summary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors placeholder:text-slate-600 disabled:opacity-70"
                  />
                </div>

                <div className="pt-2 border-t border-slate-300 dark:border-slate-800">
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Penilaian Kriteria</h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {criteriaList.map((criteria) => {
                      const cid = criteria.ID || criteria.id || 0;
                      return (
                        <div key={cid} className="p-3 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-300/80 dark:border-slate-800/80 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">{criteria.Name || criteria.name}</label>
                            <span className="text-xs text-cyan-400 font-bold">{scoresForm[cid]?.score || 0}</span>
                          </div>
                          <input
                            disabled={isAssessViewOnly}
                            type="range"
                            min="1" max="100"
                            value={scoresForm[cid]?.score || 50}
                            onChange={(e) => setScoresForm({ ...scoresForm, [cid]: { ...scoresForm[cid], score: Number(e.target.value) } })}
                            className="w-full accent-cyan-500 disabled:opacity-70"
                          />
                          <input
                            disabled={isAssessViewOnly}
                            type="text"
                            placeholder="Catatan (opsional)..."
                            value={scoresForm[cid]?.note || ''}
                            onChange={(e) => setScoresForm({ ...scoresForm, [cid]: { ...scoresForm[cid], note: e.target.value } })}
                            className="w-full px-2 py-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-md text-xs focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-colors placeholder:text-slate-600 disabled:opacity-70"
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-3">
              {isAssessViewOnly ? (
                <button
                  type="button" onClick={closeAssessModal}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
                >
                  Tutup
                </button>
              ) : (
                <>
                  <button
                    type="button" onClick={closeAssessModal}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    form="assess-form" type="submit" disabled={isSubmitting}
                    className="px-4 py-2 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors bg-cyan-600 hover:bg-cyan-500 flex items-center justify-center min-w-[100px]"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Nilai'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recruitment Decision Modal */}
      {isDecisionModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeDecisionModal} />

          <div className="relative bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-amber-400" /> Final Decision
              </h3>
              <button
                onClick={closeDecisionModal}
                className="p-1 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-4 text-sm text-slate-700 dark:text-slate-300">
                Keputusan rekrutmen akhir untuk <strong className="text-white">{selectedApp.Player.FullName}</strong>.
              </div>

              <form id="decision-form" onSubmit={handleDecisionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Keputusan</label>
                  <select
                    value={decisionForm.decision}
                    onChange={e => setDecisionForm({ ...decisionForm, decision: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors"
                  >
                    <option value="ACCEPTED">Terima (Sign)</option>
                    <option value="REJECTED">Tolak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Catatan Akhir (Opsional)</label>
                  <textarea
                    rows={3}
                    placeholder="Masukkan alasan atau catatan..."
                    value={decisionForm.remarks} onChange={e => setDecisionForm({ ...decisionForm, remarks: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-colors placeholder:text-slate-600"
                  />
                </div>
              </form>
            </div>

            <div className="p-5 border-t border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex justify-end gap-3">
              <button
                type="button" onClick={closeDecisionModal}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                form="decision-form" type="submit" disabled={isSubmitting}
                className="px-4 py-2 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors bg-amber-600 hover:bg-amber-500 flex items-center justify-center min-w-[100px]"
              >
                {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Keputusan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

