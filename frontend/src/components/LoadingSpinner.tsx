import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  minHeight?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading data...',
  minHeight = '240px',
}) => {
  return (
    <div className="spinner-container" style={{ minHeight }}>
      <Loader2 size={36} className="spinner-icon pulse" />
      <p className="spinner-message">{message}</p>

      <style>{`
        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          width: 100%;
          padding: 2rem;
        }

        .spinner-icon {
          color: var(--primary);
        }

        .spinner-message {
          font-size: 0.95rem;
          color: var(--gray-500);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};
