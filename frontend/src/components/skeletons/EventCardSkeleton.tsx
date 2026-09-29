import React from 'react';

export const EventCardSkeleton: React.FC = () => {
  return (
    <div className="card event-card skeleton-card">
      <div className="skeleton skeleton-media" />
      <div className="skeleton-body">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line short" />
        <div className="skeleton skeleton-line medium" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton-footer-row">
          <div className="skeleton skeleton-btn" />
        </div>
      </div>

      <style>{`
        .skeleton-card {
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 440px;
        }

        .skeleton-media {
          width: 100%;
          height: 200px;
        }

        .skeleton-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          flex: 1;
        }

        .skeleton-title {
          height: 22px;
          width: 80%;
          border-radius: var(--radius-sm);
        }

        .skeleton-line {
          height: 14px;
          width: 100%;
          border-radius: var(--radius-xs);
        }

        .skeleton-line.medium {
          width: 65%;
        }

        .skeleton-line.short {
          width: 45%;
        }

        .skeleton-footer-row {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid var(--gray-100);
          display: flex;
          justify-content: flex-end;
        }

        .skeleton-btn {
          height: 36px;
          width: 100px;
          border-radius: var(--radius-md);
        }

        .skeleton {
          background: linear-gradient(
            90deg,
            var(--gray-100) 25%,
            var(--gray-200) 50%,
            var(--gray-100) 75%
          );
          background-size: 200% 100%;
          animation: skeleton-shimmer 1.5s infinite linear;
        }

        @keyframes skeleton-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
};
