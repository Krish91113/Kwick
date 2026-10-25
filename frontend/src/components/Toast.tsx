import React from 'react';

export interface ToastState {
  show: boolean;
  message: string;
  type?: 'success' | 'error';
}

interface ToastProps {
  toast: ToastState;
}

export const Toast: React.FC<ToastProps> = ({ toast }) => {
  const isSuccess = toast.type !== 'error';

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transform transition-all duration-200 pointer-events-none flex items-center gap-space-sm bg-surface-container-high px-space-md py-space-sm rounded-lg shadow-2xl border border-surface-container-highest ${
        toast.show ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
      }`}
    >
      <div
        className={`w-1.5 self-stretch rounded-full ${
          isSuccess ? 'bg-primary-container' : 'bg-error'
        }`}
      />
      <span
        className={`material-symbols-outlined text-[18px] ${
          isSuccess ? 'text-primary-container' : 'text-error'
        }`}
      >
        {isSuccess ? 'check_circle' : 'error'}
      </span>
      <span className="font-code-sm text-code-sm text-on-surface">{toast.message}</span>
    </div>
  );
};
