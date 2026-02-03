# Quick Start Guide

## Generate Sample Data

### Single Match Archive
```bash
cd sample-data
python3 utils/generate_Sample_data.py --format json --output single_match.json
```

### Multiple Tournaments
```bash
python3 utils/generate_Sample_data.py --format json --multi --output multi_tournament.json
```

### Export to CSV
```bash
python3 utils/generate_Sample_data.py --format csv --output-dir exports
```

### Export to Redis Streams
```bash
python3 utils/generate_Sample_data.py --format redis --output redis_commands.txt
```

### Generate All Formats
```bash
python3 utils/generate_Sample_data.py --format all --output archive.json --output-dir exports
```

## Replay Match Data

### Real-time Replay (Redis)
```bash
# Make sure Redis is running
redis-cli ping

# Replay at 1x speed
python3 utils/replay_simulator.py \
  --match-archive single_match.json \
  --speed 1.0 \
  --redis-host localhost

# Fast replay (3x speed)
python3 utils/replay_simulator.py \
  --match-archive single_match.json \
  --speed 3.0
```

### Print Events Only (No Redis)
```bash
python3 utils/replay_simulator.py \
  --match-archive single_match.json \
  --no-redis
```

### Setup Redis Consumer Groups
```bash
python3 utils/replay_simulator.py \
  --match-archive single_match.json \
  --setup-groups
```

## Use Cases

### 1. Frontend Demo
```javascript
import matchArchive from './sample-data/single_match.json';

// Extract events
const events = matchArchive.maps.flatMap(map => 
  map.rounds.flatMap(round => round.events)
);

// Sort by timestamp
events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

// Display timeline
events.forEach(event => {
  console.log(`[${event.timestamp}] ${event.event_type}`);
});
```

### 2. Test Ingestion Pipeline
```bash
# Stream events to your pipeline
python3 utils/replay_simulator.py \
  --match-archive single_match.json \
  --stream-name events:canonical \
  --redis-host localhost
```

### 3. Analytics Export
```bash
# Generate CSV files
python3 utils/generate_Sample_data.py --format csv --output-dir exports

# Load in Python
import pandas as pd
events_df = pd.read_csv('exports/events.csv')
player_stats_df = pd.read_csv('exports/player_stats.csv')
```

## Data Structure

### Match Archive
- `metadata` - Source information
- `tournament` - Tournament details
- `teams` - Team and player information
- `match` - Match metadata
- `maps` - Map data with rounds and events
- `derived_statistics` - Calculated stats
- `agent_insights` - AI-generated signals
- `human_review` - Review decisions
- `audit_log` - Audit trail

### Events
Each event contains:
- `event_id` - Unique identifier
- `event_type` - Type of event (KILL, ROUND_START, etc.)
- `timestamp` - ISO 8601 timestamp
- `actor` - Player/team who performed action
- `target` - Target of action (for kills)
- `team` - Team associated with event
- `payload` - Event-specific data

## File Locations

- **Base JSON**: `Sample_esports_match_archive.json`
- **Generated data**: `exports/` directory
- **Utilities**: `utils/` directory
- **Documentation**: `README.md`

## Requirements

- Python 3.8+
- Optional: `redis` (pip install redis) for Redis streaming
- Optional: `pandas`, `pyarrow` for CSV/Parquet (already in backend requirements)

## Troubleshooting

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping

# Use --no-redis flag to skip Redis
python3 utils/replay_simulator.py --match-archive single_match.json --no-redis
```

### Module Not Found
```bash
# Install dependencies
pip install redis pandas pyarrow
```

### Permission Denied
```bash
# Make scripts executable
chmod +x utils/*.py
```



