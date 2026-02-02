// Unified API Client with error handling, interceptors, and retry logic
import type { BackendError } from '@/types/api';

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  getAuthToken?: () => string | null;
  onUnauthorized?: () => void;
  onError?: (error: BackendError) => void;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipErrorHandling?: boolean;
  retries?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,
    public originalError?: Error
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private config: Required<ApiClientConfig>;
  private abortControllers = new Map<string, AbortController>();

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      getAuthToken: () => localStorage.getItem('auth_token'),
      onUnauthorized: () => {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      },
      onError: (error) => {
        console.error('API Error:', error);
      },
      ...config,
    };
  }

  /**
   * Get request headers with authentication
   */
  private getHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Merge existing headers
    if (options.headers) {
      const existingHeaders = options.headers as Record<string, string>;
      Object.keys(existingHeaders).forEach((key) => {
        const value = existingHeaders[key];
        if (value !== undefined) {
          headers[key] = value;
        }
      });
    }

    // Add auth token if available and not skipped
    if (!options.skipAuth) {
      const token = this.config.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  /**
   * Create abort controller for request cancellation
   */
  private createAbortController(key: string, signal?: AbortSignal): AbortController {
    const controller = new AbortController();
    this.abortControllers.set(key, controller);

    // Combine with external signal if provided
    if (signal) {
      signal.addEventListener('abort', () => controller.abort());
    }

    return controller;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: ApiError): boolean {
    // Retry on network errors or 5xx server errors
    return (
      !error.status ||
      (error.status >= 500 && error.status < 600) ||
      error.status === 408 || // Request Timeout
      error.status === 429 // Too Many Requests
    );
  }

  /**
   * Handle API response errors
   */
  private async handleError(response: Response): Promise<never> {
    let errorData: unknown;
    const contentType = response.headers.get('content-type');

    try {
      if (contentType?.includes('application/json')) {
        errorData = await response.json();
      } else {
        errorData = await response.text();
      }
    } catch {
      errorData = response.statusText;
    }

    const error = new ApiError(response.status, response.statusText, errorData);

    // Handle specific error cases
    if (response.status === 401) {
      this.config.onUnauthorized?.();
    }

    if (!this.config.onError) {
      throw error;
    }

    this.config.onError({
      status: response.status,
      statusText: response.statusText,
      data: errorData,
      message: error.message,
    });

    throw error;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    const maxRetries = options.retries ?? this.config.retries;
    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const requestKey = `${endpoint}-${Date.now()}-${attempt}`;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      try {
        // Create main abort controller
        const controller = this.createAbortController(requestKey, options.signal ?? undefined);

        // Create timeout controller
        const timeoutController = new AbortController();
        timeoutId = setTimeout(() => timeoutController.abort(), this.config.timeout);

        // Combine signals - listen to timeout and abort main controller
        timeoutController.signal.addEventListener('abort', () => {
          controller.abort();
        });

        // Use the controller's signal
        const combinedSignal = controller.signal;

        const response = await fetch(url, {
          ...options,
          headers: this.getHeaders(options),
          signal: combinedSignal,
        });

        if (timeoutId) {
          clearTimeout(timeoutId);
        }

        // Clean up abort controller on success
        this.abortControllers.delete(requestKey);

        if (!response.ok) {
          await this.handleError(response);
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          return (await response.json()) as T;
        } else {
          return (await response.text()) as T;
        }
      } catch (error) {
        // Clean up timeout and abort controller
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this.abortControllers.delete(requestKey);

        if (error instanceof ApiError) {
          lastError = error;

          // Don't retry on client errors (4xx) except specific cases
          if (
            error.status >= 400 &&
            error.status < 500 &&
            error.status !== 408 &&
            error.status !== 429
          ) {
            throw error;
          }

          // Retry if retryable and attempts remaining
          if (this.isRetryableError(error) && attempt < maxRetries) {
            const delay = this.config.retryDelay * Math.pow(2, attempt);
            await this.sleep(delay);
            continue;
          }
        } else if (error instanceof Error) {
          // Network or other errors
          lastError = new ApiError(0, error.message, undefined, error);
          if (attempt < maxRetries) {
            const delay = this.config.retryDelay * Math.pow(2, attempt);
            await this.sleep(delay);
            continue;
          }
        }

        throw error;
      }
    }

    throw lastError || new ApiError(0, 'Request failed after retries');
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Cancel a specific request
   */
  cancelRequest(key: string): void {
    const controller = this.abortControllers.get(key);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(key);
    }
  }

  /**
   * Cancel all pending requests
   */
  cancelAllRequests(): void {
    this.abortControllers.forEach((controller) => controller.abort());
    this.abortControllers.clear();
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null): void {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  /**
   * Get current authentication token
   */
  getAuthToken(): string | null {
    return this.config.getAuthToken();
  }
}