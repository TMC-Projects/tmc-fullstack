"use client";

import React, { useEffect, useState, use, useMemo } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TableDataPage({ params }: { params: Promise<{ tableName: string }> }) {
  const { tableName } = use(params);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Datatable state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // CRUD state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formData, setFormData] = useState<any>({});
  const [currentId, setCurrentId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  // Dialog State for generic alerts and confirms
  type DialogState = {
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'success';
    title: string;
    message: string;
    onConfirm?: () => void;
  };
  const [dialog, setDialog] = useState<DialogState>({ isOpen: false, type: 'alert', title: '', message: '' });
  const [copied, setCopied] = useState(false);

  const closeDialog = () => setDialog({ ...dialog, isOpen: false });
  const showAlert = (title: string, message: string, type: 'alert' | 'success' = 'alert') => setDialog({ isOpen: true, type, title, message });
  const showConfirm = (title: string, message: string, onConfirm: () => void) => setDialog({ isOpen: true, type: 'confirm', title, message, onConfirm });

  // Reset Password Modal State

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState('');

  // Fallback schemas if table is empty
  const SCHEMAS: Record<string, string[]> = {
    "games": ["id", "name", "created_at", "updated_at"],
    "subscription_plans": ["id", "name", "duration_months", "price", "discount", "description", "is_active", "created_at", "updated_at"],
    "b2c_subscription_plans": ["id", "name", "duration_months", "price", "description", "is_active", "created_at", "updated_at"],
    "clubs": ["id", "name", "status", "verify", "organization_name", "nib", "npwp", "address", "country", "established_year", "category", "logo_url", "expired_date", "created_at", "updated_at"],
    "club_onboardings": ["id", "club_id", "organization_name", "nib", "npwp", "status", "onboarding_by", "created_at", "updated_at"],
    "users": ["id", "username", "email", "full_name", "category", "language", "club_id", "team_id", "vote_count"]
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('internal_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${baseUrl}/api/internal/tables/${tableName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) {
        throw new Error(resData.message || 'Failed to fetch data');
      }
      
      const records = resData.data || [];
      setData(records);
      
      let baseCols = SCHEMAS[tableName] || [];
      if (records.length > 0) {
        const recordCols = Object.keys(records[0]);
        const orderedCols = [...baseCols.filter(c => recordCols.includes(c))];
        recordCols.forEach(c => {
          if (!orderedCols.includes(c)) orderedCols.push(c);
        });
        setColumns(orderedCols);
      } else {
        setColumns(baseCols.length > 0 ? baseCols : ['id']);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: any) => {
    setModalMode('edit');
    setFormData({ ...record });
    setCurrentId(record.id?.toString() || '');
    setIsModalOpen(true);
  };


  const handleResetPassword = (id: string) => {
    showConfirm('Reset Password', "Are you sure you want to reset this user's password?", async () => {
      try {
        const token = localStorage.getItem('internal_token');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/internal/tables/users/${id}/reset-password`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) throw new Error(resData.message || 'Failed to reset password');
        
        setResetPasswordValue(resData.password);
        setResetModalOpen(true);
      } catch (err: any) {
        showAlert('Error', err.message, 'alert');
      }
    });
  };

  const handleDelete = (id: string) => {
    showConfirm('Delete Record', 'Are you sure you want to delete this record? This action cannot be undone.', async () => {
      try {
        const token = localStorage.getItem('internal_token');
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/internal/tables/${tableName}/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        const resData = await res.json();
        if (!res.ok || !resData.success) throw new Error(resData.message || 'Failed to delete');
        
        fetchData();
        showAlert('Deleted', 'Record successfully deleted.', 'success');
      } catch (err: any) {
        showAlert('Error', err.message, 'alert');
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('internal_token');
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const url = modalMode === 'create' 
        ? `${baseUrl}/api/internal/tables/${tableName}`
        : `${baseUrl}/api/internal/tables/${tableName}/${currentId}`;
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const payload = { ...formData };
      
      Object.keys(payload).forEach(key => {
        if (key === 'id' || key.endsWith('_id') || key === 'price' || key === 'discount' || key.includes('duration')) {
           payload[key] = Number(payload[key]);
        }
        if (key.startsWith('is_') || key === 'verify') {
           payload[key] = String(payload[key]).toLowerCase() === 'true';
        }
      });
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      if (!res.ok || !resData.success) throw new Error(resData.message || 'Failed to save');
      
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showAlert('Error', err.message, 'alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (col: string, val: string) => {
    setFormData({ ...formData, [col]: val });
  };

  const handleBooleanChange = (col: string, checked: boolean) => {
    setFormData({ ...formData, [col]: checked });
  }

  const renderValue = (val: any) => {
    if (typeof val === 'boolean') {
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${val ? 'bg-green-500/10 text-green-400' : 'bg-zinc-500/10 text-zinc-400'}`}>
          {val ? 'True' : 'False'}
        </span>
      );
    }
    if (typeof val === 'object' && val !== null) return JSON.stringify(val);
    return String(val ?? '-');
  };

  // Filtering & Pagination
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      return Object.values(row).some(val => 
        String(val ?? '').toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rowsPerPage]);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-6rem)]">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 shrink-0 gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
            <Link href="/internal" className="hover:text-indigo-400 transition-colors">Master Data</Link>
            <span>/</span>
            <span className="text-zinc-200 capitalize">{tableName.replace(/_/g, ' ')}</span>
          </div>
          <h1 className="text-3xl font-bold text-zinc-100 capitalize">{tableName.replace(/_/g, ' ')}</h1>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input 
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-colors"
            />
          </div>
          <button 
            onClick={handleOpenCreate}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20"
          >
            + Create
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 p-8 flex justify-center items-center">
          <span className="text-zinc-400">Loading data...</span>
        </div>
      ) : error ? (
        <div className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20 flex items-center gap-3">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex-1 flex flex-col shadow-xl">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-950/80 backdrop-blur sticky top-0 z-10 text-zinc-400 border-b border-zinc-800">
                <tr>
                  {columns.map(col => (
                    <th key={col} className="px-6 py-4 font-medium uppercase tracking-wider text-xs">{col.replace(/_/g, ' ')}</th>
                  ))}
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right sticky right-0 bg-zinc-950/90 backdrop-blur before:absolute before:left-0 before:inset-y-0 before:w-px before:bg-zinc-800/50">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {paginatedData.map((row, i) => (
                  <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                    {columns.map(col => (
                      <td key={col} className="px-6 py-4 max-w-[200px] truncate text-zinc-300">
                        {renderValue(row[col])}
                      </td>
                    ))}
                    <td className="px-6 py-4 text-right sticky right-0 bg-zinc-900/90 backdrop-blur before:absolute before:left-0 before:inset-y-0 before:w-px before:bg-zinc-800/50">
                                            <button 
                        onClick={() => handleOpenEdit(row)}
                        className="text-indigo-400 hover:text-indigo-300 font-medium mr-4 transition-colors px-2 py-1 rounded hover:bg-indigo-400/10"
                      >
                        Edit
                      </button>
                      {tableName === 'users' && (
                        <button 
                          onClick={() => handleResetPassword(row.id?.toString())}
                          className="text-amber-400 hover:text-amber-300 font-medium mr-4 transition-colors px-2 py-1 rounded hover:bg-amber-400/10"
                        >
                          Reset Password
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(row.id?.toString())}

                        className="text-red-400 hover:text-red-300 font-medium transition-colors px-2 py-1 rounded hover:bg-red-400/10"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-zinc-500 bg-zinc-900/50">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-8 h-8 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                        <p>No records found in this table.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-4 border-t border-zinc-800 bg-zinc-950/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-zinc-400 flex items-center gap-2">
              <span>Show</span>
              <select 
                value={rowsPerPage} 
                onChange={e => setRowsPerPage(Number(e.target.value))}
                className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries out of {filteredData.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-zinc-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-medium text-zinc-300 min-w-[3rem] text-center">
                {currentPage} / {totalPages || 1}
              </span>
              <button 
                disabled={currentPage >= totalPages || totalPages === 0}
                onClick={() => setCurrentPage(p => p + 1)}
                className="p-1.5 rounded-md hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-zinc-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto py-10">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col my-auto relative">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-zinc-100 capitalize">{modalMode} {tableName.replace(/_/g, ' ').slice(0, -1)}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white transition-colors rounded-lg p-1 hover:bg-zinc-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh] flex-1">
              <form id="crud-form" onSubmit={handleSubmit} className="space-y-5">
                {columns.map(col => {
                  if ((col === 'id' || col === 'created_at' || col === 'updated_at') && modalMode === 'create') return null;
                  if ((col === 'created_at' || col === 'updated_at') && modalMode === 'edit') return null;
                  
                  const isBoolean = col.startsWith('is_') || col === 'verify';
                  const isNumber = col === 'id' || col.endsWith('_id') || col === 'price' || col === 'discount' || col.includes('duration');

                  return (
                    <div key={col}>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5 capitalize">{col.replace(/_/g, ' ')}</label>
                      {isBoolean ? (
                        <label className="flex items-center cursor-pointer relative">
                          <input 
                            type="checkbox" 
                            className="sr-only peer"
                            checked={formData[col] === true || formData[col] === 'true'}
                            onChange={(e) => handleBooleanChange(col, e.target.checked)}
                          />
                          <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                          <span className="ml-3 text-sm font-medium text-zinc-300">
                            {formData[col] ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      ) : (
                        <input
                          type={isNumber ? "number" : "text"}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-colors disabled:opacity-50 disabled:bg-zinc-900"
                          value={formData[col] === undefined || formData[col] === null ? '' : String(formData[col])}
                          onChange={(e) => handleInputChange(col, e.target.value)}
                          disabled={col === 'id' && modalMode === 'edit'}
                          placeholder={`Enter ${col.replace(/_/g, ' ')}`}
                        />
                      )}
                    </div>
                  );
                })}
              </form>
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 shrink-0 bg-zinc-900/50 rounded-b-2xl">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-lg font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="crud-form"
                disabled={submitting}
                className="px-6 py-2.5 rounded-lg font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Reset Password Success Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-md flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center border-b border-zinc-800 bg-zinc-950/50">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-500/10">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-zinc-100 mb-1">Password Reset Successful</h3>
              <p className="text-sm text-zinc-400">Please copy the generated password below and securely provide it to the user.</p>
            </div>
            
            <div className="p-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur transition duration-500 group-hover:opacity-100 opacity-70"></div>
                <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                  <code className="text-emerald-400 font-mono text-lg font-bold tracking-wider select-all">{resetPasswordValue}</code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(resetPasswordValue);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className={`${copied ? 'text-emerald-400 border-emerald-500/50' : 'text-zinc-400 hover:text-white hover:bg-zinc-800 border-zinc-800'} transition-all p-2 bg-zinc-900 rounded-lg border shadow-sm`}
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              
              <div className="mt-8">
                <button 
                  onClick={() => setResetModalOpen(false)}
                  className="w-full py-3 rounded-xl font-medium bg-zinc-100 hover:bg-white text-zinc-900 transition-colors shadow-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Generic Dialog */}
      {dialog.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full max-w-sm flex flex-col relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                {dialog.type === 'alert' ? (
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                ) : dialog.type === 'success' ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                )}
                <h3 className={`text-xl font-bold ${dialog.type === 'alert' ? 'text-red-400' : 'text-zinc-100'}`}>
                  {dialog.title}
                </h3>
              </div>
              <p className="text-sm text-zinc-400 ml-13 pl-13">
                {dialog.message}
              </p>
            </div>
            <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 shrink-0 bg-zinc-950/50">
              {dialog.type === 'confirm' && (
                <button 
                  onClick={closeDialog}
                  className="px-4 py-2 rounded-lg font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button 
                onClick={() => {
                  if (dialog.type === 'confirm' && dialog.onConfirm) {
                    dialog.onConfirm();
                  }
                  closeDialog();
                }}
                className={`px-5 py-2 rounded-lg font-medium transition-colors shadow-lg ${
                  dialog.type === 'confirm' 
                    ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/20' 
                    : dialog.type === 'success'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'
                }`}
              >
                {dialog.type === 'confirm' ? 'Confirm' : 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
