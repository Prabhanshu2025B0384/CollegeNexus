import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Filter, RefreshCw } from 'lucide-react';
import type { Event } from '../types';
import { eventService } from '../services/events';
import { queryKeys } from '../lib/queryKeys';
import { useDebounce } from '../hooks/useDebounce';
import { EventCard } from '../components/EventCard';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { RegistrationModal } from '../components/RegistrationModal';
import { EmptyState } from '../components/EmptyState';
import { EventCardSkeleton } from '../components/skeletons/EventCardSkeleton';

const DEFAULT_CATEGORIES = [
  'Technical',
  'Workshop',
  'Hackathon',
  'Cultural',
  'Sports',
  'Literary',
  'Gaming',
  'Career',
  'Seminar',
  'Competition',
];

export const EventsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial filter values from URL query parameters
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';
  const initialTime = (searchParams.get('time') as 'all' | 'upcoming' | 'past') || 'all';

  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>(initialTime);

  // 350ms debounce to prevent spamming backend on each keystroke
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Sync debounced search with URL parameters
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
    const urlTime = (searchParams.get('time') as 'all' | 'upcoming' | 'past') || 'all';

    if (urlCategory !== selectedCategory) {
      setSelectedCategory(urlCategory);
    }
    if (urlSearch !== searchTerm && urlSearch !== debouncedSearch) {
      setSearchTerm(urlSearch);
    }
    if (urlTime !== timeFilter) {
      setTimeFilter(urlTime);
    }
  }, [searchParams]);

  // Sync category changes to URL
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const params = new URLSearchParams(searchParams);
    if (category === 'All') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    setSearchParams(params);
  };

  // Sync time filter to URL
  const handleTimeSelect = (time: 'all' | 'upcoming' | 'past') => {
    setTimeFilter(time);
    const params = new URLSearchParams(searchParams);
    if (time === 'all') {
      params.delete('time');
    } else {
      params.set('time', time);
    }
    setSearchParams(params);
  };

  // 1. Categories query: long staleTime (30 min)
  const { data: categories = DEFAULT_CATEGORIES } = useQuery({
    queryKey: queryKeys.events.categories(),
    queryFn: async () => {
      const cats = await eventService.getCategories();
      return cats && cats.length > 0 ? cats : DEFAULT_CATEGORIES;
    },
    staleTime: 30 * 60 * 1000,
  });

  // 2. Events query: keep previous data during search/filter refetch to prevent blanking
  const {
    data: events = [],
    isLoading,
    isFetching,
    isError,
  } = useQuery({
    queryKey: queryKeys.events.list({ search: debouncedSearch, category: selectedCategory }),
    queryFn: () => eventService.getAllEvents(debouncedSearch, selectedCategory),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  const [selectedEventForModal, setSelectedEventForModal] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenRegistration = (event: Event) => {
    setSelectedEventForModal(event);
    setIsModalOpen(true);
  };

  const today = useMemo(() => new Date().setHours(0, 0, 0, 0), []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const eventTime = new Date(e.eventDate).getTime();
      if (timeFilter === 'upcoming') {
        return eventTime >= today;
      }
      if (timeFilter === 'past') {
        return eventTime < today;
      }
      return true;
    });
  }, [events, timeFilter, today]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setTimeFilter('all');
    setSearchParams(new URLSearchParams());
  };

  return (
    <div className="events-page page-container">
      {/* Header Banner */}
      <div className="events-header">
        <h1 className="events-page-title">Explore Campus Club Events</h1>
        <p className="events-page-subtitle">
          Browse technical workshops, 36-hour hackathons, cultural spectacles, esports tournaments,
          and career mentorship sessions.
        </p>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="events-toolbar-card">
        <div className="search-and-time-row">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by event title, description, or venue..."
          />

          <div className="time-filter-buttons">
            <button
              className={`time-btn ${timeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleTimeSelect('all')}
            >
              All Events
            </button>
            <button
              className={`time-btn ${timeFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => handleTimeSelect('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`time-btn ${timeFilter === 'past' ? 'active' : ''}`}
              onClick={() => handleTimeSelect('past')}
            >
              Past
            </button>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="category-section">
          <div className="category-label">
            <Filter size={15} />
            <span>Filter by Category:</span>
          </div>
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        </div>
      </div>

      {/* Results Header */}
      <div className="results-status-bar">
        <span className="results-count">
          Showing <strong>{filteredEvents.length}</strong> event{filteredEvents.length === 1 ? '' : 's'}
          {selectedCategory !== 'All' ? ` in ${selectedCategory}` : ''}
          {debouncedSearch ? ` matching "${debouncedSearch}"` : ''}
          {isFetching && !isLoading && (
            <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginLeft: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
              <RefreshCw size={12} className="spin-slow" /> Updating...
            </span>
          )}
        </span>
        {(searchTerm || selectedCategory !== 'All' || timeFilter !== 'all') && (
          <button
            className="btn btn-sm btn-secondary reset-filters-btn"
            onClick={handleResetFilters}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="grid-3 events-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <div className="alert alert-danger" style={{ margin: '2rem 0' }}>
          <div>We couldn't load the events right now. Please verify the backend is running and try again.</div>
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid-3 events-grid">
          {filteredEvents.map((evt) => (
            <EventCard
              key={evt.id}
              event={evt}
              onRegisterClick={handleOpenRegistration}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No events found"
          description="We couldn't find any events matching your current search or category filter. Try clearing filters to see all available events."
          actionLabel="Clear All Filters"
          onAction={handleResetFilters}
          icon={searchTerm ? 'search' : 'calendar'}
        />
      )}

      {/* Registration Modal Dialog */}
      <RegistrationModal
        event={selectedEventForModal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEventForModal(null);
        }}
        onSuccess={() => {
          // Invalidate targeted event queries without wiping the whole screen
          queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
        }}
      />

      <style>{`
        .events-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 3rem;
        }

        .events-page-title {
          font-size: 2.35rem;
          color: var(--navy-900);
          margin-bottom: 0.65rem;
          letter-spacing: -0.025em;
        }

        .events-page-subtitle {
          font-size: 1.1rem;
          color: var(--gray-600);
          line-height: 1.65;
        }

        .events-toolbar-card {
          background: #ffffff;
          padding: 1.75rem 2rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
          margin-bottom: 2.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .search-and-time-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .time-filter-buttons {
          display: flex;
          align-items: center;
          background-color: var(--gray-100);
          padding: 0.3rem;
          border-radius: var(--radius-full);
          gap: 0.3rem;
        }

        .time-btn {
          padding: 0.45rem 1.1rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--gray-600);
          border-radius: var(--radius-full);
          transition: all var(--transition-fast);
        }

        .time-btn.active {
          background-color: #ffffff;
          color: var(--navy-900);
          box-shadow: var(--shadow-xs);
        }

        .category-section {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          border-top: 1px solid var(--gray-100);
          padding-top: 1.25rem;
        }

        .category-label {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .results-status-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 0 0.5rem;
        }

        .results-count {
          font-size: 0.95rem;
          color: var(--gray-600);
        }

        .reset-filters-btn {
          font-size: 0.825rem;
        }

        .events-grid {
          margin-bottom: 4rem;
        }

        @media (max-width: 768px) {
          .events-page-title {
            font-size: 1.85rem;
          }
          .events-toolbar-card {
            padding: 1.25rem;
          }
          .search-and-time-row {
            flex-direction: column;
            align-items: stretch;
          }
          .time-filter-buttons {
            align-self: flex-start;
          }
        }
      `}</style>
    </div>
  );
};
