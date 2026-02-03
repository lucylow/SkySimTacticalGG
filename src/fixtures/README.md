# Mock Data Bundle

Comprehensive mock data for AI agent frontend demos.

## Quick Start

```typescript
// Import everything from central index
import { DEMO, playReplay, samplePrompts } from '@/mocks';

// Access demo data
console.log(DEMO.products.length); // 200 products
console.log(DEMO.users.length);    // 8 users  
console.log(DEMO.sessions.length); // 5 agent sessions
```

## Available Modules

### Core Data (`generator.ts`)
- `DEMO` - Pre-generated deterministic payload
- `generateProducts(count)` - Generate product catalog
- `generateUsers(count)` - Generate user profiles
- `generateAgentSession(user, products, index)` - Generate agent session

### SSE Replay (`sseReplayEvents.ts`)
- `sseReplayEvents` - Standard replay events
- `extendedReplayEvents` - Extended replay with more tools

### Replay Utilities (`replaySessionPlayer.ts`)
```typescript
import { playReplay } from '@/mocks';

const cancel = playReplay((event) => {
  console.log(event.type, event.data);
}, { speed: 1.5 });

// Later: cancel();
```

### Tool Responses (`toolResponses.ts`)
```typescript
import { analyzeCatalogTool, DEMO } from '@/mocks';

const result = analyzeCatalogTool(DEMO.products, { top: 3 });
```

### Sample Prompts (`samplePrompts.ts`)
```typescript
import { samplePrompts, getRandomPrompt } from '@/mocks';

const prompt = getRandomPrompt();
console.log(prompt.label, prompt.prompt);
```

### Analytics Fixtures (`analyticsFixtures.ts`)
- `analyticsSnapshot` - Daily metrics, funnel, cohorts
- `performanceMetrics` - Team/player performance data
- `agentUsageMetrics` - Agent usage statistics

### UI Fixtures (`uiFixtures.ts`)
- `microcopySuggestions` - Sample microcopy
- `heroVariants` - Hero section variants
- `errorMessages` - Error message templates
- `loadingStates` - Loading state messages
- `accessibilityLabels` - ARIA labels for streaming

### Session Helpers (`demoSessions.ts`)
```typescript
import { getAllSessions, searchProducts, getTopProducts } from '@/mocks';

const sessions = getAllSessions();
const electronics = searchProducts('Electronics');
const topRated = getTopProducts(5);
```

## Demo Scenarios

1. **Catalog Audit** - Run catalog analysis prompt, watch SSE stream
2. **Tool Interaction** - Trigger tools from Toolbox, view results
3. **Replay Mode** - Replay recorded sessions with timing
4. **Team Analysis** - Generate team performance reports

## Deterministic Seed

All data uses seed `demo-seed-2026` for reproducible demos.
