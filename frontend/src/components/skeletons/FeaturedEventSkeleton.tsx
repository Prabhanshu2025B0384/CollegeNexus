import React from 'react';

export const FeaturedEventSkeleton: React.FC = () => {
  return (
    <section className="featured-banner-wrapper">
      <div className="featured-banner-card featured-skeleton-card">
        <div className="featured-content-side">
          <div className="skeleton skeleton-pill" />
          <div className="skeleton skeleton-heading" />
          <div className="skeleton skeleton-meta-box" />
          <div className="skeleton skeleton-desc" />
          <div className="skeleton-btn-row">
            <div className="skeleton skeleton-btn-large" />
            <div className="skeleton skeleton-btn-medium" />
          </div>
        </div>
        <div className="featured-image-side skeleton" />
      </div>

      <style>{`
        .featured-skeleton-card {
          background: #ffffff;
          border: 1px solid var(--gray-200);
          border-radius: var(--radius-xl);
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          overflow: hidden;
          min-height: 420px;
        }

        .skeleton-pill {
          width: 220px;
          height: 28px;
          border-radius: var(--radius-full);
          margin-bottom: 1.5rem;
        }

        .skeleton-heading {
          width: 85%;
          height: 38px;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }

        .skeleton-meta-box {
          width: 100%;
          height: 80px;
          border-radius: var(--radius-md);
          margin-bottom: 1.5rem;
        }

        .skeleton-desc {
          width: 95%;
          height: 60px;
          border-radius: var(--radius-sm);
          margin-bottom: 2rem;
        }

        .skeleton-btn-row {
          display: flex;
          gap: 1rem;
        }

        .skeleton-btn-large {
          width: 180px;
          height: 48px;
          border-radius: var(--radius-md);
        }

        .skeleton-btn-medium {
          width: 140px;
          height: 48px;
          border-radius: var(--radius-md);
        }

        @media (max-width: 1024px) {
          .featured-skeleton-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};
