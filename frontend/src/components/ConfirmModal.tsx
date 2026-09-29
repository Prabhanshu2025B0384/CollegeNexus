import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Delete',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-dialog confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="confirm-header-left">
            <div className="confirm-icon-wrap">
              <AlertTriangle size={20} className="warning-icon" />
            </div>
            <h3 className="modal-title">{title}</h3>
          </div>
          <button className="modal-close-btn" onClick={onCancel} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-${confirmVariant}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>

      <style>{`
        .confirm-dialog {
          max-width: 440px;
        }

        .confirm-header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .confirm-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          background-color: var(--danger-light);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--danger);
        }

        .confirm-message {
          font-size: 0.95rem;
          color: var(--gray-600);
          line-height: 1.5;
        }
      `}</style>
    </div>
  );
};
