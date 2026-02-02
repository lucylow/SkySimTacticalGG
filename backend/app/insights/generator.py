# app/insights/generator.py
import asyncpg
import pandas as pd
import json
from datetime import datetime, timezone
from app.settings import settings
from app.insights.templates import render
from app.insights.visualizer import build_evidence_chart_from_df
import logging
import uuid
import math
from typing import Optional

logger = logging.getLogger("insights.generator")

# thresholds & policy
MIN_SAMPLE_SIZE = 40
CONFIDENCE_THRESHOLD_APPROVE = 0.7  # suggestions below this will require review
HIGH_IMPACT_EFFECT = 0.15  # 15% effect size flagged


async def extract_round_features(pg_pool: asyncpg.Pool) -> pd.DataFrame:
    """
    Extract per-round aggregated features from database.
    Returns a pandas DataFrame with round-level features.
    This is a placeholder - adapt to your actual schema.
    """
    # Placeholder implementation - adapt to your actual database schema
    # For now, return an empty DataFrame with expected columns
    # In production, query your rounds/events tables and aggregate features
    try:
        async with pg_pool.acquire() as conn:
            # This is a placeholder query - replace with your actual schema
            # Example: SELECT round, team, kills, deaths, economy, round_win FROM rounds...
            rows = await conn.fetch("""
                SELECT 
                    1 as round,
                    0.5 as feature_example,
                    0 as round_win
                LIMIT 1
            """)
            if rows:
                return pd.DataFrame([dict(r) for r in rows])
            else:
                # Return empty DataFrame with expected structure
                return pd.DataFrame(columns=["round", "feature_example", "round_win"])
    except Exception as e:
        logger.warning(f"extract_round_features failed (placeholder), returning empty DataFrame: {e}")
        return pd.DataFrame(columns=["round", "feature_example", "round_win"])


async def run_insight_generation_job(pg_pool: asyncpg.Pool):
    """
    1) extract per-round aggregated dataframe (round/team granularity)
    2) read correlation_results table for candidate features
    3) for each candidate that meets sample & significance thresholds, build an insight:
       - NL headline
       - evidence chart
       - metadata
       - persist insight as PENDING_REVIEW (or auto-approve if high confidence)
    """
    df = await extract_round_features(pg_pool)  # pandas DataFrame
    if df.empty:
        logger.info("No data for aggregation.")
        return

    # fetch candidate correlations
    # Note: This assumes a correlation_results table exists. If not, create it or adapt.
    async with pg_pool.acquire() as conn:
        try:
            rows = await conn.fetch("""
                SELECT * FROM correlation_results 
                WHERE sample_size > $1 
                ORDER BY p_value ASC 
                LIMIT 50
            """, MIN_SAMPLE_SIZE)
            candidates = [dict(r) for r in rows]
        except Exception as e:
            logger.warning(f"correlation_results table not found or query failed: {e}")
            # Return empty list if table doesn't exist
            candidates = []

    for c in candidates:
        try:
            feat = c.get("feature_name")
            outcome = c.get("outcome_name", "round_win")
            sample_n = c.get("sample_size", 0)
            corr = float(c.get("correlation") or 0.0)
            pval = float(c.get("p_value") or 1.0)
            method = c.get("method", "unknown")
            
            # apply simple filters: significant p < 0.05 and |corr| > small threshold
            if pval > 0.05 or abs(corr) < 0.05:
                continue

            # build context for NL
            direction_text = "increase" if corr > 0 else "decrease"
            effect_pct = round(abs(corr) * 100, 1)  # naive effect translation for headline
            confidence = max(0.5, min(0.99, 1.0 - pval))  # rough mapping; replace with bootstrap for production

            # build evidence visual
            # re-aggregate df for this feature/outcome
            if feat not in df.columns:
                # skip if feature absent
                continue
            evidence_url = build_evidence_chart_from_df(df, feat, outcome)  # returns data URI
            short_text = f"{feat} correlates with {effect_pct}% {direction_text} in {outcome.replace('_', ' ')}"
            long_text = render("micro_macro_correlation",
                               player_handle=None,
                               player_id=None,
                               feature_label=feat.replace("_", " "),
                               effect_pct=effect_pct,
                               direction_text=direction_text,
                               outcome_label=outcome.replace("_", " "),
                               sample_size=sample_n,
                               confidence_pct=int(confidence * 100))

            # determine review policy
            review_required = True
            if confidence >= CONFIDENCE_THRESHOLD_APPROVE and sample_n > (MIN_SAMPLE_SIZE * 2) and abs(corr) >= HIGH_IMPACT_EFFECT:
                # auto-approve strong, well-sampled & high-conf candidates
                review_required = False

            insight_id = str(uuid.uuid4())
            status = "APPROVED" if not review_required else "PENDING_REVIEW"
            evidence_json = json.dumps({"chart": evidence_url}) if evidence_url else json.dumps({})
            
            # persist insight to DB
            async with pg_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO insights (id, short_text, long_text, evidence_json,
                                          feature_name, outcome_name, correlation, p_value, effect_size, direction,
                                          method, sample_size, generated_by, model_version, confidence, status, review_required, not_for_betting, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                """,
                insight_id, short_text, long_text, evidence_json,
                feat, outcome, corr, pval, corr, ("pos" if corr > 0 else "neg"),
                method, sample_n, "insight_generator_v1", c.get("extra", {}).get("model_version") if c.get("extra") else None,
                confidence, status, review_required, True, datetime.now(timezone.utc), datetime.now(timezone.utc)
                )

            # audit log
            await conn.execute("""
                INSERT INTO insight_audit (insight_id, action, actor, details) 
                VALUES ($1, $2, $3, $4)
            """, insight_id, "created", "insight_generator", json.dumps({"review_required": review_required, "confidence": confidence}))
            
            # publish to stream if approved
            if not review_required:
                await publish_insight_to_stream(insight_id, pg_pool)
        except Exception as e:
            logger.exception(f"failed to process candidate: {c}", extra={"error": str(e)})


async def publish_insight_to_stream(insight_id: str, pg_pool: asyncpg.Pool):
    """Publish approved insight to Redis stream."""
    try:
        import aioredis
        r = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        # fetch full insight
        async with pg_pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM insights WHERE id=$1", insight_id)
            if row:
                insight_dict = dict(row)
                # Convert UUID and datetime to strings for JSON
                for key, value in insight_dict.items():
                    if isinstance(value, uuid.UUID):
                        insight_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        insight_dict[key] = value.isoformat()
                await r.xadd("events:insights", {"data": json.dumps(insight_dict)})
        await r.close()
    except Exception as e:
        logger.warning(f"Failed to publish insight to stream: {e}")


