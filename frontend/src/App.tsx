import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { EventsPage } from './pages/EventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ColdStartBanner } from './components/ColdStartBanner';
import { ScrollToTop } from './components/ScrollToTop';

// Route Code Splitting: Lazy-load admin modules to keep public student bundle lightweight
const AdminLoginPage = lazy(() =>
  import('./pages/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminEventsPage = lazy(() =>
  import('./pages/AdminEventsPage').then((m) => ({ default: m.AdminEventsPage }))
);
const AdminRegistrationsPage = lazy(() =>
  import('./pages/AdminRegistrationsPage').then((m) => ({ default: m.AdminRegistrationsPage }))
);

const AppContent: React.FC = () => {
  const location = useLocation();

  return (
    <div className="app-container">
      <ScrollToTop />
      <ColdStartBanner />
      <Navbar />
      <main className="main-content">
        <div key={location.pathname} className="route-page-container">
          <Suspense fallback={<LoadingSpinner message="Loading campus portal..." />}>
            <Routes>
              {/* Public Student Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />

              {/* Lazy-Loaded Admin Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin/events" element={<AdminEventsPage />} />
              <Route path="/admin/registrations" element={<AdminRegistrationsPage />} />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;

