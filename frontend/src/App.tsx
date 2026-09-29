import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminEventsPage } from './pages/AdminEventsPage';
import { AdminRegistrationsPage } from './pages/AdminRegistrationsPage';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Public Student Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
