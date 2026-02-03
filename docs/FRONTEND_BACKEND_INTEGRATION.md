# Frontend-Backend Integration Guide

This document describes the improved frontend-backend integration architecture.

## Overview

The integration has been refactored to provide:

- **Unified API Client**: Centralized HTTP client with error handling, retry logic, and authentication
- **Type Safety**: TypeScript types aligned with backend FastAPI schemas
- **WebSocket Integration**: Improved WebSocket hook with automatic reconnection and error handling
- **Environment Configuration**: Centralized configuration management
- **Error Recovery**: Automatic retry with exponential backoff

## Architecture

### API Client (`src/lib/apiClient.ts`)

The `ApiClient` class provides a unified interface for all HTTP requests:

```typescript
import { ApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

const apiClient = new ApiClient({
  baseUrl: config.apiBaseUrl,
  getAuthToken: () => localStorage.getItem('auth_token'),
  onUnauthorized: () => {
    // Handle unauthorized access
  },
  onError: (error) => {
    // Handle errors
  },
});

// Make requests
const data = await apiClient.get('/endpoint');
const result = await apiClient.post('/endpoint', { data });
```

**Features:**

- Automatic authentication token injection
- Request timeout handling
- Retry logic with exponential backoff
- Error handling and recovery
- Request cancellation support

### Unified API Service (`src/services/unifiedApi.ts`)

The `UnifiedBackendApi` class provides type-safe methods for backend endpoints:

```typescript
import { unifiedApi } from '@/services/unifiedApi';

// Agent data endpoints
const runs = await unifiedApi.listAgentRuns({ agent_name: 'analyzer', limit: 10 });
const run = await unifiedApi.getAgentRun(runId);

// Human review endpoints
const reviews = await unifiedApi.listPendingReviews(50);
await unifiedApi.reviewAction(reviewId, 'approve', { final_result: result });

// Predictions endpoints
const wallet = await unifiedApi.getWallet();
const markets = await unifiedApi.listMarkets({ status: 'open' });
const prediction = await unifiedApi.createPrediction({
  market_id: 1,
  selection: 'team_a',
  stake: 100,
});

// Analytics endpoints
const correlations = await unifiedApi.getTopCorrelations({ limit: 20, significant_only: true });
const featureCorrelations = await unifiedApi.getCorrelationsByFeature('advance_count');

// Orchestration
const { job_id } = await unifiedApi.startOrchestration({ match_id: 'match123' });
```

### Configuration (`src/lib/config.ts`)

Centralized configuration management:

```typescript
import { config } from '@/lib/config';

// Access configuration
config.apiBaseUrl; // API base URL
config.wsBaseUrl; // WebSocket base URL
config.enableSampleData; // Sample data flag
```

**Environment Variables:**

- `VITE_API_URL` - API base URL (default: derived from current host)
- `VITE_API_BASE_URL` - Alternative API base URL
- `VITE_WS_URL` - WebSocket URL (default: derived from API URL)
- `VITE_ENABLE_Sample_DATA` - Enable Sample data mode
- `VITE_LOG_LEVEL` - Logging level (debug, info, warn, error)

### WebSocket Integration (`src/hooks/useWebSocket.ts`)

Improved WebSocket hook with automatic reconnection:

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
import { unifiedApi } from '@/services/unifiedApi';

const { isConnected, sendMessage, lastMessage, messageHistory } = useWebSocket(
  unifiedApi.getWebSocketUrl(),
  {
    onMessage: (message) => {
      console.log('Received:', message);
    },
    onConnect: () => {
      console.log('Connected');
    },
    onDisconnect: () => {
      console.log('Disconnected');
    },
    reconnectInterval: 5000,
    maxRetries: 5,
  }
);
```

**Features:**

- Automatic reconnection with exponential backoff
- Message queuing during connection
- Connection state tracking
- Error handling

## Backend Endpoints

### Agent Data Endpoints

- `POST /api/v1/data/runs` - Create agent run
- `GET /api/v1/data/runs/{run_id}` - Get agent run
- `GET /api/v1/data/runs` - List agent runs
- `GET /api/v1/data/artifacts/{artifact_id}` - Get artifact

### Human Review Endpoints

- `POST /api/v1/reviews/create` - Create review
- `GET /api/v1/reviews/pending` - List pending reviews
- `GET /api/v1/reviews/{review_id}` - Get review
- `POST /api/v1/reviews/{review_id}/comment` - Add comment
- `POST /api/v1/reviews/{review_id}/action` - Take action (approve/reject/etc)

### Predictions Endpoints

- `GET /predictions/wallet` - Get user wallet
- `POST /predictions/wallet/topup` - Top up wallet
- `GET /predictions/wallet/transactions` - Get transactions
- `GET /predictions/markets` - List markets
- `GET /predictions/markets/{id}` - Get market
- `POST /predictions/predictions` - Create prediction
- `GET /predictions/predictions` - List predictions
- `GET /predictions/predictions/{id}` - Get prediction
- `POST /predictions/predictions/{id}/cancel` - Cancel prediction
- `GET /predictions/stats` - Get statistics
- `GET /predictions/dashboard` - Get dashboard data
- `GET /predictions/leaderboard` - Get leaderboard
- `POST /predictions/markets/{id}/settle` - Settle market (admin)

### Analytics Endpoints

- `GET /api/v1/analytics/top-correlations` - Get top correlations
- `GET /api/v1/analytics/correlations/by-feature/{feature}` - Get correlations by feature
- `POST /api/v1/analytics/run-analysis` - Run analysis job
- `GET /api/v1/analytics/stats/summary` - Get stats summary
- `GET /api/v1/analytics/health` - Analytics health check

### Orchestration

- `POST /api/v1/orchestrate` - Start orchestration

### WebSocket Endpoints

- `WS /ws/agents` - Agent events and progress
- `WS /ws/replay` - Replay events

## Error Handling

The API client provides comprehensive error handling:

```typescript
try {
  const data = await unifiedApi.getAgentRun(runId);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.statusText);
    // Handle specific error codes
    if (error.status === 401) {
      // Unauthorized - redirect to login
    } else if (error.status === 404) {
      // Not found
    } else if (error.status >= 500) {
      // Server error - retry automatically
    }
  }
}
```

## Migration Guide

### Replacing Direct Fetch/Axios Calls

**Before:**

```typescript
const response = await fetch(`${baseUrl}/endpoint`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();
```

**After:**

```typescript
import { unifiedApi } from '@/services/unifiedApi';
const data = await unifiedApi.getAgentRun(runId);
```

### Replacing WebSocket Connections

**Before:**

```typescript
const ws = new WebSocket(url);
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Handle message
};
```

**After:**

```typescript
import { useWebSocket } from '@/hooks/useWebSocket';
const { isConnected, lastMessage } = useWebSocket(url, {
  onMessage: (message) => {
    // Handle message
  },
});
```

## Best Practices

1. **Always use the unified API service** instead of direct fetch/axios calls
2. **Use TypeScript types** from `@/types/backend` for type safety
3. **Handle errors appropriately** - use try/catch and check error types
4. **Use WebSocket hook** for real-time updates instead of manual WebSocket management
5. **Configure environment variables** for different environments (dev, staging, prod)

## Testing

The integration supports Sample data mode for development:

```bash
# Enable Sample data
VITE_ENABLE_Sample_DATA=true npm run dev
```

In Sample mode, API calls will use Sample data instead of real backend endpoints.

## Troubleshooting

### Connection Issues

1. Check `VITE_API_URL` environment variable
2. Verify backend is running and accessible
3. Check CORS configuration in backend
4. Review browser console for errors

### Authentication Issues

1. Verify token is stored in localStorage
2. Check token expiration
3. Review `onUnauthorized` callback

### WebSocket Issues

1. Verify WebSocket URL is correct
2. Check backend WebSocket endpoint is accessible
3. Review connection state in hook
4. Check for firewall/proxy issues

