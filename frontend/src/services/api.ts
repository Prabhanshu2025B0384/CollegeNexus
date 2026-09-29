// Centralized API client with environment-variable configuration
// Optimized for Render Free cold starts and reliable error categorization.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const DEFAULT_TIMEOUT_MS = 45000; // 45s timeout accommodates Render Free spin-up without timing out prematurely
const COLD_START_THRESHOLD_MS = 3500; // After 3.5s of waiting, notify UI that server is starting up

export class ApiError extends Error {
  status: number;
  details?: string[];
  isTimeout?: boolean;

  constructor(message: string, status: number, details?: string[], isTimeout: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.isTimeout = isTimeout;
  }
}

interface RequestOptions extends RequestInit {
  data?: unknown;
  timeoutMs?: number;
}

// Active in-flight requests count for cold-start tracking
let inFlightLongRequests = 0;

function notifyColdStart(active: boolean) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('render-cold-start', { detail: { isColdStarting: active } })
    );
  }
}

export async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { data, headers: customHeaders, timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...restOptions } = options;

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

  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const controller = new AbortController();
  let timedOut = false;
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort('timeout');
  }, timeoutMs);

  // Trigger cold-start notification if request takes longer than threshold
  let coldStartTriggered = false;
  const coldStartTimer = setTimeout(() => {
    coldStartTriggered = true;
    inFlightLongRequests++;
    notifyColdStart(true);
  }, COLD_START_THRESHOLD_MS);

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort());
  }

  const config: RequestInit = {
    ...restOptions,
    headers,
    signal: controller.signal,
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, config);

    clearTimeout(timeoutId);
    clearTimeout(coldStartTimer);
    if (coldStartTriggered) {
      inFlightLongRequests = Math.max(0, inFlightLongRequests - 1);
      if (inFlightLongRequests === 0) {
        notifyColdStart(false);
      }
    }

    // Performance observability: track slow requests without exposing data
    const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startTime;
    if (elapsed > 2500 && import.meta.env.DEV) {
      console.warn(`[API Performance] Slow response: ${options.method || 'GET'} ${endpoint} (${Math.round(elapsed)}ms)`);
    }

    if (response.status === 204) {
      return null as unknown as T;
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
      // If 401 unauthenticated, clear invalid credentials
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
      }

      const errorMessage =
        responseData?.message ||
        responseData?.error ||
        `Request failed with status ${response.status} (${response.statusText})`;
      const details = responseData?.details;
      throw new ApiError(errorMessage, response.status, details);
    }

    return responseData as T;
  } catch (err: any) {
    clearTimeout(timeoutId);
    clearTimeout(coldStartTimer);
    if (coldStartTriggered) {
      inFlightLongRequests = Math.max(0, inFlightLongRequests - 1);
      if (inFlightLongRequests === 0) {
        notifyColdStart(false);
      }
    }

    if (err instanceof ApiError) {
      throw err;
    }

    // Handle client-side intentional abort (e.g., search cancellation or component unmount)
    if (externalSignal?.aborted || (controller.signal.aborted && !timedOut && controller.signal.reason !== 'timeout')) {
      throw new DOMException('Request aborted by client', 'AbortError');
    }

    if (timedOut || controller.signal.reason === 'timeout') {
      throw new ApiError(
        'The server took too long to respond. Render Free services may be starting up — please retry.',
        408,
        undefined,
        true
      );
    }

    // Network error or offline
    throw new ApiError(
      'Unable to connect to the server. Please check your internet connection or verify the service is running.',
      0
    );
  }
}

export const api = {
  get: <T>(endpoint: string, headers?: Record<string, string>, signal?: AbortSignal) =>
    request<T>(endpoint, { method: 'GET', headers, signal }),

  post: <T>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'POST', data, headers }),

  put: <T>(endpoint: string, data?: unknown, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'PUT', data, headers }),

  delete: <T>(endpoint: string, headers?: Record<string, string>) =>
    request<T>(endpoint, { method: 'DELETE', headers }),
};
