import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  Filter,
  Users,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/events';
import { queryKeys } from '../lib/queryKeys';
import { useDebounce } from '../hooks/useDebounce';
import type { Event, EventFormData } from '../types';
import { EventFormModal } from '../components/EventFormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { TableSkeleton } from '../components/skeletons/TableSkeleton';
import { Toast, type ToastMessage } from '../components/Toast';

export const AdminEventsPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  // Toast feedback state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // 350ms search debounce
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deleteTargetEvent, setDeleteTargetEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Sync debounced search with URL parameters
  // Sync debounced search to URL
  useEffect(() => {
    const currentParam = searchParams.get('search') || '';
    const trimmedDebounced = debouncedSearch ? debouncedSearch.trim() : '';
    if (currentParam !== trimmedDebounced) {
      const params = new URLSearchParams(searchParams);
      if (trimmedDebounced) {
        params.set('search', trimmedDebounced);
      } else {
        params.delete('search');
      }
      setSearchParams(params, { replace: true });
    }
  }, [debouncedSearch]);

  // Synchronize browser history / URL back-forward navigation back into local state
  useEffect(() => {
    const urlCategory = searchParams.get('category') || 'All';
    const urlSearch = searchParams.get('search') || '';

    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
    if (urlSearch !== searchTerm && urlSearch !== debouncedSearch) {
      setSearchTerm(urlSearch);
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams);
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    setSearchParams(params);
  };

  // 1. Categories query
  const { data: categories = [] } = useQuery({
    queryKey: queryKeys.events.categories(),
    queryFn: () => eventService.getCategories(),
    staleTime: 30 * 60 * 1000,
  });

  // 2. Admin events query with keepPreviousData to prevent UI flashes
  const currentQueryKey = queryKeys.admin.events({
    search: debouncedSearch,
    category: selectedCategory,
  });

  const {
    data: events = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: currentQueryKey,
    queryFn: () => eventService.adminGetAllEvents(debouncedSearch, selectedCategory),
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  // 3. Create / Update Event Mutation
  const saveMutation = useMutation({
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
      setIsFormModalOpen(false);
      setEditingEvent(null);
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: editingEvent ? 'Event updated successfully.' : 'Event created successfully.',
      });
    },
    onError: (err: any) => {
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Failed to save event.',
      });
    },
  });

  // 4. Optimistic Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => eventService.deleteEvent(id),
    onMutate: async (deletedId: number) => {
      await queryClient.cancelQueries({ queryKey: currentQueryKey });
      const previousEvents = queryClient.getQueryData<Event[]>(currentQueryKey);
      if (previousEvents) {
        queryClient.setQueryData<Event[]>(
          currentQueryKey,
          previousEvents.filter((e) => e.id !== deletedId)
        );
      }
      return { previousEvents };
    },
    onSuccess: () => {
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Event and associated cloud storage deleted successfully.',
      });
    },
    onError: (err: any, _id, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(currentQueryKey, context.previousEvents);
      }
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Failed to delete event. State restored.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.events() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      setDeleteTargetEvent(null);
    },
  });

  const handleSaveEvent = async (formData: EventFormData) => {
    saveMutation.mutate(formData);
  };

  const handleDeleteEvent = async () => {
    if (!deleteTargetEvent) return;
    deleteMutation.mutate(deleteTargetEvent.id);
  };

  return (
    <div className="admin-page page-container">
      {/* Top Header */}
      <div className="admin-header-row">
        <div>
          <span className="admin-tag">Club Administration</span>
          <h1 className="admin-page-title">
            Event Management
            {isFetching && !isLoading && (
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--gray-400)', marginLeft: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <RefreshCw size={13} className="spin-slow" /> Updating...
              </span>
            )}
          </h1>
          <p className="admin-page-subtitle">
            Create, update, or remove events and monitor student enrollment status.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEvent(null);
            setIsFormModalOpen(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={18} />
          Create New Event
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-nav-tabs">
        <Link to="/admin/dashboard" className="tab-item">
          Dashboard Overview
        </Link>
        <Link to="/admin/events" className="tab-item active">
          Event Management ({events.length})
        </Link>
        <Link to="/admin/registrations" className="tab-item">
          Student Registrations
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filter-toolbar">
        <div className="search-input-wrap">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search events by title or venue..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-select-wrap">
          <Filter size={16} className="filter-icon" />
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <div>Failed to retrieve events from the server.</div>
        </div>
      )}

      {/* Events Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={8} />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Category</th>
                <th>Date & Schedule</th>
                <th>Venue</th>
                <th>Capacity & Registered</th>
                <th>Registration</th>
                <th>Spotlight</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length > 0 ? (
                events.map((evt) => (
                  <tr key={evt.id}>
                    <td>
                      <div className="event-cell-info">
                        <strong>{evt.title}</strong>
                        <small className="event-desc-snippet">
                          {evt.description.substring(0, 75)}...
                        </small>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${evt.category.toLowerCase()}`}>
                        {evt.category}
                      </span>
                    </td>
                    <td>
                      <div>{evt.eventDate}</div>
                      <small style={{ color: 'var(--gray-500)' }}>
                        {evt.startTime} - {evt.endTime}
                      </small>
                    </td>
                    <td>{evt.venue}</td>
                    <td>
                      <div className="reg-count-cell">
                        <Users size={14} style={{ color: 'var(--gray-400)' }} />
                        <span>
                          <strong>{evt.registrationCount ?? 0}</strong>
                          {evt.maxCapacity ? ` / ${evt.maxCapacity}` : ' / ∞'}
                        </span>
                      </div>
                    </td>
                    <td>
                      {evt.registrationOpen ? (
                        <span className="badge badge-open">Open</span>
                      ) : (
                        <span className="badge badge-closed">Closed</span>
                      )}
                    </td>
                    <td>
                      {evt.featured ? (
                        <span className="badge badge-featured">Featured</span>
                      ) : (
                        <span style={{ color: 'var(--gray-400)', fontSize: '0.8rem' }}>Standard</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        <Link
                          to={`/events/${evt.id}`}
                          className="table-action-btn"
                          title="View Live Page"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink size={16} />
                        </Link>
                        <button
                          onClick={() => {
                            setEditingEvent(evt);
                            setIsFormModalOpen(true);
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
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem' }}>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>No events found matching your filter criteria.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        handleCategoryChange('All');
                      }}
                      className="btn btn-sm btn-secondary"
                    >
                      Clear Search Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Modal */}
      <EventFormModal
        isOpen={isFormModalOpen}
        event={editingEvent}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEvent(null);
        }}
        onSubmit={handleSaveEvent}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetEvent}
        title="Delete Event?"
        message={`Are you sure you want to delete "${deleteTargetEvent?.title}"? All participant registrations and storage assets for this event will be deleted permanently.`}
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

        .admin-filter-toolbar {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          margin-bottom: 2rem;
          background: #ffffff;
          padding: 1.25rem 1.5rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
        }

        .search-input-wrap {
          position: relative;
          flex: 1;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 0.95rem;
          color: var(--gray-400);
          pointer-events: none;
        }

        .category-select-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 220px;
        }

        .filter-icon {
          color: var(--gray-500);
        }

        .data-table {
          min-width: 920px;
        }

        .event-cell-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          max-width: 280px;
        }

        .event-desc-snippet {
          color: var(--gray-500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .reg-count-cell {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: var(--navy-800);
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

        @media (max-width: 768px) {
          .admin-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-filter-toolbar {
            flex-direction: column;
            align-items: stretch;
            padding: 1.25rem;
          }
          .category-select-wrap {
            min-width: 100%;
          }
        }
      `}</style>

      {/* Non-blocking feedback toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
