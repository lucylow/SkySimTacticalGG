# app/analytics/api.py
"""
FastAPI endpoints for querying correlation results and triggering analyses.
"""
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import Optional, List
import asyncpg
import json
from app.settings import settings
from app.analytics.jobs import run_correlation_job
import asyncio
import logging

logger = logging.getLogger("analytics.api")

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


async def get_db_pool():
    """Dependency to get database connection pool."""
    pool = await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=3)
    try:
        yield pool
    finally:
        await pool.close()


@router.get("/top-correlations")
async def top_correlations(
    limit: int = 20,
    significant_only: bool = False,
    metric_name: Optional[str] = None,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """
    Get top correlations ordered by p-value.
    
    Query params:
    - limit: number of results to return
    - significant_only: only return significant results (p_bh < 0.05)
    - metric_name: filter by metric (point_biserial, logistic, chi2)
    """
    async with pool.acquire() as conn:
        query = "SELECT * FROM correlation_results WHERE 1=1"
        params = []
        
        if significant_only:
            query += " AND significant = true"
        
        if metric_name:
            query += " AND metric_name = $1"
            params.append(metric_name)
        
        query += " ORDER BY p_value ASC LIMIT $2"
        params.append(limit)
        
        rows = await conn.fetch(query, *params)
    
    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "metric_name": row["metric_name"],
            "feature_name": row["feature_name"],
            "outcome_name": row["outcome_name"],
            "correlation": float(row["correlation"]) if row["correlation"] else None,
            "p_value": float(row["p_value"]) if row["p_value"] else None,
            "p_value_bh": float(row["p_value_bh"]) if row["p_value_bh"] else None,
            "effect_size": float(row["effect_size"]) if row["effect_size"] else None,
            "direction": row["direction"],
            "method": row["method"],
            "sample_size": row["sample_size"],
            "significant": row["significant"],
            "extra": row["extra"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None
        })
    
    return {"results": results, "count": len(results)}


@router.get("/correlations/by-feature/{feature_name}")
async def correlations_by_feature(
    feature_name: str,
    pool: asyncpg.Pool = Depends(get_db_pool)
):
    """Get all correlation results for a specific feature."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM correlation_results WHERE feature_name = $1 ORDER BY p_value ASC",
            feature_name
        )
    
    results = []
    for row in rows:
        results.append({
            "id": row["id"],
            "metric_name": row["metric_name"],
            "feature_name": row["feature_name"],
            "outcome_name": row["outcome_name"],
            "correlation": float(row["correlation"]) if row["correlation"] else None,
            "p_value": float(row["p_value"]) if row["p_value"] else None,
            "p_value_bh": float(row["p_value_bh"]) if row["p_value_bh"] else None,
            "effect_size": float(row["effect_size"]) if row["effect_size"] else None,
            "direction": row["direction"],
            "method": row["method"],
            "sample_size": row["sample_size"],
            "significant": row["significant"],
            "created_at": row["created_at"].isoformat() if row["created_at"] else None
        })
    
    return {"feature": feature_name, "results": results, "count": len(results)}


@router.post("/run-analysis")
async def run_analysis(background_tasks: BackgroundTasks):
    """
    Trigger correlation analysis job in background.
    Returns immediately with status.
    """
    # Run in background task
    background_tasks.add_task(run_correlation_job)
    
    return {
        "status": "scheduled",
        "message": "Analysis job started in background"
    }


@router.get("/stats/summary")
async def stats_summary(pool: asyncpg.Pool = Depends(get_db_pool)):
    """Get summary statistics about correlation results."""
    async with pool.acquire() as conn:
        # Total results
        total = await conn.fetchval("SELECT COUNT(*) FROM correlation_results")
        
        # Significant results
        significant = await conn.fetchval(
            "SELECT COUNT(*) FROM correlation_results WHERE significant = true"
        )
        
        # By metric type
        by_metric = await conn.fetch("""
            SELECT metric_name, COUNT(*) as count,
                   COUNT(*) FILTER (WHERE significant = true) as significant_count
            FROM correlation_results
            GROUP BY metric_name
        """)
        
        # Top features by significance
        top_features = await conn.fetch("""
            SELECT feature_name, COUNT(*) as count,
                   COUNT(*) FILTER (WHERE significant = true) as significant_count
            FROM correlation_results
            GROUP BY feature_name
            ORDER BY significant_count DESC
            LIMIT 10
        """)
    
    return {
        "total_results": total,
        "significant_results": significant,
        "by_metric": [dict(r) for r in by_metric],
        "top_features": [dict(r) for r in top_features]
    }


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    try:
        pool = await asyncpg.create_pool(settings.DATABASE_URL, min_size=1, max_size=1)
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        await pool.close()
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


