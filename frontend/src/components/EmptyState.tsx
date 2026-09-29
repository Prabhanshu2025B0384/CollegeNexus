import React from 'react';
import { CalendarX, Search } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: 'calendar' | 'search';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No events found',
  description = 'Try changing your search term or filtering by another category.',
  actionLabel,
  onAction,
  icon = 'calendar',
}) => {
  return (
    <div className="empty-state-card">
      <div className="empty-icon-wrap">
        {icon === 'search' ? <Search size={32} /> : <CalendarX size={32} />}
      </div>
      <h3 className="empty-title">{title}</h3>
      <p className="empty-description">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn btn-secondary btn-sm empty-action-btn">
          {actionLabel}
        </button>
      )}

      <style>{`
        .empty-state-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 3.5rem 1.5rem;
          background: #ffffff;
          border-radius: var(--radius-lg);
          border: 1.5px dashed var(--gray-300);
          margin: 1.5rem 0;
          width: 100%;
        }

        .empty-icon-wrap {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-full);
          background-color: var(--gray-100);
          color: var(--gray-400);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
        }

        .empty-title {
          font-size: 1.15rem;
          color: var(--navy-900);
          margin-bottom: 0.35rem;
        }

        .empty-description {
          font-size: 0.9rem;
          color: var(--gray-500);
          max-width: 400px;
          margin-bottom: 1.25rem;
          line-height: 1.5;
        }

        .empty-action-btn {
          margin-top: 0.25rem;
        }
      `}</style>
    </div>
  );
};
