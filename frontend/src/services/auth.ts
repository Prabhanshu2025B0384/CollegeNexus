import { api } from './api';
import type { AuthResponse, User } from '../types';

export const authService = {
  login: async (credentials: { username: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('username', response.username);
      localStorage.setItem('role', response.role);
    }
    return response;
  },

  getMe: async (): Promise<User> => {
    return api.get<User>('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
  },

  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  getUsername: (): string | null => {
    return localStorage.getItem('username');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};
