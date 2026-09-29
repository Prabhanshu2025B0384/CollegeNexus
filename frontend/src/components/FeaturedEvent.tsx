import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Sparkles, Users, ArrowRight } from 'lucide-react';
import type { Event } from '../types';

interface FeaturedEventProps {
  event: Event;
  onRegisterClick: (event: Event) => void;
}

export const FeaturedEvent: React.FC<FeaturedEventProps> = ({ event, onRegisterClick }) => {
  const isPast = useMemo(() => {
    return new Date(event.eventDate) < new Date(new Date().setHours(0, 0, 0, 0));
  }, [event.eventDate]);

  const canRegister = event.registrationOpen && !isPast;

  const formattedDate = useMemo(() => {
    return new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [event.eventDate]);

  return (
    <section className="featured-banner-wrapper" id="featured-section">
      <div className="featured-banner-card">
        <div className="featured-content-side">
          <div className="featured-badge-row">
            <span className="featured-pill">
              <Sparkles size={14} className="sparkle-icon" />
              Featured Event of the Month
            </span>
            <span className={`badge badge-${event.category.toLowerCase()}`}>
              {event.category}
            </span>
          </div>

          <h2 className="featured-title">
            <Link to={`/events/${event.id}`}>{event.title}</Link>
          </h2>

          <div className="featured-meta-grid">
            <div className="featured-meta-item">
              <Calendar size={18} className="meta-svg" />
              <div>
                <span className="meta-label">Date</span>
                <span className="meta-val">{formattedDate}</span>
              </div>
            </div>
            <div className="featured-meta-item">
              <Clock size={18} className="meta-svg" />
              <div>
                <span className="meta-label">Time</span>
                <span className="meta-val">{event.startTime} - {event.endTime}</span>
              </div>
            </div>
            <div className="featured-meta-item">
              <MapPin size={18} className="meta-svg" />
              <div>
                <span className="meta-label">Venue</span>
                <span className="meta-val">{event.venue}</span>
              </div>
            </div>
            {event.registrationCount !== undefined && (
              <div className="featured-meta-item">
                <Users size={18} className="meta-svg" />
                <div>
                  <span className="meta-label">Participants</span>
                  <span className="meta-val">
                    {event.registrationCount} Registered
                    {event.maxCapacity ? ` (${event.maxCapacity} Max)` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          <p className="featured-desc">{event.description}</p>

          <div className="featured-actions">
            {canRegister ? (
              <button
                onClick={() => onRegisterClick(event)}
                className="btn btn-primary btn-lg featured-register-btn"
              >
                Register for Featured Event
              </button>
            ) : (
              <span className="badge badge-closed">Registration Closed</span>
            )}

            <Link to={`/events/${event.id}`} className="btn btn-secondary btn-lg">
              View Full Details
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="featured-image-side">
          <img
            src={
              event.imageUrl ||
              'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80'
            }
            alt={event.title}
            className="featured-cover-img"
          />
          <div className="featured-img-overlay" />
        </div>
      </div>

      <style>{`
        .featured-banner-wrapper {
          margin: 3.5rem 0;
        }

        .featured-banner-card {
          background: linear-gradient(135deg, #ffffff 0%, var(--gray-50) 100%);
          border: 1.5px solid #fcd34d;
          border-radius: var(--radius-xl);
          box-shadow: 0 10px 30px rgba(245, 158, 11, 0.12);
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          overflow: hidden;
          transition: box-shadow var(--transition-normal);
        }

        .featured-banner-card:hover {
          box-shadow: 0 14px 38px rgba(245, 158, 11, 0.18);
        }

        .featured-content-side {
          padding: 2.75rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .featured-badge-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }

        .featured-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background-color: var(--accent-light);
          color: #92400e;
          font-size: 0.8rem;
          font-weight: 700;
          padding: 0.35rem 0.85rem;
          border-radius: var(--radius-full);
          border: 1px solid #fde68a;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .sparkle-icon {
          color: var(--accent);
        }

        .featured-title {
          font-size: 2rem;
          font-weight: 800;
          color: var(--navy-900);
          line-height: 1.25;
          margin-bottom: 1.5rem;
        }

        .featured-title a {
          color: inherit;
          transition: color var(--transition-fast);
        }

        .featured-title a:hover {
          color: var(--primary);
        }

        .featured-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.75rem;
          background-color: #ffffff;
          padding: 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-xs);
        }

        .featured-meta-item {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .meta-svg {
          color: var(--primary);
          margin-top: 3px;
          flex-shrink: 0;
        }

        .meta-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .meta-val {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--navy-800);
        }

        .featured-desc {
          color: var(--gray-600);
          font-size: 0.975rem;
          line-height: 1.65;
          margin-bottom: 2rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .featured-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
        }

        .featured-register-btn {
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        .featured-image-side {
          position: relative;
          min-height: 380px;
        }

        .featured-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .featured-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, rgba(15, 23, 42, 0.25), transparent);
        }

        @media (max-width: 1024px) {
          .featured-banner-card {
            grid-template-columns: 1fr;
          }
          .featured-image-side {
            order: -1;
            height: 260px;
            min-height: 260px;
          }
          .featured-content-side {
            padding: 2rem;
          }
          .featured-title {
            font-size: 1.7rem;
          }
        }

        @media (max-width: 640px) {
          .featured-content-side {
            padding: 1.5rem;
          }
          .featured-meta-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .featured-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .featured-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};
