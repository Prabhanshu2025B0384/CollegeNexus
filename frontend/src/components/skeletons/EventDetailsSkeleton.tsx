import React from 'react';

export const EventDetailsSkeleton: React.FC = () => {
  return (
    <div className="event-details-page page-container">
      <div className="details-top-bar">
        <div className="skeleton" style={{ width: 140, height: 36, borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ width: 120, height: 36, borderRadius: 'var(--radius-md)' }} />
      </div>

      <div className="details-layout-grid">
        <div className="details-main-col">
          <div className="details-banner-wrapper skeleton" style={{ height: 400, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton" style={{ width: '70%', height: 40, margin: '2rem 0', borderRadius: 'var(--radius-md)' }} />
          <div className="details-card-block" style={{ padding: '2.5rem', background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gray-200)' }}>
            <div className="skeleton" style={{ width: 180, height: 24, marginBottom: '1.5rem', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: '0.8rem', borderRadius: 'var(--radius-xs)' }} />
            <div className="skeleton" style={{ width: '95%', height: 16, marginBottom: '0.8rem', borderRadius: 'var(--radius-xs)' }} />
            <div className="skeleton" style={{ width: '80%', height: 16, borderRadius: 'var(--radius-xs)' }} />
          </div>
        </div>

        <div className="details-side-col">
          <div className="sticky-meta-card card" style={{ padding: '2rem', background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gray-200)' }}>
            <div className="skeleton" style={{ width: '50%', height: 24, marginBottom: '2rem', borderRadius: 'var(--radius-sm)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="skeleton" style={{ width: '90%', height: 36, borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '90%', height: 36, borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '90%', height: 36, borderRadius: 'var(--radius-sm)' }} />
              <div className="skeleton" style={{ width: '90%', height: 36, borderRadius: 'var(--radius-sm)' }} />
            </div>
            <div className="skeleton" style={{ width: '100%', height: 48, borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};
