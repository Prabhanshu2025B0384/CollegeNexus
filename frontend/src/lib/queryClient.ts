import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 5 minutes default fresh time for server state
      staleTime: 5 * 60 * 1000,
      // Keep inactive queries in memory for 15 minutes
      gcTime: 15 * 60 * 1000,
      // Do not aggressive refetch on window focus to prevent disruptive UI shifts
      refetchOnWindowFocus: false,
      // Retry once on failure before throwing
      retry: 1,
      // Keep previous data when key changes where appropriate
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Security: Clear private admin queries from cache on logout or authentication change
 * to prevent any cross-session data leakage.
 */
export const clearPrivateCache = () => {
  queryClient.removeQueries({ queryKey: ['admin'] });
  queryClient.removeQueries({ queryKey: ['registrations'] });
};
