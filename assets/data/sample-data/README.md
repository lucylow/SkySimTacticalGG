# Sample Esports Data System

Comprehensive Sample esports data designed to demonstrate GRID-style usage end-to-end: tournaments → matches → maps → rounds → events → derived agent insights → human review metadata.

This is **synthetic data** (safe for hacks, demos, and UI testing).

## Quick Start

### 1. Generate Sample Data

```bash
# Generate a single match archive (JSON)
python sample-data/utils/generate_Sample_data.py --format json --output sample-data/match_archive.json

# Generate multiple tournaments
python sample-data/utils/generate_Sample_data.py --format json --multi --output sample-data/multi_tournament.json

# Export to CSV
python sample-data/utils/generate_Sample_data.py --format csv --output-dir sample-data/exports

# Generate Redis Stream commands
python sample-data/utils/generate_Sample_data.py --format redis --output sample-data/redis_streams.txt

# Generate all formats
python sample-data/utils/generate_Sample_data.py --format all --output sample-data/archive.json --output-dir sample-data/exports
```

### 2. Replay Match Data

```bash
# Replay a match archive in real-time (streams to Redis)
python sample-data/utils/replay_simulator.py \
  --match-archive sample-data/match_archive.json \
  --speed 1.0 \
  --redis-host localhost

# Fast replay (3x speed)
python sample-data/utils/replay_simulator.py \
  --match-archive sample-data/match_archive.json \
  --speed 3.0

# Just print events (no Redis)
python sample-data/utils/replay_simulator.py \
  --match-archive sample-data/match_archive.json \
  --no-redis

# Setup Redis consumer groups
python sample-data/utils/replay_simulator.py \
  --match-archive sample-data/match_archive.json \
  --setup-groups
```

## Data Structure

### Match Archive JSON

```json
{
  "metadata": {
    "source": "Sample_GRID_COMPATIBLE",
    "generated_at": "2026-01-02T17:00:00Z",
    "game": "cs2",
    "version": "1.0"
  },
  "tournament": { ... },
  "teams": [ ... ],
  "match": { ... },
  "maps": [
    {
      "map_id": "map_1",
      "map_name": "de_mirage",
      "rounds": [
        {
          "round_number": 1,
          "events": [
            {
              "event_id": "evt_0001",
              "event_type": "ROUND_START",
              "timestamp": "2026-01-02T17:07:01Z"
            },
            {
              "event_id": "evt_0002",
              "event_type": "KILL",
              "actor": "player:alpha_p1",
              "target": "player:bravo_p3",
              "team": "team_alpha",
              "payload": {
                "weapon": "AK47",
                "headshot": true,
                "trade": false
              },
              "timestamp": "2026-01-02T17:07:32Z"
            }
          ]
        }
      ]
    }
  ],
  "derived_statistics": { ... },
  "agent_insights": [ ... ],
  "human_review": [ ... ],
  "audit_log": [ ... ]
}
```

### Event Types

- `ROUND_START` - Round begins
- `KILL` - Player kill
- `ASSIST` - Kill assist
- `OBJECTIVE` - Bomb plant/defuse, site capture
- `ROUND_END` - Round completes
- `MAP_END` - Map completes
- `MATCH_END` - Match completes

### Agent Signal Types

- `MOMENTUM_SHIFT` - Team momentum change
- `STAR_PLAYER` - Outstanding player performance
- `ECONOMY_CRASH` - Economic disadvantage
- `STRATEGIC_PATTERN` - Recognized tactical pattern
- `CLUTCH_OPPORTUNITY` - Clutch situation
- `ROUND_CRITICAL` - Critical round

## Use Cases

### 1. Ingestion Testing

Replay `rounds[*].events[*]` through your normalizer:

```bash
python sample-data/utils/replay_simulator.py \
  --match-archive sample-data/match_archive.json \
  --speed 1.0 \
  --stream-name events:canonical
```

This allows you to:
- Validate ordering
- Test idempotency
- Rebuild state from events
- Test your event processing pipeline

### 2. AI Agent Testing

Feed canonical events sequentially to your agents:

```bash
# Stream events to Redis
python sample-data/utils/replay_simulator.py \
  --match-archive sample-data/match_archive.json \
  --stream-name events:canonical

# Your agents consume from Redis and generate signals
# Compare outputs with agent_insights in the archive
```

This enables:
- Momentum detection testing
- Player impact analysis
- Pattern recognition validation
- Agent output comparison

### 3. Frontend Demo

Load the match archive JSON and build UI components:

- **Timeline** from `maps[*].rounds[*].events[*]`
- **Scoreboard** from `derived_statistics`
- **Insight Cards** from `agent_insights`
- **Review Panel** from `human_review`

Example:
```javascript
import matchArchive from './sample-data/match_archive.json';

// Extract events
const events = matchArchive.maps.flatMap(map => 
  map.rounds.flatMap(round => round.events)
);

// Build timeline
events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
```

### 4. Analytics Pipeline

Export to CSV for analysis:

```bash
python sample-data/utils/generate_Sample_data.py --format csv --output-dir exports
```

This generates:
- `events.csv` - All events
- `player_stats.csv` - Player statistics
- `agent_signals.csv` - AI agent signals
- `human_reviews.csv` - Human review decisions

Use with:
- Pandas
- BigQuery
- Data analysis tools
- ML feature extraction

### 5. Redis Stream Integration

Generate Redis Stream commands:

```bash
python sample-data/utils/generate_Sample_data.py --format redis --output redis_commands.txt
```

Or stream directly:

```bash
python sample-data/utils/replay_simulator.py \
  --match-archive sample-data/match_archive.json \
  --redis-host localhost
```

Create consumer groups:
```bash
python sample-data/utils/replay_simulator.py \
  --match-archive sample-data/match_archive.json \
  --setup-groups
```

Consumer groups:
- `state_updater` - State reconstruction
- `agent_momentum` - Momentum detection agents
- `ws_broadcaster` - WebSocket frontend
- `human_reviewers` - Review queue

## Architecture

```
Sample Dataset (JSON)
   │
   ├─► CSV Exports (Analytics)
   │
   ├─► Redis Streams (Real-time)
   │   ├─► Frontend WS
   │   ├─► AI Agents
   │   └─► Review Queue
   │
   └─► Replay Simulator
       │ (time-scaled streaming)
       └─► Redis Streams
```

## Data Volume

Per single match:
- ~30 rounds
- ~200–350 KILL events
- ~30 ROUND_START/END events
- ~5–10 OBJECTIVE events

Across 3 tournaments × 20 matches:
- ~15,000–25,000 events

This scale is ideal for:
- Redis Streams testing
- Kafka topic testing
- Analytics demos
- ML pipeline testing

## Format Specifications

### CSV Format

**events.csv**
```
event_id,tournament_id,match_id,map_id,round_number,event_type,actor,target,team,timestamp
evt_000234,tourn_na_winter_2026,na_match_001,na_match_001_map_1,12,KILL,player:alpha_p1,player:bravo_p3,team_alpha,2026-01-02T17:12:33Z
```

**player_stats.csv**
```
tournament_id,match_id,player_id,kills,deaths,assists,adr,opening_kills
tourn_na_winter_2026,na_match_001,alpha_p1,24,16,6,92.4,8
```

**agent_signals.csv**
```
signal_id,match_id,type,subject,confidence,status
sig_0091,na_match_001,MOMENTUM_SHIFT,team_alpha,0.87,APPROVED
```

**human_reviews.csv**
```
review_id,signal_id,reviewer,decision,notes,reviewed_at
rev_001,sig_0091,reviewer_42,APPROVED,"Momentum confirmed",2026-01-02T17:30:00Z
```

### Redis Stream Format

Canonical events:
```
XADD events:canonical * \
  event_id evt_000234 \
  tournament_id tourn_na_winter_2026 \
  match_id na_match_001 \
  map_id na_match_001_map_1 \
  round 12 \
  event_type KILL \
  actor player:alpha_p1 \
  target player:bravo_p3 \
  team team_alpha \
  payload '{"weapon":"AK47","headshot":true}' \
  timestamp 2026-01-02T17:12:33Z
```

Agent signals:
```
XADD events:agent:signals * \
  signal_id sig_0091 \
  match_id na_match_001 \
  type MOMENTUM_SHIFT \
  team team_alpha \
  confidence 0.87 \
  explanation '{"rounds_won":4,"eco_wins":1}'
```

## Replay Modes

### Live Mode (1.0x speed)
Real-time replay matching original event timings.

```bash
python sample-data/utils/replay_simulator.py --speed 1.0
```

### Fast Demo (3.0x speed)
Accelerated replay for demonstrations.

```bash
python sample-data/utils/replay_simulator.py --speed 3.0
```

### Step Mode
Manual advancement (future: add `--step` flag).

### Scrub Mode
Jump to specific rounds/maps (future: add `--from-round` flag).

## Human Review Workflow

Signals enter review queue:
```
events:agent:review
```

Reviewer actions emit:
```
events:agent:signals (updated status)
events:audit (audit log)
```

This enables:
- Pausing AI influence
- "Pending Review" badges
- Teaching responsible AI design
- Auditability

## Auditability & Trust

Every action emits an audit entry:
```
XADD events:audit * \
  action AGENT_SIGNAL_APPROVED \
  actor reviewer_42 \
  signal_id sig_0091 \
  timestamp 2026-01-02T17:30:00Z
```

All signals are:
- Derived, not hallucinated
- Traceable to source events
- Reviewable by humans
- Auditable in the log

## Next Steps

### Immediate Use
1. Generate match archive: `python sample-data/utils/generate_Sample_data.py --format json`
2. Load in frontend: Import JSON and build UI
3. Test ingestion: Replay through your pipeline

### Advanced Usage
1. **Multi-tournament datasets**: `--multi` flag
2. **CSV analytics**: Export to CSV for analysis
3. **Redis streaming**: Stream to Redis for real-time processing
4. **Replay simulation**: Test with realistic timing

### Future Enhancements
- Parquet exports (columnar analytics)
- Docker Compose demo setup
- Grafana dashboards
- 3D round replay viewer
- ML feature extraction pipelines
- Multi-match replay orchestration

## Requirements

- Python 3.8+
- Optional: `redis` (for Redis streaming)
- Optional: `pandas`, `pyarrow` (for CSV/Parquet exports - already in backend requirements)

## License

This Sample data is synthetic and safe for demos, testing, and development.



