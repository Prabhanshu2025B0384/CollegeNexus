import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Users,
  Sparkles,
  Plus,
  ArrowRight,
  ClipboardList,
  Edit,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registrationService } from '../services/registrations';
import { eventService } from '../services/events';
import type { DashboardStats, Event, EventFormData } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EventFormModal } from '../components/EventFormModal';
import { ConfirmModal } from '../components/ConfirmModal';

export const AdminDashboardPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<Event | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, eventsData] = await Promise.all([
        registrationService.getDashboardStats(),
        eventService.adminGetAllEvents(),
      ]);
      setStats(statsData);
      setRecentEvents(eventsData.slice(0, 5));
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard();
    }
  }, [isAuthenticated, loadDashboard]);

  const handleCreateOrUpdateEvent = async (formData: EventFormData) => {
    if (editingEvent) {
      await eventService.updateEvent(editingEvent.id, formData);
    } else {
      await eventService.createEvent(formData);
    }
    await loadDashboard();
  };

  const handleDeleteEvent = async () => {
    if (!deleteTargetEvent) return;
    setIsDeleting(true);
    try {
      await eventService.deleteEvent(deleteTargetEvent.id);
      setDeleteTargetEvent(null);
      await loadDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="page-container">
        <LoadingSpinner message="Loading admin metrics and live stats..." />
      </div>
    );
  }

  return (
    <div className="admin-page page-container">
      {/* Top Header */}
      <div className="admin-header-row">
        <div>
          <span className="admin-tag">Club Administration</span>
          <h1 className="admin-page-title">Executive Dashboard</h1>
          <p className="admin-page-subtitle">
            Overview of club events, real-time student registration metrics, and event spotlight.
          </p>
        </div>

        <div className="admin-top-actions">
          <button
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={18} />
            Create Event
          </button>
          <Link to="/admin/registrations" className="btn btn-secondary">
            <ClipboardList size={18} />
            View Registrations
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <div>{error}</div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="stats-cards-grid">
        <div className="card stat-card">
          <div className="stat-card-icon bg-blue">
            <Calendar size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Total Events</span>
            <span className="stat-card-value">{stats?.totalEvents ?? 0}</span>
            <span className="stat-card-hint">All scheduled club events</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-icon bg-emerald">
            <Calendar size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Upcoming Events</span>
            <span className="stat-card-value">{stats?.upcomingEvents ?? 0}</span>
            <span className="stat-card-hint">Scheduled for future dates</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-icon bg-purple">
            <Users size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Total Registrations</span>
            <span className="stat-card-value">{stats?.totalRegistrations ?? 0}</span>
            <span className="stat-card-hint">Enrolled students across events</span>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-card-icon bg-amber">
            <Sparkles size={24} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-label">Featured Spotlight</span>
            <span className="stat-card-featured-title" title={stats?.featuredEvent?.title || 'None'}>
              {stats?.featuredEvent ? stats.featuredEvent.title : 'None Selected'}
            </span>
            <span className="stat-card-hint">
              {stats?.featuredEvent ? `${stats.featuredEvent.category} • ${stats.featuredEvent.eventDate}` : 'Assign in event settings'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="admin-nav-tabs">
        <Link to="/admin/dashboard" className="tab-item active">
          Dashboard Overview
        </Link>
        <Link to="/admin/events" className="tab-item">
          Event Management ({stats?.totalEvents ?? 0})
        </Link>
        <Link to="/admin/registrations" className="tab-item">
          Student Registrations ({stats?.totalRegistrations ?? 0})
        </Link>
      </div>

      {/* Recent Events Table Preview */}
      <div className="admin-section-block">
        <div className="section-title-bar">
          <div>
            <h3 className="admin-block-heading">Recent Events Schedule</h3>
            <p className="admin-block-sub">Preview of upcoming and recent club activities.</p>
          </div>
          <Link to="/admin/events" className="view-all-link">
            Manage All Events <ArrowRight size={14} />
          </Link>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Title</th>
                <th>Category</th>
                <th>Date & Time</th>
                <th>Venue</th>
                <th>Registrations</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.length > 0 ? (
                recentEvents.map((evt) => (
                  <tr key={evt.id}>
                    <td>
                      <div className="table-title-cell">
                        <strong>{evt.title}</strong>
                        {evt.featured && (
                          <span className="badge badge-featured">Featured</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${evt.category.toLowerCase()}`}>
                        {evt.category}
                      </span>
                    </td>
                    <td>
                      <div>{evt.eventDate}</div>
                      <small style={{ color: 'var(--gray-500)' }}>{evt.startTime}</small>
                    </td>
                    <td>{evt.venue}</td>
                    <td>
                      <strong>{evt.registrationCount ?? 0}</strong>
                      {evt.maxCapacity ? ` / ${evt.maxCapacity}` : ''}
                    </td>
                    <td>
                      {evt.registrationOpen ? (
                        <span className="badge badge-open">Open</span>
                      ) : (
                        <span className="badge badge-closed">Closed</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        <Link
                          to={`/events/${evt.id}`}
                          className="table-action-btn"
                          title="View Public Page"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => {
                            setEditingEvent(evt);
                            setIsEventModalOpen(true);
                          }}
                          className="table-action-btn"
                          title="Edit Event"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => setDeleteTargetEvent(evt)}
                          className="table-action-btn text-danger"
                          title="Delete Event"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>No events created yet.</p>
                    <button
                      onClick={() => {
                        setEditingEvent(null);
                        setIsEventModalOpen(true);
                      }}
                      className="btn btn-sm btn-primary"
                    >
                      <Plus size={16} /> Create Your First Event
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <EventFormModal
        isOpen={isEventModalOpen}
        event={editingEvent}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleCreateOrUpdateEvent}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetEvent}
        title="Delete Event?"
        message={`Are you sure you want to permanently delete "${deleteTargetEvent?.title}"? All associated registrations will also be removed.`}
        confirmLabel="Confirm Delete"
        confirmVariant="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteEvent}
        onCancel={() => setDeleteTargetEvent(null)}
      />

      <style>{`
        .admin-page {
          padding-top: 2.5rem;
          padding-bottom: 4rem;
        }

        .admin-header-row {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.75rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .admin-tag {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }

        .admin-page-title {
          font-size: 2.25rem;
          color: var(--navy-900);
          margin-bottom: 0.4rem;
          letter-spacing: -0.025em;
        }

        .admin-page-subtitle {
          color: var(--gray-500);
          font-size: 1rem;
        }

        .admin-top-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stats-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.75rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          padding: 1.75rem;
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          border-radius: var(--radius-xl);
          background: #ffffff;
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
        }

        .stat-card-icon {
          width: 54px;
          height: 54px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-card-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .stat-card-label {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .stat-card-value {
          font-family: var(--font-heading);
          font-size: 2.15rem;
          font-weight: 800;
          color: var(--navy-900);
          line-height: 1.1;
          margin: 0.35rem 0 0.2rem;
        }

        .stat-card-featured-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--navy-900);
          margin: 0.45rem 0 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stat-card-hint {
          font-size: 0.8rem;
          color: var(--gray-400);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .admin-nav-tabs {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 2px solid var(--gray-200);
          margin-bottom: 2.5rem;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tab-item {
          padding: 0.85rem 1.5rem;
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--gray-500);
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }

        .tab-item:hover {
          color: var(--primary);
        }

        .tab-item.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .admin-section-block {
          background: #ffffff;
          padding: 2rem 2.25rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
        }

        .section-title-bar {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .admin-block-heading {
          font-size: 1.35rem;
          color: var(--navy-900);
          margin-bottom: 0.25rem;
        }

        .admin-block-sub {
          font-size: 0.9rem;
          color: var(--gray-500);
        }

        .view-all-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--primary);
        }

        .data-table {
          min-width: 820px;
        }

        .table-title-cell {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .table-actions {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .table-action-btn {
          padding: 0.45rem;
          border-radius: var(--radius-sm);
          color: var(--gray-500);
          transition: all var(--transition-fast);
        }

        .table-action-btn:hover {
          background-color: var(--gray-100);
          color: var(--navy-900);
        }

        .table-action-btn.text-danger:hover {
          background-color: var(--danger-light);
          color: var(--danger);
        }

        @media (max-width: 1024px) {
          .stats-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .stats-cards-grid {
            grid-template-columns: 1fr;
          }
          .admin-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-top-actions {
            width: 100%;
          }
          .admin-top-actions .btn {
            flex: 1;
          }
          .admin-section-block {
            padding: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};
