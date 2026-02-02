# app/api_insights.py
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
import asyncpg
from app.settings import settings
from app.auth import require_role, get_current_user, User
import json
import aioredis
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/v1/insights", tags=["insights"])


async def get_db_pool():
    """Get database connection pool."""
    return await asyncpg.create_pool(settings.DATABASE_URL)


@router.get("/")
async def list_insights(limit: int = 50, offset: int = 0, status: Optional[str] = None):
    """List insights with optional status filter."""
    pool = await get_db_pool()
    try:
        async with pool.acquire() as conn:
            if status:
                rows = await conn.fetch(
                    "SELECT * FROM insights WHERE status=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
                    status, limit, offset
                )
            else:
                rows = await conn.fetch(
                    "SELECT * FROM insights ORDER BY created_at DESC LIMIT $1 OFFSET $2",
                    limit, offset
                )
            results = []
            for row in rows:
                row_dict = dict(row)
                # Convert UUID and datetime to strings for JSON
                for key, value in row_dict.items():
                    if isinstance(value, uuid.UUID):
                        row_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        row_dict[key] = value.isoformat()
                results.append(row_dict)
            return results
    finally:
        await pool.close()


@router.get("/pending")
async def list_pending_insights(limit: int = 50):
    """List insights pending review."""
    pool = await get_db_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM insights WHERE status='PENDING_REVIEW' ORDER BY created_at DESC LIMIT $1",
                limit
            )
            results = []
            for row in rows:
                row_dict = dict(row)
                for key, value in row_dict.items():
                    if isinstance(value, uuid.UUID):
                        row_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        row_dict[key] = value.isoformat()
                results.append(row_dict)
            return results
    finally:
        await pool.close()


@router.get("/{insight_id}")
async def get_insight(insight_id: str):
    """Get a single insight by ID."""
    pool = await get_db_pool()
    try:
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT * FROM insights WHERE id=$1", insight_id)
            if not row:
                raise HTTPException(404, "insight not found")
            row_dict = dict(row)
            for key, value in row_dict.items():
                if isinstance(value, uuid.UUID):
                    row_dict[key] = str(value)
                elif isinstance(value, datetime):
                    row_dict[key] = value.isoformat()
            return row_dict
    finally:
        await pool.close()


@router.post("/{insight_id}/review")
async def review_insight(
    insight_id: str,
    decision: str,
    notes: Optional[str] = "",
    user: User = Depends(require_role("reviewer"))
):
    """
    Reviewer endpoint. Decision ∈ {APPROVED, REJECTED, EDITED}
    If EDITED, provide changed_text/changed_evidence in notes as JSON.
    """
    if decision not in ["APPROVED", "REJECTED", "EDITED"]:
        raise HTTPException(400, "decision must be APPROVED, REJECTED, or EDITED")
    
    pool = await get_db_pool()
    try:
        async with pool.acquire() as conn:
            insight = await conn.fetchrow("SELECT * FROM insights WHERE id=$1", insight_id)
            if not insight:
                raise HTTPException(404, "insight not found")
            
            # update insight status & store review
            await conn.execute(
                "UPDATE insights SET status=$1, updated_at=now() WHERE id=$2",
                decision, insight_id
            )
            await conn.execute(
                "INSERT INTO insight_reviews (insight_id, reviewer, decision, notes) VALUES ($1, $2, $3, $4)",
                insight_id, user.username, decision, notes
            )
            await conn.execute(
                "INSERT INTO insight_audit (insight_id, action, actor, details) VALUES ($1, $2, $3, $4)",
                insight_id, "reviewed", user.username, json.dumps({"decision": decision, "notes": notes})
            )
            
            # if approved, publish to stream for frontend
            if decision == "APPROVED":
                try:
                    r = await aioredis.from_url(settings.REDIS_URL, decode_responses=True)
                    insight_dict = dict(insight)
                    for key, value in insight_dict.items():
                        if isinstance(value, uuid.UUID):
                            insight_dict[key] = str(value)
                        elif isinstance(value, datetime):
                            insight_dict[key] = value.isoformat()
                    await r.xadd("events:insights", {"data": json.dumps(insight_dict)})
                    await r.close()
                except Exception as e:
                    # Log but don't fail the request
                    pass
        
        return {"ok": True, "insight_id": insight_id, "decision": decision}
    finally:
        await pool.close()


@router.get("/{insight_id}/reviews")
async def get_insight_reviews(insight_id: str):
    """Get all reviews for an insight."""
    pool = await get_db_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT * FROM insight_reviews WHERE insight_id=$1 ORDER BY created_at DESC",
                insight_id
            )
            results = []
            for row in rows:
                row_dict = dict(row)
                for key, value in row_dict.items():
                    if isinstance(value, uuid.UUID):
                        row_dict[key] = str(value)
                    elif isinstance(value, datetime):
                        row_dict[key] = value.isoformat()
                results.append(row_dict)
            return results
    finally:
        await pool.close()


