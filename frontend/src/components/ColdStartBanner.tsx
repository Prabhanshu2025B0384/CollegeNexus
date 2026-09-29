import React, { useEffect, useState } from 'react';
import { Loader2, Server } from 'lucide-react';

export const ColdStartBanner: React.FC = () => {
  const [isColdStarting, setIsColdStarting] = useState(false);

  useEffect(() => {
    const handleColdStart = (e: Event) => {
      const customEvent = e as CustomEvent<{ isColdStarting: boolean }>;
      setIsColdStarting(Boolean(customEvent.detail?.isColdStarting));
    };

    window.addEventListener('render-cold-start', handleColdStart);
    return () => {
      window.removeEventListener('render-cold-start', handleColdStart);
    };
  }, []);

  if (!isColdStarting) return null;

  return (
    <aside aria-label="Server status alert" className="cold-start-banner" role="status">
      <div className="banner-inner">
        <Server size={16} className="server-icon" />
        <Loader2 size={15} className="spin-slow" />
        <span>
          <strong>Server is starting up</strong> — Render Free services wake up after inactivity. Your request is in progress and will complete shortly.
        </span>
      </div>

      <style>{`
        .cold-start-banner {
          background: linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%);
          color: #ffffff;
          padding: 0.65rem 1.25rem;
          font-size: 0.85rem;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
          position: sticky;
          top: 0;
          z-index: 9999;
          animation: slideDown 300ms ease-out;
        }

        .banner-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          text-align: center;
          line-height: 1.4;
        }

        .server-icon {
          flex-shrink: 0;
        }

        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </aside>
  );
};
