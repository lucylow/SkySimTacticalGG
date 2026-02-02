# Macro-Strategy Correlation - Quick Start

## Overview

The Macro-Strategy Correlation system analyzes relationships between micro-actions (player intents, motions) and macro outcomes (round wins, economy, site executes).

## Setup Steps

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

New dependencies added:
- `statsmodels==0.14.2` - Statistical modeling
- `scipy==1.14.1` - Statistical functions
- `asyncpg==0.29.0` - Async Postgres driver

### 2. Run Database Migration

```bash
# For Postgres
psql $DATABASE_URL -f migrations/create_analytics_tables.sql

# Or tables will be created automatically via SQLAlchemy on first run
python -c "from app.db import init_db; init_db()"
```

### 3. Start Stream Consumers

Start the consumers to ingest data from Redis streams:

```bash
# Option 1: Direct Python script
python -m app.analytics.start_consumers

# Option 2: As Celery task (recommended for production)
# Add to your Celery worker
```

### 4. Trigger Analysis

```bash
# Via API
curl -X POST http://localhost:8000/api/v1/analytics/run-analysis

# Or programmatically
python -c "import asyncio; from app.analytics.jobs import run_correlation_job; asyncio.run(run_correlation_job())"
```

### 5. Query Results

```bash
# Get top correlations
curl "http://localhost:8000/api/v1/analytics/top-correlations?limit=10&significant_only=true"

# Get summary stats
curl "http://localhost:8000/api/v1/analytics/stats/summary"
```

## Example Usage

### Python Example

```python
import asyncio
from app.analytics.jobs import run_correlation_job
from app.analytics.aggregate import extract_round_features
from app.analytics.causal import propensity_adjusted_effect
import asyncpg
from app.settings import settings

# Run analysis
result = asyncio.run(run_correlation_job())
print(f"Analysis complete: {result}")

# Query correlations
pool = await asyncpg.create_pool(settings.DATABASE_URL)
async with pool.acquire() as conn:
    rows = await conn.fetch("""
        SELECT feature_name, correlation, p_value_bh, significant
        FROM correlation_results
        WHERE significant = true
        ORDER BY p_value_bh ASC
        LIMIT 10
    """)
    for row in rows:
        print(f"{row['feature_name']}: r={row['correlation']:.3f}, p={row['p_value_bh']:.4f}")

# Causal inference example
df = await extract_round_features(pool)
effect = propensity_adjusted_effect(
    df,
    treatment_col="advance_count",
    outcome_col="round_win",
    covariates=["total_actions", "mean_confidence", "speed_mean"]
)
print(f"Propensity-adjusted ATE: {effect['ate']:.3f}")
```

## API Endpoints

- `GET /api/v1/analytics/top-correlations` - Top correlations
- `GET /api/v1/analytics/correlations/by-feature/{feature_name}` - By feature
- `POST /api/v1/analytics/run-analysis` - Trigger analysis
- `GET /api/v1/analytics/stats/summary` - Summary statistics
- `GET /api/v1/analytics/health` - Health check

## Data Flow

1. **Ingestion**: Redis streams → Postgres
   - `events:canonical` → `rounds`, `macro_outcomes`
   - `events:agent:motion` → `micro_actions`

2. **Aggregation**: Postgres → Feature vectors
   - `extract_round_features()` creates pandas DataFrame

3. **Analysis**: Feature vectors → Statistical tests
   - Point-biserial correlation
   - Chi-square tests
   - Logistic regression
   - Multiple testing correction (BH)

4. **Storage**: Results → `correlation_results` table

5. **Query**: API endpoints for dashboards/reports

## Monitoring

- Check consumer logs: `tail -f logs/analytics.log`
- Monitor database: `SELECT COUNT(*) FROM correlation_results WHERE created_at > NOW() - INTERVAL '1 day'`
- Health check: `curl http://localhost:8000/api/v1/analytics/health`

## Troubleshooting

### No data in correlation_results
- Check if stream consumers are running
- Verify data exists in `rounds` and `micro_actions` tables
- Run analysis manually: `POST /api/v1/analytics/run-analysis`

### Database connection errors
- Verify `DATABASE_URL` in `.env` or environment
- Check Postgres is running and accessible

### Missing dependencies
- Run `pip install -r requirements.txt`
- Verify `statsmodels`, `scipy`, `asyncpg` are installed

## Next Steps

- Schedule analysis as Celery periodic task
- Add Grafana dashboards
- Export to Parquet for ML training
- Set up alerts for significant findings


