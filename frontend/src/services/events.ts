import { api } from './api';
import type { ApiResponse, Event, EventFormData } from '../types';

export const eventService = {
  getAllEvents: async (search?: string, category?: string): Promise<Event[]> => {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (category && category.trim() && category !== 'All') {
      params.append('category', category.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Event[]>(`/events${query}`);
  },

  getEventById: async (id: number): Promise<Event> => {
    return api.get<Event>(`/events/${id}`);
  },

  getFeaturedEvent: async (): Promise<Event | null> => {
    try {
      const res = await api.get<Event | null>('/events/featured');
      return res && res.id ? res : null;
    } catch {
      return null;
    }
  },

  getUpcomingEvents: async (limit: number = 6): Promise<Event[]> => {
    return api.get<Event[]>(`/events/upcoming?limit=${limit}`);
  },

  getCategories: async (): Promise<string[]> => {
    return api.get<string[]>('/events/categories');
  },

  // Admin APIs
  adminGetAllEvents: async (search?: string, category?: string): Promise<Event[]> => {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (category && category.trim() && category !== 'All') {
      params.append('category', category.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Event[]>(`/admin/events${query}`);
  },

  createEvent: async (data: EventFormData): Promise<ApiResponse<Event>> => {
    return api.post<ApiResponse<Event>>('/admin/events', data);
  },

  updateEvent: async (id: number, data: EventFormData): Promise<ApiResponse<Event>> => {
    return api.put<ApiResponse<Event>>(`/admin/events/${id}`, data);
  },

  deleteEvent: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/admin/events/${id}`);
  },

  uploadEventImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
    const response = await fetch(`${BASE_URL}/admin/events/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Failed to upload image to Supabase Storage');
    }

    const result = await response.json();
    return result.data.imageUrl;
  },
};
