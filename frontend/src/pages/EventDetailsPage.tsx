import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Share2,
  Star,
  Info,
} from 'lucide-react';
import type { Event } from '../types';
import { eventService } from '../services/events';
import { RegistrationModal } from '../components/RegistrationModal';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadEvent = useCallback(async (eventId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventService.getEventById(eventId);
      setEvent(data);
    } catch (err: any) {
      setError(err.message || 'Event not found');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadEvent(parseInt(id, 10));
    }
  }, [id, loadEvent]);

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isPast = useMemo(() => {
    if (!event) return false;
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return new Date(event.eventDate).getTime() < todayMidnight.getTime();
  }, [event]);

  const canRegister = event ? event.registrationOpen && !isPast : false;

  const formattedDate = useMemo(() => {
    if (!event) return '';
    return new Date(event.eventDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [event]);

  if (isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner message="Loading event details..." />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <h2 style={{ marginBottom: '1rem', color: 'var(--navy-900)' }}>Event Not Found</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: '2.5rem' }}>
          {error || 'The event you are looking for does not exist or has been removed.'}
        </p>
        <Link to="/events" className="btn btn-primary">
          <ArrowLeft size={16} /> Back to All Events
        </Link>
      </div>
    );
  }

  return (
    <div className="event-details-page page-container">
      {/* Breadcrumb / Top Navigation */}
      <div className="details-top-bar">
        <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm back-nav-btn">
          <ArrowLeft size={16} /> Back to Events
        </button>

        <button onClick={handleShare} className="btn btn-secondary btn-sm share-btn">
          <Share2 size={16} /> {copied ? 'Link Copied!' : 'Share Event'}
        </button>
      </div>

      {/* Main Details Grid */}
      <div className="details-layout-grid">
        {/* Left Column: Cover & Information */}
        <div className="details-main-col">
          <div className="details-banner-wrapper">
            <img
              src={
                event.imageUrl ||
                'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
              }
              alt={event.title}
              className="details-banner-image"
            />
            <div className="banner-badges">
              <span className={`badge badge-${event.category.toLowerCase()}`}>
                {event.category}
              </span>
              {event.featured && (
                <span className="badge badge-featured">
                  <Star size={12} fill="currentColor" />
                  Featured Event
                </span>
              )}
            </div>
          </div>

          <h1 className="details-title">{event.title}</h1>

          {/* Full Description */}
          <div className="details-card-block">
            <h3 className="block-title">About This Event</h3>
            <div className="details-text-content">
              {event.description.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="desc-paragraph">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          {/* Event Guidelines / Campus Policy */}
          <div className="details-card-block policy-card">
            <h3 className="block-title">
              <Info size={18} className="info-icon" /> Important Information for Attendees
            </h3>
            <ul className="policy-list">
              <li>Please bring your valid student college ID card for venue check-in.</li>
              <li>Registered students should arrive 15 minutes prior to start time ({event.startTime}).</li>
              <li>Laptops with required software environments are recommended for technical workshops.</li>
              <li>Certificates of participation will be issued digitally to the registered email address.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Sticky Registration & Meta Card */}
        <div className="details-side-col">
          <div className="sticky-meta-card card">
            <div className="status-header">
              {canRegister ? (
                <div className="status-indicator open">
                  <CheckCircle2 size={18} />
                  <span>Registration is Open</span>
                </div>
              ) : (
                <div className="status-indicator closed">
                  <XCircle size={18} />
                  <span>{isPast ? 'Event has Concluded' : 'Registration Closed'}</span>
                </div>
              )}
            </div>

            <div className="meta-specs-list">
              <div className="spec-item">
                <Calendar size={18} className="spec-icon" />
                <div className="spec-content">
                  <span className="spec-label">Date</span>
                  <span className="spec-value">{formattedDate}</span>
                </div>
              </div>

              <div className="spec-item">
                <Clock size={18} className="spec-icon" />
                <div className="spec-content">
                  <span className="spec-label">Time</span>
                  <span className="spec-value">{event.startTime} to {event.endTime}</span>
                </div>
              </div>

              <div className="spec-item">
                <MapPin size={18} className="spec-icon" />
                <div className="spec-content">
                  <span className="spec-label">Location / Venue</span>
                  <span className="spec-value">{event.venue}</span>
                </div>
              </div>

              <div className="spec-item">
                <Users size={18} className="spec-icon" />
                <div className="spec-content">
                  <span className="spec-label">Participant Capacity</span>
                  <span className="spec-value">
                    {event.registrationCount !== undefined ? event.registrationCount : 0} Registered
                    {event.maxCapacity ? ` (${event.maxCapacity} Seats Max)` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Action CTA */}
            <div className="meta-card-cta">
              {canRegister ? (
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn btn-primary btn-lg full-width-btn"
                >
                  Register Now (Free)
                </button>
              ) : (
                <button disabled className="btn btn-secondary btn-lg full-width-btn">
                  Registration Closed
                </button>
              )}
              <span className="seat-guarantee-note">
                ⚡ Instant confirmation upon submitting your registration.
              </span>
            </div>

            <div className="organizer-box">
              <span className="org-label">Organized By:</span>
              <span className="org-name">Campus Nexus Collegiate Club</span>
              <span className="org-contact">events@collegeclub.edu</span>
            </div>
          </div>
        </div>
      </div>

      {/* Registration Modal Dialog */}
      <RegistrationModal
        event={event}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          if (id) loadEvent(parseInt(id, 10));
        }}
      />

      <style>{`
        .details-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2.25rem;
        }

        .back-nav-btn, .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }

        .details-layout-grid {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 3rem;
          align-items: start;
        }

        .details-banner-wrapper {
          position: relative;
          width: 100%;
          height: 400px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          background-color: var(--gray-200);
          box-shadow: var(--shadow-md);
          margin-bottom: 2.25rem;
        }

        .details-banner-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .banner-badges {
          position: absolute;
          top: 1.25rem;
          left: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          z-index: 2;
        }

        .details-title {
          font-size: clamp(2rem, 4vw, 2.75rem);
          color: var(--navy-900);
          line-height: 1.2;
          margin-bottom: 2.25rem;
          letter-spacing: -0.025em;
        }

        .details-card-block {
          background: #ffffff;
          padding: 2.25rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          margin-bottom: 2.25rem;
          box-shadow: var(--shadow-sm);
        }

        .block-title {
          font-size: 1.35rem;
          color: var(--navy-900);
          margin-bottom: 1.35rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .info-icon {
          color: var(--primary);
        }

        .desc-paragraph {
          font-size: 1.05rem;
          color: var(--gray-700);
          line-height: 1.75;
          margin-bottom: 1.25rem;
        }

        .desc-paragraph:last-child {
          margin-bottom: 0;
        }

        .policy-card {
          background-color: var(--primary-light);
          border-color: var(--primary-border);
        }

        .policy-list {
          list-style: disc;
          padding-left: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          color: var(--navy-900);
          font-size: 0.95rem;
          line-height: 1.55;
        }

        /* Sticky Sidebar */
        .sticky-meta-card {
          position: sticky;
          top: 5.5rem;
          padding: 2rem;
          background: #ffffff;
          border-radius: var(--radius-xl);
        }

        .status-header {
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--gray-100);
          margin-bottom: 1.35rem;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.95rem;
          font-weight: 700;
        }

        .status-indicator.open {
          color: var(--success);
        }

        .status-indicator.closed {
          color: var(--danger);
        }

        .meta-specs-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          margin-bottom: 2rem;
        }

        .spec-item {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .spec-icon {
          color: var(--primary);
          margin-top: 3px;
          flex-shrink: 0;
        }

        .spec-content {
          display: flex;
          flex-direction: column;
        }

        .spec-label {
          font-size: 0.75rem;
          color: var(--gray-400);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .spec-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--navy-900);
          margin-top: 0.1rem;
        }

        .meta-card-cta {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-bottom: 1.75rem;
        }

        .full-width-btn {
          width: 100%;
        }

        .seat-guarantee-note {
          font-size: 0.8rem;
          color: var(--gray-500);
          text-align: center;
          line-height: 1.4;
        }

        .organizer-box {
          padding-top: 1.35rem;
          border-top: 1px solid var(--gray-100);
          display: flex;
          flex-direction: column;
          font-size: 0.825rem;
          color: var(--gray-500);
        }

        .org-label {
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.7rem;
          letter-spacing: 0.04em;
        }

        .org-name {
          font-weight: 700;
          color: var(--navy-800);
          margin-top: 3px;
        }

        .org-contact {
          color: var(--gray-400);
          font-size: 0.8rem;
          margin-top: 2px;
        }

        @media (max-width: 1024px) {
          .details-layout-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .details-banner-wrapper {
            height: 300px;
          }
          .details-title {
            font-size: 2rem;
          }
          .sticky-meta-card {
            position: static;
          }
        }

        @media (max-width: 640px) {
          .details-banner-wrapper {
            height: 220px;
          }
          .details-card-block {
            padding: 1.5rem;
          }
          .sticky-meta-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};
