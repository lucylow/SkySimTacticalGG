// Environment configuration management
export interface AppConfig {
  apiBaseUrl: string;
  wsBaseUrl: string;
  enableSampleData: boolean;
  enableDevTools: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Get API base URL from environment or default
 */
function getApiBaseUrl(): string {
  // Check for explicit API URL
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  }

  // Check for API base URL
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (apiBaseUrl) {
    return apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
  }

  // Default to localhost
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const hostname = window.location.hostname;
  const port = import.meta.env.DEV ? '8000' : window.location.port || '';
  const defaultUrl = port ? `${protocol}//${hostname}:${port}/api/v1` : `${protocol}//${hostname}/api/v1`;
  
  return defaultUrl;
}

/**
 * Get WebSocket base URL from environment or derive from API URL
 */
function getWsBaseUrl(): string {
  const wsUrl = import.meta.env.VITE_WS_URL;
  if (wsUrl) {
    return wsUrl;
  }

  // Derive from API URL but normalize to origin (no path)
  try {
    const apiUrl = new URL(getApiBaseUrl());
    const isSecure = apiUrl.protocol === 'https:';
    return `${isSecure ? 'wss:' : 'ws:'}//${apiUrl.host}`;
  } catch (_e) {
    // Fallback to window location
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost';
    return `${isSecure ? 'wss:' : 'ws:'}//${host}`;
  }
}

/**
 * Application configuration
 */
export const config: AppConfig = {
  apiBaseUrl: getApiBaseUrl(),
  wsBaseUrl: getWsBaseUrl(),
  // Default to Sample mode when critical envs are missing (e.g., no Supabase URL),
  // unless explicitly disabled with VITE_ENABLE_Sample_DATA="false"
  enableSampleData: (
    import.meta.env.VITE_ENABLE_Sample_DATA === 'true' ||
    (!import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_ENABLE_Sample_DATA !== 'false')
  ),
  enableDevTools: import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
  logLevel: (import.meta.env.VITE_LOG_LEVEL as AppConfig['logLevel']) || 'info',
};

/**
 * Validate configuration
 */
export function validateConfig(): void {
  if (!config.apiBaseUrl) {
    console.warn('API base URL not configured. Using default.');
  }

  if (config.enableSampleData) {
    console.info('Sample data mode enabled. API calls will use Sample data.');
  }
}

// Validate on import
if (typeof window !== 'undefined') {
  validateConfig();
}



