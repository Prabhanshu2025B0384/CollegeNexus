import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  Search,
  Trash2,
  Download,
  Calendar,
  Phone,
  Mail,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { registrationService } from '../services/registrations';
import { eventService } from '../services/events';
import { queryKeys } from '../lib/queryKeys';
import { useDebounce } from '../hooks/useDebounce';
import type { Registration } from '../types';
import { ConfirmModal } from '../components/ConfirmModal';
import { TableSkeleton } from '../components/skeletons/TableSkeleton';
import { Toast, type ToastMessage } from '../components/Toast';

const YEARS = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'];

export const AdminRegistrationsPage: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL query parameters (Requirement 14 & 15: Preserve State)
  const initialSearch = searchParams.get('search') || '';
  const initialEventId = searchParams.get('event') ? parseInt(searchParams.get('event')!, 10) : undefined;
  const initialYear = searchParams.get('year') || 'All';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedEventId, setSelectedEventId] = useState<number | undefined>(initialEventId);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  // Toast feedback state
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // 350ms search debounce
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Deletion modal target
  const [deleteTarget, setDeleteTarget] = useState<Registration | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/admin/login');
    }
  }, [authLoading, isAuthenticated, navigate]);

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
    const urlSearch = searchParams.get('search') || '';
    const urlEventId = searchParams.get('event') ? parseInt(searchParams.get('event')!, 10) : undefined;
    const urlYear = searchParams.get('year') || 'All';

    if (urlSearch !== searchTerm && urlSearch !== debouncedSearch) {
      setSearchTerm(urlSearch);
    }
    if (urlEventId !== selectedEventId) {
      setSelectedEventId(urlEventId);
    }
    if (urlYear !== selectedYear) {
      setSelectedYear(urlYear);
    }
  }, [searchParams]);

  const handleEventChange = (eventId?: number) => {
    setSelectedEventId(eventId);
    const params = new URLSearchParams(searchParams);
    if (eventId) {
      params.set('event', eventId.toString());
    } else {
      params.delete('event');
    }
    setSearchParams(params);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const params = new URLSearchParams(searchParams);
    if (year === 'All') {
      params.delete('year');
    } else {
      params.set('year', year);
    }
    setSearchParams(params);
  };

  // 1. Events list query for filter dropdown (60s staleTime)
  const { data: events = [] } = useQuery({
    queryKey: queryKeys.admin.events(),
    queryFn: () => eventService.adminGetAllEvents(),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  // 2. Registrations query with keepPreviousData to prevent UI flashes
  const currentQueryKey = queryKeys.registrations.list({
    search: debouncedSearch,
    eventId: selectedEventId,
    year: selectedYear,
  });

  const {
    data: registrations = [],
    isLoading,
    isFetching,
    error,
  } = useQuery({
    queryKey: currentQueryKey,
    queryFn: () =>
      registrationService.getRegistrations(debouncedSearch, selectedEventId, selectedYear),
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  // 3. Delete Registration Mutation with optimistic UI
  const deleteMutation = useMutation({
    mutationFn: (id: number) => registrationService.deleteRegistration(id),
    onMutate: async (deletedId: number) => {
      await queryClient.cancelQueries({ queryKey: currentQueryKey });
      const previousRegistrations = queryClient.getQueryData<Registration[]>(currentQueryKey);
      if (previousRegistrations) {
        queryClient.setQueryData<Registration[]>(
          currentQueryKey,
          previousRegistrations.filter((r) => r.id !== deletedId)
        );
      }
      return { previousRegistrations };
    },
    onSuccess: () => {
      setToast({
        id: Date.now().toString(),
        type: 'success',
        message: 'Registration record removed successfully.',
      });
    },
    onError: (err: any, _id, context) => {
      if (context?.previousRegistrations) {
        queryClient.setQueryData(currentQueryKey, context.previousRegistrations);
      }
      setToast({
        id: Date.now().toString(),
        type: 'error',
        message: err.message || 'Failed to remove registration. State restored.',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.registrations.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
      setDeleteTarget(null);
    },
  });

  const handleDeleteRegistration = async () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id);
  };

  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    const headers = ['ID', 'Student Name', 'Email', 'College', 'Year', 'Phone', 'Event Title', 'Registration Date'];
    const rows = registrations.map((r) => [
      r.id,
      `"${r.name.replace(/"/g, '""')}"`,
      `"${r.email.replace(/"/g, '""')}"`,
      `"${r.college.replace(/"/g, '""')}"`,
      `"${r.year}"`,
      `"${r.phone}"`,
      `"${r.eventTitle.replace(/"/g, '""')}"`,
      `"${r.registeredAt}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `club_registrations_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="admin-page page-container">
      {/* Header */}
      <div className="admin-header-row">
        <div>
          <span className="admin-tag">Club Administration</span>
          <h1 className="admin-page-title">
            Participant Registrations
            {isFetching && !isLoading && (
              <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--gray-400)', marginLeft: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <RefreshCw size={13} className="spin-slow" /> Updating...
              </span>
            )}
          </h1>
          <p className="admin-page-subtitle">
            Search, filter, and audit verified student event registrations.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-secondary"
          disabled={registrations.length === 0}
          title="Download attendee roster as CSV"
        >
          <Download size={18} />
          Export to CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-nav-tabs">
        <Link to="/admin/dashboard" className="tab-item">
          Dashboard Overview
        </Link>
        <Link to="/admin/events" className="tab-item">
          Event Management
        </Link>
        <Link to="/admin/registrations" className="tab-item active">
          Student Registrations ({registrations.length})
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
            placeholder="Search by student name, email, college, or event..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter by Event */}
        <div className="filter-select-wrap">
          <Calendar size={16} className="filter-icon" />
          <select
            className="form-select"
            value={selectedEventId || ''}
            onChange={(e) =>
              handleEventChange(e.target.value ? parseInt(e.target.value, 10) : undefined)
            }
          >
            <option value="">All Events</option>
            {events.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Academic Year */}
        <div className="filter-select-wrap">
          <GraduationCap size={16} className="filter-icon" />
          <select
            className="form-select"
            value={selectedYear}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y === 'All' ? 'All Years' : y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>
          <div>Failed to retrieve registrations from the server.</div>
        </div>
      )}

      {/* Registrations Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : (
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Attendee Name</th>
                <th>Contact Details</th>
                <th>Academic Year</th>
                <th>College / Institute</th>
                <th>Registered Event</th>
                <th>Registration Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.length > 0 ? (
                registrations.map((reg) => (
                  <tr key={reg.id}>
                    <td>
                      <div className="student-name-cell">
                        <strong>{reg.name}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="contact-details-cell">
                        <div className="contact-sub-item">
                          <Mail size={13} style={{ color: 'var(--gray-400)' }} />
                          <span>{reg.email}</span>
                        </div>
                        <div className="contact-sub-item">
                          <Phone size={13} style={{ color: 'var(--gray-400)' }} />
                          <small style={{ color: 'var(--gray-500)' }}>{reg.phone}</small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-default">{reg.year}</span>
                    </td>
                    <td>
                      <span className="college-text" title={reg.college}>{reg.college}</span>
                    </td>
                    <td>
                      <div className="event-tag-cell">
                        <Link to={`/events/${reg.eventId}`} className="event-link" target="_blank" rel="noreferrer">
                          {reg.eventTitle}
                        </Link>
                        {reg.eventCategory && (
                          <span className={`badge badge-${reg.eventCategory.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                            {reg.eventCategory}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <small style={{ color: 'var(--gray-500)' }}>
                        {new Date(reg.registeredAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </small>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => setDeleteTarget(reg)}
                        className="table-action-btn text-danger"
                        title="Remove Registration"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem' }}>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '1rem' }}>No registrations found matching the selected filters.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        handleEventChange(undefined);
                        handleYearChange('All');
                      }}
                      className="btn btn-sm btn-secondary"
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Remove Registration?"
        message={`Are you sure you want to remove the registration of "${deleteTarget?.name}" for "${deleteTarget?.eventTitle}"? This cannot be undone.`}
        confirmLabel="Remove Attendee"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={handleDeleteRegistration}
        onCancel={() => setDeleteTarget(null)}
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
          flex-wrap: wrap;
        }

        .search-input-wrap {
          position: relative;
          flex: 1.5;
          min-width: 250px;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 0.95rem;
          color: var(--gray-400);
          pointer-events: none;
        }

        .filter-select-wrap {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 180px;
        }

        .filter-icon {
          color: var(--gray-500);
          flex-shrink: 0;
        }

        .data-table {
          min-width: 950px;
        }

        .student-name-cell strong {
          color: var(--navy-900);
          font-size: 0.95rem;
        }

        .contact-details-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .contact-sub-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
        }

        .college-text {
          display: inline-block;
          max-width: 190px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.875rem;
        }

        .event-tag-cell {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          align-items: flex-start;
          max-width: 220px;
        }

        .event-link {
          font-weight: 600;
          font-size: 0.875rem;
          color: var(--navy-900);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .event-link:hover {
          color: var(--primary);
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

        @media (max-width: 900px) {
          .admin-header-row {
            flex-direction: column;
            align-items: flex-start;
          }
          .admin-filter-toolbar {
            flex-direction: column;
            align-items: stretch;
            padding: 1.25rem;
          }
          .filter-select-wrap {
            min-width: 100%;
          }
        }
      `}</style>

      {/* Non-blocking feedback toast */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
