export interface EventFilters {
  search?: string;
  category?: string;
}

export interface RegistrationFilters {
  search?: string;
  eventId?: number;
  year?: string;
}

export const queryKeys = {
  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters?: EventFilters) =>
      [...queryKeys.events.lists(), filters ?? {}] as const,
    details: () => [...queryKeys.events.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.events.details(), id] as const,
    featured: () => [...queryKeys.events.all, 'featured'] as const,
    upcoming: (limit: number = 6) =>
      [...queryKeys.events.all, 'upcoming', limit] as const,
    categories: () => [...queryKeys.events.all, 'categories'] as const,
  },
  registrations: {
    all: ['registrations'] as const,
    lists: () => [...queryKeys.registrations.all, 'list'] as const,
    list: (filters?: RegistrationFilters) =>
      [...queryKeys.registrations.lists(), filters ?? {}] as const,
    byEvent: (eventId: number) =>
      [...queryKeys.registrations.all, 'byEvent', eventId] as const,
  },
  admin: {
    all: ['admin'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
    events: (filters?: EventFilters) =>
      [...queryKeys.admin.all, 'events', filters ?? {}] as const,
  },
} as const;
