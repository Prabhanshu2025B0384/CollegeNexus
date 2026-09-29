// Centralized API client with environment-variable configuration
// DO NOT hardcode backend or deployment URLs here.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(message: string, status: number, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions extends RequestInit {
  data?: unknown;
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const config: RequestInit = {
    ...restOptions,
    headers,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    if (response.status === 204) {
      return {} as T;
    }

    let responseData: any = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = text ? { message: text } : null;
    }

    if (!response.ok) {
      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        `Request failed with status ${response.status} (${response.statusText})`;
      const details = responseData?.details;
      throw new ApiError(errorMessage, response.status, details);
    }

    return responseData as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network errors or offline backend
    throw new ApiError(
      'Unable to connect to the server. Please check your internet connection or verify the backend service is running.',
      0
    );
  }
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'GET', headers }),

  post: <T>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', data, headers }),

  put: <T>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PUT', data, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),
};
