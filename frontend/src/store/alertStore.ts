import { create } from 'zustand';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  isConfirm: boolean;
  confirmText: string;
  cancelText: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showAlert: (message: string, type?: AlertType, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, options?: { title?: string; confirmText?: string; cancelText?: string; onCancel?: () => void }) => void;
  close: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  type: 'info',
  title: 'Information',
  message: '',
  isConfirm: false,
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  onConfirm: undefined,
  onCancel: undefined,

  showAlert: (message, type = 'info', title) => {
    let defaultTitle = 'Information';
    if (type === 'success') defaultTitle = 'Success';
    if (type === 'warning') defaultTitle = 'Warning';
    if (type === 'error') defaultTitle = 'Error';

    set({
      isOpen: true,
      isConfirm: false,
      message,
      type,
      title: title || defaultTitle,
      onConfirm: undefined,
      onCancel: undefined,
    });
  },

  showConfirm: (message, onConfirm, options) => {
    set({
      isOpen: true,
      isConfirm: true,
      type: 'warning', // Confirms are usually warnings
      message,
      title: options?.title || 'Confirmation',
      confirmText: options?.confirmText || 'Yes',
      cancelText: options?.cancelText || 'Cancel',
      onConfirm,
      onCancel: options?.onCancel,
    });
  },

  close: () => {
    set({ isOpen: false });
    // Slight delay before clearing contents to allow exit animation
    setTimeout(() => {
      set({
        message: '',
        onConfirm: undefined,
        onCancel: undefined,
      });
    }, 300);
  },
}));
