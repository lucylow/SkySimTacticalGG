// API-related types

export interface BackendError {
  status: number;
  statusText: string;
  data?: unknown;
  message: string;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: boolean;
    redis: boolean;
    kafka?: boolean;
    ml_models?: boolean;
  };
  version?: string;
}

export interface WebSocketMessage {
  event: string;
  data: unknown;
  timestamp?: string;
  job_id?: string;
  run_id?: string;
}


