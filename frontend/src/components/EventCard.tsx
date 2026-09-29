import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Calendar, Clock, MapPin, Users, ArrowRight, CheckCircle2, XCircle, Star } from 'lucide-react';
import type { Event } from '../types';
import { queryKeys } from '../lib/queryKeys';
import { eventService } from '../services/events';

interface EventCardProps {
  event: Event;
  onRegisterClick?: (event: Event) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onRegisterClick }) => {
  const queryClient = useQueryClient();

  const isPast = useMemo(() => {
    if (!event || !event.eventDate) return false;
    return new Date(event.eventDate) < new Date(new Date().setHours(0, 0, 0, 0));
  }, [event?.eventDate]);

  const formattedDate = useMemo(() => {
    if (!event || !event.eventDate) return 'Date TBD';
    return new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [event?.eventDate]);

  if (!event || !event.id) {
    return null;
  }

  const category = event.category || 'General';
  const canRegister = Boolean(event.registrationOpen && !isPast);

  const handlePrefetch = () => {
    if (event?.id) {
      queryClient.prefetchQuery({
        queryKey: queryKeys.events.detail(event.id),
        queryFn: () => eventService.getEventById(event.id),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  const getCategoryClass = (cat?: string) => {
    if (!cat) return 'badge-technical';
    const c = cat.toLowerCase();
    return `badge-${c}`;
  };

  return (
    <div
      className={`card event-card ${event.featured ? 'featured-border' : ''}`}
      onMouseEnter={handlePrefetch}
      onFocus={handlePrefetch}
    >
      {/* Card Cover Banner */}
      <div className="card-media-wrapper">
        <img
          src={
            event.imageUrl ||
            'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80'
          }
          alt={event.title}
          className="card-image"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const target = e.currentTarget;
            if (!target.src.includes('photo-1540575467063-178a50c2df87')) {
              target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80';
            }
          }}
        />
        <div className="card-media-overlay" />

        {/* Top Badges */}
        <div className="card-badges-top">
          <span className={`badge ${getCategoryClass(category)}`}>
            {category}
          </span>
          {event.featured && (
            <span className="badge badge-featured">
              <Star size={12} fill="currentColor" />
              Featured
            </span>
          )}
        </div>

        {/* Status indicator on bottom of media */}
        <div className="card-status-badge">
          {canRegister ? (
            <span className="badge badge-open">
              <CheckCircle2 size={12} />
              Registration Open
            </span>
          ) : (
            <span className="badge badge-closed">
              <XCircle size={12} />
              {isPast ? 'Past Event' : 'Registration Closed'}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="card-content">
        <h3 className="card-title">
          <Link to={`/events/${event.id}`}>{event.title || 'Untitled Event'}</Link>
        </h3>

        <div className="card-meta-list">
          <div className="meta-item">
            <Calendar size={15} className="meta-icon" />
            <span>{formattedDate}</span>
          </div>
          <div className="meta-item">
            <Clock size={15} className="meta-icon" />
            <span>{event.startTime || '10:00 AM'} - {event.endTime || '04:00 PM'}</span>
          </div>
          <div className="meta-item">
            <MapPin size={15} className="meta-icon" />
            <span className="meta-venue" title={event.venue || 'Campus Venue'}>{event.venue || 'Campus Venue'}</span>
          </div>
          {event.registrationCount !== undefined && (
            <div className="meta-item">
              <Users size={15} className="meta-icon" />
              <span>
                {event.registrationCount} Registered
                {event.maxCapacity ? ` / ${event.maxCapacity} Max` : ''}
              </span>
            </div>
          )}
        </div>

        <p className="card-excerpt">
          {event.description.length > 115
            ? `${event.description.substring(0, 115)}...`
            : event.description}
        </p>

        {/* Actions Footer */}
        <div className="card-footer">
          <Link to={`/events/${event.id}`} className="details-link">
            Details <ArrowRight size={14} />
          </Link>

          {canRegister && onRegisterClick ? (
            <button
              onClick={() => onRegisterClick(event)}
              className="btn btn-sm btn-primary register-btn"
            >
              Register Now
            </button>
          ) : (
            <Link
              to={`/events/${event.id}`}
              className="btn btn-sm btn-secondary"
            >
              View Info
            </Link>
          )}
        </div>
      </div>

      <style>{`
        .event-card {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #ffffff;
          border-radius: var(--radius-lg);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-normal), box-shadow var(--transition-normal), border-color var(--transition-normal);
        }

        .event-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--gray-300);
        }

        .featured-border {
          border-color: #fcd34d;
          box-shadow: 0 4px 14px rgba(245, 158, 11, 0.12);
        }

        .featured-border:hover {
          border-color: #f59e0b;
          box-shadow: 0 8px 20px rgba(245, 158, 11, 0.2);
          transform: translateY(-2px);
        }

        .card-media-wrapper {
          position: relative;
          width: 100%;
          height: 200px;
          overflow: hidden;
          background-color: var(--gray-200);
        }

        .card-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform var(--transition-normal);
        }

        .event-card:hover .card-image {
          transform: scale(1.03);
        }

        .card-media-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(15, 23, 42, 0.45) 0%, transparent 45%, rgba(15, 23, 42, 0.65) 100%);
        }

        .card-badges-top {
          position: absolute;
          top: 0.85rem;
          left: 0.85rem;
          right: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          z-index: 2;
        }

        .card-status-badge {
          position: absolute;
          bottom: 0.85rem;
          left: 0.85rem;
          z-index: 2;
        }

        .card-content {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-title {
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 0.85rem;
        }

        .card-title a {
          color: var(--navy-900);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          transition: color var(--transition-fast);
        }

        .card-title a:hover {
          color: var(--primary);
        }

        .card-meta-list {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--gray-100);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: var(--gray-600);
        }

        .meta-icon {
          color: var(--gray-400);
          flex-shrink: 0;
        }

        .meta-venue {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .card-excerpt {
          font-size: 0.875rem;
          color: var(--gray-500);
          line-height: 1.55;
          margin-bottom: 1.5rem;
          flex: 1;
        }

        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid var(--gray-100);
        }

        .details-link {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary);
          transition: gap var(--transition-fast);
        }

        .details-link:hover {
          gap: 0.55rem;
          color: var(--primary-hover);
        }

        .register-btn {
          font-size: 0.825rem;
        }
      `}</style>
    </div>
  );
};
