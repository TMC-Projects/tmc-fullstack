'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { Shield, Plus, Edit, Trash2, X, Search, UserPlus, Users, UserCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useAlertStore } from '@/store/alertStore';

interface Game {
  id: number;
  name: string;
}

interface Team {
  id: number;
  club_id: number;
  game_id: number;
  name: string;
  description: string;
  status: string;
  logo_url?: string;
  game?: Game;
}

interface Coach {
  id: number;
  full_name: string;
  team_id?: number | null;
  profile_picture_url?: string;
}

export default function TeamsPage() {
  const { token, user, _hasHydrated } = useAuthStore();
  const t = useTranslations('Teams');
  const { showAlert, showConfirm } = useAlertStore();

  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    game_id: 0,
    status: 'active'
  });

  // Assign Modal state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assigningTeamID, setAssigningTeamID] = useState<number | null>(null);
  const [selectedCoachID, setSelectedCoachID] = useState<number>(0);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [teamsRes, gamesRes, coachesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/teams`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/games`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/coaches`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (teamsRes.ok) {
        const data = await teamsRes.json();
        setTeams(data.data || []);
      }
      if (gamesRes.ok) {
        const data = await gamesRes.json();
        setGames(data.data || []);
      }
      if (coachesRes.ok) {
        const data = await coachesRes.json();
        setCoaches(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (_hasHydrated) {
      fetchData();
    }
  }, [_hasHydrated, fetchData]);

  const handleOpenModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        description: team.description,
        game_id: team.game_id,
        status: team.status
      });
    } else {
      setEditingTeam(null);
      setFormData({
        name: '',
        description: '',
        game_id: games.length > 0 ? games[0].id : 0,
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingTeam
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/teams/${editingTeam.id}`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/teams`;
      const method = editingTeam ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          game_id: Number(formData.game_id)
        })
      });

      if (res.ok) {
        handleCloseModal();
        fetchData();
        showAlert('Team saved successfully', 'success');
      } else {
        showAlert('Operation failed', 'error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      showAlert('An error occurred', 'error');
    }
  };

  const handleDelete = async (id: number) => {
    showConfirm('Are you sure you want to delete this team?', async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/teams/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          fetchData();
          showAlert('Team deleted successfully', 'success');
        } else {
          showAlert('Failed to delete team', 'error');
        }
      } catch (error) {
        console.error('Delete error:', error);
        showAlert('Failed to delete team', 'error');
      }
    });
  };

  const handleOpenAssignModal = (teamID: number) => {
    setAssigningTeamID(teamID);
    setSelectedCoachID(0);
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningTeamID || selectedCoachID === 0) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/teams/${assigningTeamID}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: Number(selectedCoachID) })
      });

      if (res.ok) {
        setIsAssignModalOpen(false);
        fetchData();
        showAlert('Coach assigned successfully', 'success');
      } else {
        showAlert('Failed to assign coach', 'error');
      }
    } catch (error) {
      console.error('Assign error:', error);
      showAlert('Failed to assign coach', 'error');
    }
  };

  const filteredTeams = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  if (!_hasHydrated) return null;

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 pb-20 relative p-4 md:p-8">

      {/* Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 font-medium transition-all"
        >
          <Plus className="w-5 h-5" />
          {t('create_team')}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Search Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-300"
          />
        </div>

        {/* Teams List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">{t('loading')}</div>
        ) : filteredTeams.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">{t('no_data')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeams.map(team => (
              <div key={team.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow relative group">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 flex-shrink-0 overflow-hidden">
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url.startsWith('http') ? team.logo_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${team.logo_url}`} 
                          alt={team.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Shield className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">{team.name}</h3>
                      <span className="text-xs font-medium px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                        {games.find(g => g.id === team.game_id)?.name || team.game?.name || t('unknown_game')}
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${team.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-slate-500'}`}>
                    {team.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-2">
                  {team.description || t('no_desc')}
                </p>

                <div className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800 pt-4 mt-2">
                  <div className="flex gap-2">
                    <Link
                      href={`/portal/teams/${team.id}/members`}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg transition-colors"
                    >
                      <Users className="w-4 h-4" />
                      {t('view_members')}
                    </Link>
                    {(() => {
                      const coach = coaches.find(c => c.team_id === team.id);
                      if (coach) {
                        return (
                          <div className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-50 dark:text-slate-300 dark:bg-slate-800 rounded-lg" title={`Coach: ${coach.full_name}`}>
                            {coach.profile_picture_url ? (
                              <img 
                                src={coach.profile_picture_url.startsWith('http') ? coach.profile_picture_url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}${coach.profile_picture_url}`} 
                                alt={coach.full_name} 
                                className="w-5 h-5 rounded-full object-cover" 
                              />
                            ) : (
                              <UserCircle className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="truncate max-w-[100px]">{coach.full_name}</span>
                          </div>
                        );
                      }
                      return (
                        <button
                          onClick={() => handleOpenAssignModal(team.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-lg transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          {t('assign_coach')}
                        </button>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(team)}
                      className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(team.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {editingTeam ? 'Edit Team' : 'Create Team'}
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Team Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-slate-100"
                  placeholder="e.g. RRQ Hoshi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Game</label>
                <select
                  required
                  value={formData.game_id}
                  onChange={e => setFormData({ ...formData, game_id: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-slate-100"
                >
                  <option value={0} disabled>Select a game</option>
                  {games.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-slate-100 resize-none"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-slate-100"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all"
                >
                  Save Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Coach Modal */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Assign Coach
              </h2>
              <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Select Coach</label>
                <select
                  required
                  value={selectedCoachID}
                  onChange={e => setSelectedCoachID(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/50 text-slate-900 dark:text-slate-100"
                >
                  <option value={0} disabled>-- Select a coach --</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.id}>{c.full_name}</option>
                  ))}
                </select>
                {coaches.length === 0 && (
                  <p className="text-xs text-rose-500 mt-1">No coaches found in your club.</p>
                )}
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={coaches.length === 0 || selectedCoachID === 0}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all"
                >
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
