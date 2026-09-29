import { api } from './api';
import type { ApiResponse, DashboardStats, Registration, RegistrationFormData } from '../types';

export const registrationService = {
  registerForEvent: async (
    eventId: number,
    data: RegistrationFormData
  ): Promise<ApiResponse<Registration>> => {
    return api.post<ApiResponse<Registration>>(`/events/${eventId}/registrations`, data);
  },

  // Admin APIs
  getRegistrations: async (
    search?: string,
    eventId?: number,
    year?: string
  ): Promise<Registration[]> => {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    if (eventId) {
      params.append('eventId', eventId.toString());
    }
    if (year && year.trim() && year !== 'All') {
      params.append('year', year.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return api.get<Registration[]>(`/admin/registrations${query}`);
  },

  deleteRegistration: async (id: number): Promise<ApiResponse<void>> => {
    return api.delete<ApiResponse<void>>(`/admin/registrations/${id}`);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    return api.get<DashboardStats>('/admin/dashboard/stats');
  },
};
