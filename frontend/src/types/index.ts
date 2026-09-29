export interface Event {
  id: number;
  title: string;
  description: string;
  category: string;
  eventDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  venue: string;
  featured: boolean;
  registrationOpen: boolean;
  imageUrl?: string;
  maxCapacity?: number;
  registrationCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Registration {
  id: number;
  eventId: number;
  eventTitle: string;
  eventCategory?: string;
  name: string;
  email: string;
  college: string;
  year: string;
  phone: string;
  registeredAt: string;
}

export interface RegistrationFormData {
  name: string;
  email: string;
  college: string;
  year: string;
  phone: string;
}

export interface EventFormData {
  title: string;
  description: string;
  category: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  featured: boolean;
  registrationOpen: boolean;
  imageUrl?: string;
  maxCapacity?: number;
}

export interface DashboardStats {
  totalEvents: number;
  upcomingEvents: number;
  totalRegistrations: number;
  featuredEvent: Event | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  username: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
