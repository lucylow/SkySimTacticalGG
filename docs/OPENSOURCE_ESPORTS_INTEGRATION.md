# Open Source Esports Data Integration

This document describes the open source esports data integration that extends the GRID Open Access platform with additional free and open data sources.

## Overview

The open source esports data integration adds support for multiple free and open esports data APIs on top of GRID:

- **Riot Games API**: League of Legends, Valorant, Teamfight Tactics
- **OpenDota API**: Dota 2 match data and statistics
- **Liquipedia API**: Tournament data and match history
- **Pandascore API**: Additional esports data (free tier)

All data from these sources is normalized using the same canonical event format as GRID, ensuring seamless integration with existing analytics, agents, and visualization systems.

## Architecture

```
┌─────────────────┐
│   GRID API      │
└────────┬────────┘
         │
         ├─────────────────────────────────┐
         │                                 │
┌────────▼────────┐              ┌────────▼────────┐
│  GRID Client    │              │ Open Source     │
│  (WebSocket)    │              │ Esports Client  │
└────────┬────────┘              │ (REST Polling)  │
         │                       └────────┬────────┘
         │                                 │
         └────────────┬───────────────────┘
                      │
              ┌───────▼────────┐
              │ Unified        │
              │ Ingestion      │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Event          │
              │ Normalizer     │
              └───────┬────────┘
                      │
              ┌───────▼────────┐
              │ Canonical      │
              │ Event Stream   │
              └────────────────┘
```

## Components

### Backend

#### `opensource_esports_client.py`

Main client for open source esports APIs:

- `RiotGamesClient`: Riot Games API integration
- `OpenDotaClient`: OpenDota API integration
- `LiquipediaClient`: Liquipedia API integration
- `OpenSourceEsportsClient`: Unified client that aggregates all sources

#### `unified_ingest.py`

Unified ingestion service that combines:

- GRID WebSocket stream
- Open source API polling
- Backfill capabilities

#### `api_opensource.py`

REST API endpoints for:

- Live matches from all sources
- Match details
- Source-specific endpoints
- Backfill operations

### Frontend

#### `opensourceEsportsClient.ts`

TypeScript client for open source esports APIs:

- `RiotGamesClient`: Frontend Riot API client
- `OpenDotaClient`: Frontend OpenDota API client
- `OpenSourceEsportsClient`: Unified frontend client

#### `unifiedIngestionService.ts`

Frontend service that combines GRID and open source data streams

## Configuration

### Environment Variables

Add to `.env`:

```bash
# Riot Games API (get from https://developer.riotgames.com/)
RIOT_API_KEY=your_riot_api_key_here

# OpenDota API (optional, for higher rate limits)
OPENDOTA_API_KEY=your_opendota_key_here

# Pandascore API (optional)
PANDASCORE_API_KEY=your_pandascore_key_here

# Open source polling configuration
OPENSOURCE_POLL_INTERVAL=60  # seconds between polls
OPENSOURCE_ENABLED=true      # Enable/disable open source data
```

### Getting API Keys

1. **Riot Games API**:
   - Visit https://developer.riotgames.com/
   - Create an account and generate an API key
   - Development keys: 100 requests per 2 minutes
   - Production keys: Higher limits (requires application)

2. **OpenDota API**:
   - No API key required for basic usage
   - Register at https://www.opendota.com/ for higher rate limits
   - Free tier: Unlimited requests

3. **Liquipedia API**:
   - Uses MediaWiki API (no key required)
   - Rate limits apply per MediaWiki standards

## Usage

### Starting Unified Ingestion

```python
from app.unified_ingest import start_unified_ingestion
import asyncio

asyncio.run(start_unified_ingestion())
```

This will:

1. Connect to GRID WebSocket stream
2. Start polling open source APIs every 60 seconds (configurable)
3. Normalize all events to canonical format
4. Publish to the same event stream as GRID

### Using the API

#### Get Live Matches from All Sources

```bash
curl http://localhost:8000/api/opensource/live-matches
```

#### Get Live Riot Games Matches

```bash
curl http://localhost:8000/api/opensource/riot/live?region=na
```

#### Get OpenDota Live Matches

```bash
curl http://localhost:8000/api/opensource/opendota/live
```

#### Get Match Details

```bash
# Riot Games
curl http://localhost:8000/api/opensource/riot/match/{match_id}?region=americas

# OpenDota
curl http://localhost:8000/api/opensource/opendota/match/{match_id}
```

#### Backfill Matches

```bash
curl -X POST http://localhost:8000/api/opensource/backfill \
  -H "Content-Type: application/json" \
  -d '{
    "match_ids": ["match1", "match2"],
    "source": "riot"
  }'
```

### Frontend Usage

```typescript
import { unifiedIngestionService } from '@/services/opensource/unifiedIngestionService';

// Start unified ingestion
await unifiedIngestionService.start(matchId);

// Get stats
const stats = unifiedIngestionService.getStats();

// Stop ingestion
unifiedIngestionService.stop();
```

## Data Normalization

All open source data is normalized to the same canonical event format as GRID:

```typescript
interface CanonicalEvent {
  event_id: string;
  event_type: 'MATCH_START' | 'MAP_START' | 'ROUND_START' | 'KILL' | ...;
  game: string;
  match_id: string;
  source: 'grid' | 'riot_games' | 'opendota' | 'liquipedia';
  timestamp: string;
  actor?: string;
  target?: string;
  team?: string;
  payload: Record<string, unknown>;
}
```

The `source` field indicates where the event originated, allowing you to:

- Filter by data source
- Track data provenance
- Combine data from multiple sources for the same match

## Supported Games

### Riot Games API

- **League of Legends**: Live matches, match history, player stats
- **Valorant**: Match data (requires different endpoints)
- **Teamfight Tactics**: Match data

### OpenDota API

- **Dota 2**: Live matches, match details, pro matches, player stats

### Liquipedia API

- **All Games**: Tournament data, match history, team information

## Rate Limits

### Riot Games API

- **Development Key**: 100 requests per 2 minutes
- **Production Key**: Higher limits (varies by tier)

The client includes automatic retry logic with exponential backoff to handle rate limits gracefully.

### OpenDota API

- **Free Tier**: Unlimited requests
- **Registered**: Higher rate limits

### Liquipedia API

- MediaWiki API standard limits apply

## Error Handling

All clients include:

- Automatic retry with exponential backoff
- Rate limit detection and handling
- Graceful degradation (continues with other sources if one fails)
- Comprehensive logging

## Integration with Existing Systems

The open source data integration is fully compatible with existing systems:

- **Event Normalizer**: Uses the same normalization pipeline as GRID
- **Event Bus**: Publishes to the same canonical event stream
- **AI Agents**: Work with events from all sources
- **Visualization**: Displays data from all sources seamlessly
- **Analytics**: Aggregates data from all sources

## Benefits

1. **More Data**: Access to multiple esports data sources
2. **Free Tier**: Many sources offer free access
3. **Redundancy**: Multiple sources for the same game
4. **Coverage**: Access to games not available on GRID
5. **Historical Data**: Backfill capabilities for past matches

## Limitations

1. **Rate Limits**: Some APIs have strict rate limits
2. **Data Quality**: Varies by source
3. **Coverage**: Not all games available on all sources
4. **Real-time**: Some sources only provide polling, not WebSocket streams

## Future Enhancements

- [ ] WebSocket support for Riot Games API
- [ ] More data sources (Pandascore, Strafe, etc.)
- [ ] Caching layer for frequently accessed data
- [ ] Data quality scoring
- [ ] Automatic source selection based on availability
- [ ] Cross-source data validation

## Troubleshooting

### Riot API Rate Limits

If you hit rate limits:

1. Register for a production API key
2. Increase `OPENSOURCE_POLL_INTERVAL`
3. Use multiple API keys with rotation

### OpenDota API Issues

OpenDota is community-maintained and may have downtime:

- The system will automatically retry
- Consider caching match data locally

### Missing Data

Some matches may not be available on all sources:

- Check the source availability with `/api/opensource/sources`
- Use backfill to fetch from specific sources

## References

- [Riot Games API Documentation](https://developer.riotgames.com/)
- [OpenDota API Documentation](https://docs.opendota.com/)
- [Liquipedia API](https://liquipedia.net/api)
- [GRID Integration Documentation](./GRID_INTEGRATION.md)
