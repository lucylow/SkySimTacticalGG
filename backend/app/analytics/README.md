# Macro-Strategy Correlation Analytics System

This module implements the Macro-Strategy Correlation system that cross-references micro-actions (intents & synthesized motions) with macro outcomes (round win/loss, economic swings, site executes) to find statistically robust patterns.

## Architecture

```
Redis Streams
    ├── events:canonical → canonical_ingest.py → rounds, macro_outcomes
    └── events:agent:motion → stream_ingest.py → micro_actions
            ↓
    Postgres Database
            ↓
    aggregate.py → Feature vectors (pandas DataFrame)
            ↓
    stats.py → Statistical tests (correlations, p-values, BH correction)
    causal.py → Propensity scoring for causal inference
            ↓
    jobs.py → Persist results to correlation_results
            ↓
    api.py → FastAPI endpoints for querying results
```

## Components

### Database Models (`models_analytics.py`)
- **Round**: Macro-level round data (match_id, round_no, winner, economy, etc.)
- **MicroAction**: Micro-level signals (intents, confidence, features, artifacts)
- **MacroOutcome**: Materialized per-round/team outcomes (round_win, econ_delta, site_executed)
- **CorrelationResult**: Computed correlations, p-values, effect sizes

### Stream Consumers
- **stream_ingest.py**: Consumes `events:agent:motion` and persists micro_actions
- **canonical_ingest.py**: Consumes `events:canonical` and materializes rounds/macro_outcomes

### Feature Aggregation (`aggregate.py`)
- Extracts round-level feature vectors from micro_actions
- Computes counts, means, and aggregates per round/team
- Output: pandas DataFrame ready for statistical analysis

### Statistical Analysis (`stats.py`)
- **point_biserial**: Continuous feature vs binary outcome correlation
- **chi2_feature_counts**: Categorical feature chi-square tests
- **logistic_model**: Logistic regression for effect sizes and odds ratios
- **multiple_test_correction**: Benjamini-Hochberg FDR correction

### Causal Inference (`causal.py`)
- **compute_propensity**: Estimate propensity scores using RandomForest
- **weighted_outcome_diff**: Compute IPW-weighted average treatment effect
- **propensity_adjusted_effect**: Full pipeline for causal estimates

### Analysis Job (`jobs.py`)
- Runs correlation analysis on aggregated features
- Persists results to `correlation_results` table
- Can be scheduled as Celery task or cron job

### API Endpoints (`api.py`)
- `GET /api/v1/analytics/top-correlations`: Get top correlations
- `GET /api/v1/analytics/correlations/by-feature/{feature_name}`: Get correlations for a feature
- `POST /api/v1/analytics/run-analysis`: Trigger analysis job
- `GET /api/v1/analytics/stats/summary`: Get summary statistics

## Setup

### 1. Database Migration

Run the migration script to create tables:

```bash
# For Postgres
psql $DATABASE_URL -f migrations/create_analytics_tables.sql

# Or use Alembic (if configured)
alembic upgrade head
```

### 2. Start Stream Consumers

Start the stream consumers to ingest data:

```python
# In a separate process or Celery worker
from app.analytics.stream_ingest import consume_micro, pg_connect
from app.analytics.canonical_ingest import consume_canonical
import asyncio

async def main():
    pool = await pg_connect()
    await asyncio.gather(
        consume_micro(pool),
        consume_canonical(pool)
    )

asyncio.run(main())
```

Or add to your Celery tasks:

```python
@celery_app.task
def start_analytics_consumers():
    asyncio.run(main())
```

### 3. Run Analysis

Trigger analysis manually:

```bash
curl -X POST http://localhost:8000/api/v1/analytics/run-analysis
```

Or schedule as Celery periodic task:

```python
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'run-correlation-analysis': {
        'task': 'app.analytics.jobs.run_correlation_job_task',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM
    },
}
```

## Usage Examples

### Query Top Correlations

```python
import requests

# Get top 20 significant correlations
r = requests.get(
    "http://localhost:8000/api/v1/analytics/top-correlations",
    params={"limit": 20, "significant_only": True}
)
print(r.json())
```

### Run Analysis Programmatically

```python
from app.analytics.jobs import run_correlation_job
import asyncio

result = asyncio.run(run_correlation_job())
print(result)
```

### Use Causal Inference

```python
from app.analytics.aggregate import extract_round_features
from app.analytics.causal import propensity_adjusted_effect
import asyncpg

pool = await asyncpg.create_pool(DATABASE_URL)
df = await extract_round_features(pool)

# Compute propensity-adjusted effect of "advance_count" on "round_win"
result = propensity_adjusted_effect(
    df,
    treatment_col="advance_count",
    outcome_col="round_win",
    covariates=["total_actions", "mean_confidence", "speed_mean"]
)
print(f"ATE: {result['ate']}, Naive: {result['naive_ate']}")
```

## Safety & Policy

⚠️ **Important Notes:**

1. **No Gambling/Betting**: All analytics outputs are tagged with `purpose: "research/ops"` and include disclaimers. Do not use for real-money betting decisions.

2. **Human-in-the-Loop**: Any recommendation leading to production actions must pass human review.

3. **Privacy**: Data is aggregated at team/round level. Player identifiers are removed from published reports unless approved.

4. **Statistical Rigor**: 
   - Multiple testing correction (Benjamini-Hochberg) is applied
   - Effect sizes and confidence intervals are preferred over p-values alone
   - Small sample results are treated as exploratory

## Monitoring

Monitor the system via:

- Prometheus metrics (if instrumented)
- API health endpoint: `GET /api/v1/analytics/health`
- Database query counts and job durations
- Correlation result freshness (check `created_at` in `correlation_results`)

## Next Steps

- Add Grafana dashboards for visualization
- Implement automated alerts for surprising patterns
- Add export to Parquet for ML training
- Integrate with existing agent system for real-time insights


