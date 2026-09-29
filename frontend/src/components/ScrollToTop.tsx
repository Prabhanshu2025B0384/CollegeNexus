import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const SCROLL_STORAGE_KEY = 'collegenexus_scroll_positions';

const getStoredPositions = (): Record<string, number> => {
  try {
    const raw = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveStoredPosition = (key: string, y: number) => {
  try {
    const positions = getStoredPositions();
    positions[key] = y;
    sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify(positions));
  } catch {
    // Gracefully ignore storage quota or private browsing errors
  }
};

/**
 * Global Scroll Restoration and Route Scroll-to-Top Handler
 *
 * Rules:
 * 1. Normal route transitions (PUSH) immediately start at the top (scroll = 0).
 * 2. Instant scroll behavior is enforced to eliminate weird visual jumping.
 * 3. Browser Back / Forward navigation (POP) restores the user's previous scroll position.
 * 4. Modal dialogs do not trigger route changes and do not reset page scroll.
 * 5. Hash anchors (e.g. #about-club) scroll to the target element.
 * 6. Query parameter updates on the same pathname (e.g. search/filter) preserve scroll.
 */
export const ScrollToTop: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType();

  // In-memory cache of scroll positions keyed by history entry key
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const prevKeyRef = useRef<string>(location.key);
  const prevPathnameRef = useRef<string>(location.pathname);

  // Initialize in-memory cache with session storage
  useEffect(() => {
    const stored = getStoredPositions();
    Object.entries(stored).forEach(([key, y]) => {
      scrollPositions.current.set(key, y);
    });

    // Disable browser's native automatic scroll restoration so it doesn't fight our SPA logic
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  // Save current scroll position continuously (throttled via requestAnimationFrame)
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY;
          scrollPositions.current.set(location.key, currentY);
          saveStoredPosition(location.key, currentY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key]);

  // Execute scroll adjustment on navigation
  useEffect(() => {
    const instantScrollTo = (top: number, left = 0) => {
      const html = document.documentElement;
      const originalBehavior = html.style.scrollBehavior;
      html.style.scrollBehavior = 'auto';

      window.scrollTo({
        top,
        left,
        behavior: 'instant' as ScrollBehavior,
      });

      window.requestAnimationFrame(() => {
        html.style.scrollBehavior = originalBehavior;
      });
    };

    // 1. If anchor hash exists (e.g. #about-club), scroll to that element
    if (location.hash) {
      const elementId = location.hash.replace('#', '');
      const element = document.getElementById(elementId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        prevKeyRef.current = location.key;
        prevPathnameRef.current = location.pathname;
        return;
      }
    }

    // 2. Browser Back / Forward (POP)
    if (navigationType === 'POP') {
      const savedY = scrollPositions.current.get(location.key) ?? getStoredPositions()[location.key];
      if (typeof savedY === 'number') {
        instantScrollTo(savedY);

        // Double RAF handles async rendered layouts (e.g. TanStack query data arriving)
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            instantScrollTo(savedY);
          });
        });
      } else {
        instantScrollTo(0);
      }
    }
    // 3. New Route Navigation (PUSH)
    else if (navigationType === 'PUSH') {
      instantScrollTo(0);
    }
    // 4. Redirects or Query Updates (REPLACE)
    else if (navigationType === 'REPLACE') {
      // Only scroll to top if the actual pathname changed (e.g. redirect /admin -> /admin/dashboard)
      if (location.pathname !== prevPathnameRef.current) {
        instantScrollTo(0);
      }
      // If pathname did NOT change (e.g. typing in search filter), keep current position
    }

    prevKeyRef.current = location.key;
    prevPathnameRef.current = location.pathname;
  }, [location.pathname, location.search, location.hash, location.key, navigationType]);

  return null;
};

export default ScrollToTop;
