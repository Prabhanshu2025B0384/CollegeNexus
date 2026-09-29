import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Mail, MapPin, Phone, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Col 1: Club Info */}
          <div className="footer-col brand-col">
            <div className="footer-brand">
              <div className="footer-icon-wrap">
                <Calendar size={20} />
              </div>
              <span className="footer-title">CAMPUS CLUB</span>
            </div>
            <p className="footer-desc">
              Empowering college students through technology workshops, hackathons, sports tournaments,
              and cultural festivals. Build, connect, and thrive together.
            </p>
            <div className="footer-contact-items">
              <div className="contact-item">
                <MapPin size={15} />
                <span>Student Activity Center, North Campus</span>
              </div>
              <div className="contact-item">
                <Mail size={15} />
                <span>events@collegeclub.edu</span>
              </div>
              <div className="contact-item">
                <Phone size={15} />
                <span>+1 (555) 234-5678</span>
              </div>
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/events">Browse Events</Link></li>
              <li><a href="/#featured-section">Featured Events</a></li>
              <li><a href="/#about-club">About the Club</a></li>
              <li><Link to="/admin/login">Admin Sign In</Link></li>
            </ul>
          </div>

          {/* Col 3: Event Categories */}
          <div className="footer-col">
            <h4 className="footer-heading">Event Categories</h4>
            <ul className="footer-links">
              <li><Link to="/events?category=Hackathon">Hackathons & Coding</Link></li>
              <li><Link to="/events?category=Workshop">Technical Workshops</Link></li>
              <li><Link to="/events?category=Cultural">Cultural Festivals</Link></li>
              <li><Link to="/events?category=Sports">Sports Tournaments</Link></li>
              <li><Link to="/events?category=Career">Career & Networking</Link></li>
            </ul>
          </div>

          {/* Col 4: Platform & Admin */}
          <div className="footer-col">
            <h4 className="footer-heading">Administration</h4>
            <p className="footer-subtext">
              Event organizers and faculty coordinators can access the administrative console to schedule
              new sessions and manage participant rosters.
            </p>
            <Link to="/admin/login" className="btn btn-secondary btn-sm footer-admin-btn">
              <Shield size={14} />
              Admin Portal
            </Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} College Club Event Management Platform. Built for collegiate innovation.
          </p>
          <div className="footer-badge-link">
            <span>Powered by Spring Boot + React + Supabase</span>
          </div>
        </div>
      </div>

      <style>{`
        .footer-section {
          background-color: var(--navy-900);
          color: #ffffff;
          border-top: 1px solid var(--navy-800);
          margin-top: auto;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3.5rem 1.5rem 2rem;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 2.5rem;
          margin-bottom: 2.5rem;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1rem;
        }

        .footer-icon-wrap {
          background: var(--primary);
          color: #ffffff;
          padding: 0.4rem;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-title {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.15rem;
          letter-spacing: -0.02em;
        }

        .footer-desc {
          color: var(--gray-400);
          font-size: 0.875rem;
          line-height: 1.6;
          margin-bottom: 1.25rem;
        }

        .footer-contact-items {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .contact-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: var(--gray-400);
          font-size: 0.825rem;
        }

        .footer-heading {
          color: #ffffff;
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 1.2rem;
          letter-spacing: 0.02em;
        }

        .footer-links {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .footer-links a {
          color: var(--gray-400);
          font-size: 0.875rem;
          transition: color var(--transition-fast);
        }

        .footer-links a:hover {
          color: #ffffff;
        }

        .footer-subtext {
          color: var(--gray-400);
          font-size: 0.85rem;
          line-height: 1.6;
          margin-bottom: 1rem;
        }

        .footer-admin-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: var(--navy-800);
          color: #ffffff;
          border-color: var(--navy-700);
        }

        .footer-admin-btn:hover {
          background: var(--navy-700);
        }

        .footer-bottom {
          padding-top: 2rem;
          border-top: 1px solid var(--navy-800);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .copyright-text {
          color: var(--gray-500);
          font-size: 0.825rem;
        }

        .footer-badge-link {
          font-size: 0.775rem;
          color: var(--gray-400);
          background-color: var(--navy-800);
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--navy-700);
        }

        @media (max-width: 900px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
        }

        @media (max-width: 600px) {
          .footer-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </footer>
  );
};
