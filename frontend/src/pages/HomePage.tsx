import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Sparkles,
  Users,
  Award,
  ArrowRight,
  Code2,
  Trophy,
  Coffee,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';
import type { Event } from '../types';
import { eventService } from '../services/events';
import { queryKeys } from '../lib/queryKeys';
import { EventCard } from '../components/EventCard';
import { FeaturedEvent } from '../components/FeaturedEvent';
import { RegistrationModal } from '../components/RegistrationModal';
import { EventCardSkeleton } from '../components/skeletons/EventCardSkeleton';
import { FeaturedEventSkeleton } from '../components/skeletons/FeaturedEventSkeleton';

export const HomePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedEventForModal, setSelectedEventForModal] = useState<Event | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Parallel server-state queries with 5min staleTime
  const {
    data: featuredEvent,
    isLoading: isFeaturedLoading,
  } = useQuery({
    queryKey: queryKeys.events.featured(),
    queryFn: () => eventService.getFeaturedEvent(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: upcomingEvents = [],
    isLoading: isUpcomingLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.events.upcoming(6),
    queryFn: () => eventService.getUpcomingEvents(6),
    staleTime: 5 * 60 * 1000,
  });

  // Prefetch events list & categories for instant navigation
  useEffect(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.events.categories(),
      queryFn: () => eventService.getCategories(),
      staleTime: 30 * 60 * 1000,
    });
  }, [queryClient]);

  const handleOpenRegistration = (event: Event) => {
    setSelectedEventForModal(event);
    setIsModalOpen(true);
  };

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-sparkle" />
            <span>Official Collegiate Technology & Innovation Club</span>
          </div>

          <h1 className="hero-title">
            Where Curious Minds Build, Compete & Innovate Together
          </h1>

          <p className="hero-subtitle">
            Welcome to the Campus Nexus Club — your launchpad for hands-on tech workshops,
            high-octane hackathons, esports championships, and unforgettable cultural festivals.
            Discover upcoming events, register with one click, and shape your campus journey.
          </p>

          <div className="hero-actions">
            <Link to="/events" className="btn btn-primary btn-lg">
              Explore All Events
              <ArrowRight size={18} />
            </Link>
            <a href="#about-club" className="btn btn-secondary btn-lg">
              Discover Our Club
            </a>
          </div>

          {/* Quick Metrics Bar */}
          <div className="hero-stats-bar">
            <div className="stat-pill">
              <span className="stat-num">500+</span>
              <span className="stat-label">Active Club Members</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-pill">
              <span className="stat-num">30+</span>
              <span className="stat-label">Annual Campus Events</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-pill">
              <span className="stat-num">100%</span>
              <span className="stat-label">Student Led & Organized</span>
            </div>
          </div>
        </div>
      </section>

      <div className="page-container">
        {isError && (
          <div className="alert alert-error" style={{ margin: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Unable to load live events from the server. Check your connection or try again.</span>
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              Retry
            </button>
          </div>
        )}

        {/* 2. Featured Event Section (API Driven with Skeleton) */}
        {isFeaturedLoading ? (
          <FeaturedEventSkeleton />
        ) : featuredEvent && featuredEvent.id ? (
          <FeaturedEvent
            event={featuredEvent}
            onRegisterClick={handleOpenRegistration}
          />
        ) : null}

        {/* 3. Upcoming Events Section */}
        <section className="upcoming-section">
          <div className="section-header">
            <div>
              <span className="section-tag">Mark Your Calendar</span>
              <h2 className="section-title">
                Upcoming Club Events
                {isFetching && !isUpcomingLoading && (
                  <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--gray-400)', marginLeft: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                    <RefreshCw size={12} className="spin-slow" /> Updating...
                  </span>
                )}
              </h2>
              <p className="section-subtitle">
                Register early to reserve your seat. Workshops and hackathons fill up rapidly!
              </p>
            </div>
            <Link to="/events" className="btn btn-secondary">
              View Full Schedule <ArrowRight size={16} />
            </Link>
          </div>

          {isUpcomingLoading ? (
            <div className="grid-3 upcoming-grid">
              <EventCardSkeleton />
              <EventCardSkeleton />
              <EventCardSkeleton />
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="grid-3 upcoming-grid">
              {upcomingEvents.map((evt) => (
                <EventCard
                  key={evt.id}
                  event={evt}
                  onRegisterClick={handleOpenRegistration}
                />
              ))}
            </div>
          ) : (
            <div className="no-upcoming-box">
              <Calendar size={36} />
              <p>No upcoming events currently scheduled. Check back soon!</p>
            </div>
          )}
        </section>

            {/* 4. Club Introduction & Pillars */}
            <section className="about-club-section" id="about-club">
              <div className="about-header-block">
                <span className="section-tag">Who We Are</span>
                <h2 className="section-title">Fueling Passions Across Campus</h2>
                <p className="about-intro-text">
                  The Campus Nexus Club is the largest multidisciplinary student organization on campus.
                  Founded in 2021 by a team of aspiring engineers and designers, we bridge the gap
                  between classroom theory and hands-on industry craftsmanship.
                </p>
              </div>

              <div className="about-cards-grid">
                <div className="about-card">
                  <div className="about-icon-box bg-blue">
                    <Code2 size={24} />
                  </div>
                  <h3>Hands-on Workshops</h3>
                  <p>
                    From zero-to-one full-stack development to cloud infrastructure and AI, our
                    peer-guided masterclasses provide real-world practical skills you won't find in textbooks.
                  </p>
                </div>

                <div className="about-card">
                  <div className="about-icon-box bg-purple">
                    <Trophy size={24} />
                  </div>
                  <h3>Hackathons & Competitions</h3>
                  <p>
                    Participate in our flagship 36-hour hackathons, algorithmic speed-coding duels,
                    and inter-department sports leagues with mentorship from senior alumni and industry partners.
                  </p>
                </div>

                <div className="about-card">
                  <div className="about-icon-box bg-amber">
                    <Users size={24} />
                  </div>
                  <h3>Inclusive Community</h3>
                  <p>
                    Connect with fellow freshmen, seniors, and graduate researchers across engineering,
                    business, and design disciplines. Share ideas, form teams, and build lasting friendships.
                  </p>
                </div>

                <div className="about-card">
                  <div className="about-icon-box bg-emerald">
                    <Award size={24} />
                  </div>
                  <h3>Leadership & Career Growth</h3>
                  <p>
                    Lead project squads, organize university-wide festivals, and access exclusive
                    alumni referral networks and internship opportunities at top tech organizations.
                  </p>
                </div>
              </div>

              {/* What Students Gain */}
              <div className="gain-banner">
                <div className="gain-left">
                  <h3>What You Gain by Joining Our Activities</h3>
                  <ul className="gain-checklist">
                    <li><CheckCircle size={18} className="check-icon" /> Verifiable event participation certificates for your portfolio</li>
                    <li><CheckCircle size={18} className="check-icon" /> Direct access to alumni working at Google, Microsoft, and startups</li>
                    <li><CheckCircle size={18} className="check-icon" /> Dedicated team collaboration spaces and computing lab access</li>
                    <li><CheckCircle size={18} className="check-icon" /> Free admission to all club hackathons, talks, and networking mixers</li>
                  </ul>
                </div>
                <div className="gain-right">
                  <div className="gain-quote-card">
                    <Coffee size={28} className="quote-coffee" />
                    <p className="gain-quote">
                      "Campus Nexus gave me the team, mentorship, and confidence to build my first
                      open-source project. Within six months, that project helped me land a summer internship!"
                    </p>
                    <div className="quote-author">
                      <strong>Priya Sundaram</strong>
                      <span>3rd Year Computer Science, Club Tech Lead</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
      </div>

      {/* Registration Modal Dialog */}
      <RegistrationModal
        event={selectedEventForModal}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEventForModal(null);
        }}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
        }}
      />

      <style>{`
        .hero-section {
          background: linear-gradient(180deg, #ffffff 0%, var(--gray-50) 100%);
          border-bottom: 1px solid var(--gray-200);
          padding: 5rem 1.5rem 4rem;
          text-align: center;
        }

        .hero-container {
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--primary-light);
          color: var(--primary);
          border: 1px solid var(--primary-border);
          padding: 0.4rem 1rem;
          border-radius: var(--radius-full);
          font-size: 0.825rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          margin-bottom: 1.75rem;
          box-shadow: var(--shadow-xs);
        }

        .hero-sparkle {
          color: var(--primary);
        }

        .hero-title {
          font-size: clamp(2.25rem, 5vw, 3.25rem);
          font-weight: 800;
          line-height: 1.18;
          letter-spacing: -0.03em;
          color: var(--navy-900);
          margin-bottom: 1.5rem;
        }

        .hero-subtitle {
          font-size: 1.125rem;
          color: var(--gray-600);
          line-height: 1.7;
          max-width: 760px;
          margin-bottom: 2.25rem;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 3.5rem;
        }

        .hero-stats-bar {
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
          border-radius: var(--radius-full);
          padding: 0.9rem 2.5rem;
          gap: 2.5rem;
        }

        .stat-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .stat-num {
          font-family: var(--font-heading);
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--primary);
          line-height: 1.1;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--gray-500);
          font-weight: 600;
          margin-top: 0.15rem;
        }

        .stat-divider {
          width: 1px;
          height: 32px;
          background: var(--gray-200);
        }

        .upcoming-section {
          margin: 4.5rem 0;
        }

        .section-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.25rem;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .section-tag {
          display: inline-block;
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.4rem;
        }

        .section-title {
          font-size: 2rem;
          color: var(--navy-900);
          margin-bottom: 0.35rem;
        }

        .section-subtitle {
          font-size: 1rem;
          color: var(--gray-500);
        }

        .upcoming-grid {
          margin-top: 1rem;
        }

        .no-upcoming-box {
          text-align: center;
          padding: 3.5rem 2rem;
          background: #ffffff;
          border-radius: var(--radius-xl);
          border: 1.5px dashed var(--gray-300);
          color: var(--gray-500);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }

        /* About Section */
        .about-club-section {
          margin: 5rem 0 2rem;
          padding-top: 3rem;
          border-top: 1px solid var(--gray-200);
        }

        .about-header-block {
          text-align: center;
          max-width: 760px;
          margin: 0 auto 3.5rem;
        }

        .about-intro-text {
          font-size: 1.1rem;
          color: var(--gray-600);
          line-height: 1.65;
          margin-top: 0.85rem;
        }

        .about-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.75rem;
          margin-bottom: 4rem;
        }

        .about-card {
          background: #ffffff;
          padding: 2rem 1.75rem;
          border-radius: var(--radius-xl);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
          transition: transform var(--transition-normal), box-shadow var(--transition-normal);
        }

        .about-card:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-md);
        }

        .about-icon-box {
          width: 52px;
          height: 52px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .bg-blue { background-color: var(--primary-light); color: var(--primary); }
        .bg-purple { background-color: var(--purple-light); color: var(--purple); }
        .bg-amber { background-color: var(--accent-light); color: #d97706; }
        .bg-emerald { background-color: var(--success-light); color: var(--success); }

        .about-card h3 {
          font-size: 1.2rem;
          color: var(--navy-900);
          margin-bottom: 0.75rem;
        }

        .about-card p {
          font-size: 0.9rem;
          color: var(--gray-600);
          line-height: 1.6;
        }

        .gain-banner {
          background: linear-gradient(135deg, var(--navy-950) 0%, var(--navy-800) 100%);
          border-radius: var(--radius-xl);
          padding: 3.5rem 3rem;
          color: #ffffff;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3rem;
          align-items: center;
          margin-top: 1rem;
          box-shadow: var(--shadow-xl);
        }

        .gain-left h3 {
          color: #ffffff;
          font-size: 1.65rem;
          margin-bottom: 1.5rem;
        }

        .gain-checklist {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .gain-checklist li {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          color: var(--gray-300);
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .check-icon {
          color: var(--success);
          flex-shrink: 0;
        }

        .gain-quote-card {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 2rem;
          border-radius: var(--radius-lg);
        }

        .quote-coffee {
          color: var(--accent);
          margin-bottom: 1rem;
        }

        .gain-quote {
          color: #ffffff;
          font-style: italic;
          font-size: 0.975rem;
          line-height: 1.65;
          margin-bottom: 1.5rem;
        }

        .quote-author strong {
          display: block;
          color: #ffffff;
          font-size: 0.925rem;
        }

        .quote-author span {
          color: var(--gray-400);
          font-size: 0.825rem;
        }

        @media (max-width: 1024px) {
          .about-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          .gain-banner {
            grid-template-columns: 1fr;
            padding: 2.5rem 2rem;
            gap: 2rem;
          }
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 3.5rem 1.25rem 2.5rem;
          }
          .hero-stats-bar {
            flex-direction: column;
            border-radius: var(--radius-lg);
            gap: 1.25rem;
            padding: 1.5rem;
            width: 100%;
          }
          .stat-divider {
            display: none;
          }
          .about-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
