"""
Prometheus metrics instrumentation for esports platform.
Exposes metrics for ingestion, agents, reviews, and replay.
"""
from prometheus_client import Counter, Histogram, Gauge, Summary
from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response

# Ingestion metrics
INGEST_EVENTS_TOTAL = Counter(
    "ingest_events_total",
    "Total events ingested",
    ["game", "tournament", "event_type"]
)

INGEST_LATENCY = Histogram(
    "ingest_latency_seconds",
    "Time to ingest event",
    buckets=[0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1.0, 5.0]
)

STREAM_LAG_MS = Gauge(
    "stream_lag_ms",
    "Redis stream lag in milliseconds",
    ["consumer_group"]
)

# Match metrics
EVENTS_PER_MINUTE = Gauge(
    "events_per_minute",
    "Events per minute for a match",
    ["match_id"]
)

KILLS_PER_ROUND = Gauge(
    "kills_per_round",
    "Kills per round",
    ["match_id", "round"]
)

ROUND_DURATION = Histogram(
    "round_duration_seconds",
    "Round duration in seconds",
    ["match_id"],
    buckets=[30, 60, 90, 120, 150, 180, 210]
)

# AI Agent metrics
AGENT_SIGNALS_TOTAL = Counter(
    "agent_signals_total",
    "Total agent signals generated",
    ["agent", "type", "status"]
)

AGENT_CONFIDENCE_AVG = Summary(
    "agent_confidence_avg",
    "Average confidence score",
    ["agent", "type"]
)

AGENT_FALSE_POSITIVE_RATE = Gauge(
    "agent_false_positive_rate",
    "False positive rate for agent",
    ["agent"]
)

# Human review metrics
REVIEW_QUEUE_DEPTH = Gauge(
    "review_queue_depth",
    "Number of signals pending review"
)

REVIEW_LATENCY = Histogram(
    "review_latency_seconds",
    "Time from signal generation to review",
    buckets=[1, 5, 10, 30, 60, 300, 600]
)

APPROVAL_RATE = Gauge(
    "approval_rate",
    "Approval rate for agent signals",
    ["agent"]
)

# Replay metrics
REPLAY_THROUGHPUT = Gauge(
    "replay_throughput_events_per_sec",
    "Replay playback rate",
    ["match_id"]
)

WEBSOCKET_CONNECTIONS = Gauge(
    "websocket_connections",
    "Active WebSocket connections",
    ["endpoint"]
)


def get_metrics():
    """Return Prometheus metrics as text."""
    return generate_latest()


def metrics_response():
    """Return FastAPI Response with metrics."""
    return Response(content=get_metrics(), media_type=CONTENT_TYPE_LATEST)


