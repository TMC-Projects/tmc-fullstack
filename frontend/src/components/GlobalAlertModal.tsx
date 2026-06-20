'use client';

import React from 'react';
import { useAlertStore } from '@/store/alertStore';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

export default function GlobalAlertModal() {
  const {
    isOpen,
    type,
    title,
    message,
    isConfirm,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    close,
  } = useAlertStore();

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    close();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    close();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-8 h-8 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-amber-500" />;
      case 'error':
        return <XCircle className="w-8 h-8 text-rose-500" />;
      case 'info':
      default:
        return <Info className="w-8 h-8 text-indigo-500" />;
    }
  };

  const getButtonClass = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'error':
        return 'bg-rose-600 hover:bg-rose-500 text-white';
      case 'info':
      default:
        return 'bg-indigo-600 hover:bg-indigo-500 text-white';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {getIcon()}
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            </div>
            {!isConfirm && (
              <button 
                onClick={close}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          
          <div className="mt-4 text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            {message}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3">
            {isConfirm && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={isConfirm ? handleConfirm : close}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-lg ${getButtonClass()} shadow-current/20`}
            >
              {isConfirm ? confirmText : 'OK'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
