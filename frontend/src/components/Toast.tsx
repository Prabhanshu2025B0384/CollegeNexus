import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} className="toast-icon toast-success-icon" />;
      case 'error':
        return <AlertCircle size={18} className="toast-icon toast-error-icon" />;
      case 'info':
      default:
        return <Info size={18} className="toast-icon toast-info-icon" />;
    }
  };

  return (
    <div className={`toast-container toast-${toast.type}`} role="alert" aria-live="assertive">
      <div className="toast-body">
        {getIcon()}
        <span className="toast-message">{toast.message}</span>
      </div>
      <button onClick={onClose} className="toast-close-btn" aria-label="Close notification">
        <X size={15} />
      </button>

      <style>{`
        .toast-container {
          position: fixed;
          bottom: 1.5rem;
          right: 1.5rem;
          z-index: 9999;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1.25rem;
          border-radius: var(--radius-md);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          animation: toastSlideUp var(--duration-normal) var(--ease-out);
          max-width: 420px;
          min-width: 280px;
          color: #ffffff;
        }

        @keyframes toastSlideUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .toast-success {
          background-color: #065f46;
          border: 1px solid #10b981;
        }

        .toast-error {
          background-color: #7f1d1d;
          border: 1px solid #ef4444;
        }

        .toast-info {
          background-color: #1e3a8a;
          border: 1px solid #3b82f6;
        }

        .toast-body {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex: 1;
        }

        .toast-message {
          font-size: 0.875rem;
          font-weight: 500;
          line-height: 1.35;
        }

        .toast-close-btn {
          color: rgba(255, 255, 255, 0.7);
          padding: 0.2rem;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s, background-color 0.15s;
        }

        .toast-close-btn:hover {
          color: #ffffff;
          background-color: rgba(255, 255, 255, 0.15);
        }

        @media (max-width: 640px) {
          .toast-container {
            bottom: 1rem;
            right: 1rem;
            left: 1rem;
            max-width: calc(100% - 2rem);
          }
        }
      `}</style>
    </div>
  );
};
