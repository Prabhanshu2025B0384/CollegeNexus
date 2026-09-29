import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Shield, Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, logout, username } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="brand-logo" onClick={closeMenu}>
          <div className="brand-icon-wrapper">
            <Calendar className="brand-icon" size={22} />
          </div>
          <div className="brand-text">
            <span className="brand-title">CAMPUS CLUB</span>
            <span className="brand-subtitle">Event Management</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to="/events" className={`nav-link ${isActive('/events') ? 'active' : ''}`}>
            Events
          </Link>
          <a href="/#about-club" className="nav-link">
            About Us
          </a>

          {/* Admin Navigation */}
          {isAuthenticated ? (
            <div className="admin-nav-group">
              <Link
                to="/admin/dashboard"
                className={`btn btn-sm btn-secondary ${location.pathname.startsWith('/admin') ? 'active-admin' : ''}`}
              >
                <LayoutDashboard size={16} />
                Dashboard ({username})
              </Link>
              <button onClick={logout} className="btn btn-sm btn-danger" title="Log Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/admin/login" className="admin-portal-link" title="Club Admin Portal">
              <Shield size={16} />
              <span>Admin Portal</span>
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer">
          <Link to="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`} onClick={closeMenu}>
            Home
          </Link>
          <Link to="/events" className={`mobile-nav-link ${isActive('/events') ? 'active' : ''}`} onClick={closeMenu}>
            Browse All Events
          </Link>
          <a href="/#about-club" className="mobile-nav-link" onClick={closeMenu}>
            About Club
          </a>

          <div className="mobile-divider" />

          {isAuthenticated ? (
            <div className="mobile-admin-section">
              <p className="mobile-admin-label">Signed in as {username}</p>
              <Link to="/admin/dashboard" className="mobile-nav-link" onClick={closeMenu}>
                <LayoutDashboard size={18} />
                Admin Dashboard
              </Link>
              <Link to="/admin/events" className="mobile-nav-link" onClick={closeMenu}>
                Manage Events
              </Link>
              <Link to="/admin/registrations" className="mobile-nav-link" onClick={closeMenu}>
                Manage Registrations
              </Link>
              <button
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                className="btn btn-danger btn-sm mobile-logout-btn"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          ) : (
            <Link to="/admin/login" className="mobile-nav-link admin-highlight" onClick={closeMenu}>
              <Shield size={18} />
              Admin Portal Login
            </Link>
          )}
        </div>
      )}

      <style>{`
        .navbar-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
        }

        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0.85rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .brand-icon-wrapper {
          background: linear-gradient(135deg, var(--primary), #1d4ed8);
          color: #ffffff;
          padding: 0.5rem;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-title {
          font-family: var(--font-heading);
          font-weight: 800;
          font-size: 1.15rem;
          color: var(--navy-900);
          letter-spacing: -0.02em;
          line-height: 1.1;
        }

        .brand-subtitle {
          font-size: 0.75rem;
          color: var(--gray-500);
          font-weight: 500;
        }

        .desktop-nav {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .nav-link {
          color: var(--gray-600);
          font-weight: 600;
          font-size: 0.925rem;
          padding: 0.4rem 0.6rem;
          border-radius: var(--radius-sm);
          transition: color var(--transition-fast), background-color var(--transition-fast);
        }

        .nav-link:hover {
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .nav-link.active {
          color: var(--primary);
          background-color: var(--primary-light);
        }

        .admin-nav-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-left: 0.5rem;
        }

        .active-admin {
          background-color: var(--primary-light) !important;
          border-color: var(--primary-border) !important;
          color: var(--primary) !important;
        }

        .admin-portal-link {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--gray-500);
          font-size: 0.85rem;
          font-weight: 600;
          padding: 0.4rem 0.8rem;
          border-radius: var(--radius-full);
          border: 1px solid var(--gray-200);
          background-color: var(--gray-50);
          transition: all var(--transition-fast);
        }

        .admin-portal-link:hover {
          color: var(--navy-900);
          border-color: var(--gray-300);
          background-color: #ffffff;
        }

        .mobile-toggle-btn {
          display: none;
          color: var(--navy-900);
          padding: 0.4rem;
          border-radius: var(--radius-sm);
        }

        .mobile-nav-drawer {
          display: none;
          flex-direction: column;
          padding: 1rem 1.5rem 1.5rem;
          background: #ffffff;
          border-bottom: 1px solid var(--gray-200);
          box-shadow: var(--shadow-md);
          animation: drawerSlideDown var(--duration-fast) var(--ease-out);
        }

        @keyframes drawerSlideDown {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .mobile-nav-link {
          padding: 0.75rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: var(--navy-800);
          border-bottom: 1px solid var(--gray-100);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mobile-nav-link.active {
          color: var(--primary);
        }

        .mobile-divider {
          height: 1px;
          background: var(--gray-200);
          margin: 0.75rem 0;
        }

        .mobile-admin-section {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .mobile-admin-label {
          font-size: 0.75rem;
          color: var(--gray-500);
          font-weight: 600;
          text-transform: uppercase;
        }

        .mobile-logout-btn {
          margin-top: 0.5rem;
          align-self: flex-start;
        }

        .admin-highlight {
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .desktop-nav {
            display: none;
          }
          .mobile-toggle-btn {
            display: flex;
          }
          .mobile-nav-drawer {
            display: flex;
          }
        }
      `}</style>
    </header>
  );
};
