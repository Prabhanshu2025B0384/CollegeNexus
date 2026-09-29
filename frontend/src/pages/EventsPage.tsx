import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter } from 'lucide-react';
import type { Event } from '../types';
import { eventService } from '../services/events';
import { EventCard } from '../components/EventCard';
import { SearchBar } from '../components/SearchBar';
import { CategoryFilter } from '../components/CategoryFilter';
import { RegistrationModal } from '../components/RegistrationModal';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';

export const EventsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';

  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedEventForModal, setSelectedEventForModal] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await eventService.getAllEvents(searchTerm, selectedCategory);
      setEvents(data);
    } catch {
      setError(
        "We couldn't load the events right now. Please verify the backend is running and try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await eventService.getCategories();
      if (cats && cats.length > 0) {
        setCategories(cats);
      } else {
        setCategories([
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
        ]);
      }
    } catch {
      setCategories([
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
      ]);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', category);
    }
    setSearchParams(newParams);
  };

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
              onClick={() => setTimeFilter('all')}
            >
              All Events
            </button>
            <button
              className={`time-btn ${timeFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setTimeFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`time-btn ${timeFilter === 'past' ? 'active' : ''}`}
              onClick={() => setTimeFilter('past')}
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
          {searchTerm ? ` matching "${searchTerm}"` : ''}
        </span>
        {(searchTerm || selectedCategory !== 'All' || timeFilter !== 'all') && (
          <button
            className="btn btn-sm btn-secondary reset-filters-btn"
            onClick={() => {
              setSearchTerm('');
              handleCategorySelect('All');
              setTimeFilter('all');
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingSpinner message="Searching and retrieving events..." />
      ) : error ? (
        <div className="alert alert-danger" style={{ margin: '2rem 0' }}>
          <div>{error}</div>
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
          onAction={() => {
            setSearchTerm('');
            handleCategorySelect('All');
            setTimeFilter('all');
          }}
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
          fetchEvents(); // Refresh registrations count
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
