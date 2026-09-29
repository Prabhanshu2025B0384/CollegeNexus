import React from 'react';

export const StatsCardSkeleton: React.FC = () => {
  return (
    <div className="card stat-card" style={{ padding: '1.75rem', background: '#fff', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
      <div className="skeleton" style={{ width: 54, height: 54, borderRadius: 'var(--radius-lg)', flexShrink: 0 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
        <div className="skeleton" style={{ width: '60%', height: 14, borderRadius: 'var(--radius-xs)' }} />
        <div className="skeleton" style={{ width: '40%', height: 32, borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton" style={{ width: '75%', height: 12, borderRadius: 'var(--radius-xs)' }} />
      </div>
    </div>
  );
};
