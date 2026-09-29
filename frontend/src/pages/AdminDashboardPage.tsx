import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registrationService } from '../services/registrations';
import { eventService } from '../services/events';
import { queryKeys } from '../lib/queryKeys';
import type { Event, EventFormData } from '../types';
import { EventFormModal } from '../components/EventFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { StatsCardSkeleton } from '../components/skeletons/StatsCardSkeleton';
import { TableSkeleton } from '../components/skeletons/TableSkeleton';

export const AdminDashboardPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // 1. Independent query for aggregate stats (30s staleTime)
  const {
    data: stats,
    isLoading: isStatsLoading,
    isFetching: isStatsFetching,
    error: statsError,
  } = useQuery({
    queryKey: queryKeys.admin.stats(),
    queryFn: () => registrationService.getDashboardStats(),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  // 2. Independent query for events roster (60s staleTime)
  const {
    data: allEvents = [],
    isLoading: isEventsLoading,
    isFetching: isEventsFetching,
    error: eventsError,
  } = useQuery({
    queryKey: queryKeys.admin.events(),
    queryFn: () => eventService.adminGetAllEvents(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  const recentEvents = allEvents.slice(0, 5);

  // 3. Create / Update Event Mutation
  const createOrUpdateMutation = useMutation({
    mutationFn: async (formData: EventFormData) => {
      if (editingEvent) {
        return eventService.updateEvent(editingEvent.id, formData);
      } else {
        return eventService.createEvent(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.events() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      setIsEventModalOpen(false);
      setEditingEvent(null);
    },
    onError: (err: any) => {
      alert(err.message || 'Failed to save event');
    },
  });

  // 4. Optimistic Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return eventService.deleteEvent(id);
    },
    onMutate: async (deletedId: number) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.admin.events() });
      const previousEvents = queryClient.getQueryData<Event[]>(queryKeys.admin.events());
      if (previousEvents) {
        queryClient.setQueryData<Event[]>(
          queryKeys.admin.events(),
          previousEvents.filter((e) => e.id !== deletedId)
        );
      }
      return { previousEvents };
    },
    onError: (err: any, _id, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(queryKeys.admin.events(), context.previousEvents);
      }
      alert(err.message || 'Failed to delete event');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.events() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      setDeleteTargetEvent(null);
    },
  });

  const handleCreateOrUpdateEvent = async (formData: EventFormData) => {
    createOrUpdateMutation.mutate(formData);
  };

  const prefetchAdminEvents = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.admin.events(),
      queryFn: () => eventService.adminGetAllEvents(),
      staleTime: 60 * 1000,
    });
  };

  const prefetchAdminRegistrations = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.registrations.list({}),
      queryFn: () => registrationService.getRegistrations(),
      staleTime: 30 * 1000,
    });
  };

  const handleDeleteEvent = async () => {
    if (!deleteTargetEvent) return;
    deleteMutation.mutate(deleteTargetEvent.id);
  };

  return (
    <div className="admin-page page-container">
      {/* Top Header - Always instantly visible */}
      <div className="admin-header-row">
        <div>
          <span className="admin-tag">Club Administration</span>
          <h1 className="admin-page-title">
            Executive Dashboard
            {(isStatsFetching || isEventsFetching) && (
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--gray-400)', marginLeft: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <RefreshCw size={13} className="spin-slow" /> Syncing...
              </span>
            )}
          </h1>
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
          <Link
            to="/admin/registrations"
            className="btn btn-secondary"
            onMouseEnter={prefetchAdminRegistrations}
            onFocus={prefetchAdminRegistrations}
          >
            <ClipboardList size={18} />
            View Registrations
          </Link>
        </div>
      </div>

      {(statsError || eventsError) && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <div>Failed to synchronize some dashboard metrics from the server.</div>
        </div>
      )}

      {/* 4 Stat Cards - Granular skeleton loading */}
      {isStatsLoading ? (
        <div className="stats-cards-grid">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </div>
      ) : (
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
      )}

      {/* Navigation Sub-Tabs - Always interactive */}
      <div className="admin-nav-tabs">
        <Link to="/admin/dashboard" className="tab-item active">
          Dashboard Overview
        </Link>
        <Link
          to="/admin/events"
          className="tab-item"
          onMouseEnter={prefetchAdminEvents}
          onFocus={prefetchAdminEvents}
        >
          Event Management ({stats?.totalEvents ?? allEvents.length})
        </Link>
        <Link
          to="/admin/registrations"
          className="tab-item"
          onMouseEnter={prefetchAdminRegistrations}
          onFocus={prefetchAdminRegistrations}
        >
          Student Registrations ({stats?.totalRegistrations ?? 0})
        </Link>
      </div>

      {/* Recent Events Table Preview - Granular skeleton */}
      <div className="admin-section-block">
        <div className="section-title-bar">
          <div>
            <h3 className="admin-block-heading">Recent Events Schedule</h3>
            <p className="admin-block-sub">Preview of upcoming and recent club activities.</p>
          </div>
          <Link
            to="/admin/events"
            className="view-all-link"
            onMouseEnter={prefetchAdminEvents}
            onFocus={prefetchAdminEvents}
          >
            Manage All Events <ArrowRight size={14} />
          </Link>
        </div>

        {isEventsLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
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
        )}
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
        message={`Are you sure you want to permanently delete "${deleteTargetEvent?.title}"? All associated registrations and storage files will also be removed.`}
        confirmLabel="Confirm Delete"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
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
