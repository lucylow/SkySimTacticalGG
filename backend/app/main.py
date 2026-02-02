# app/main.py
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api_data import router as data_router
from app.api_hitl import router as hitl_router
from app.api_predictions import router as predictions_router
from app.analytics.api import router as analytics_router
from app.api_opensource import router as opensource_router
from app.db import init_db
from app.grid_client import connect_ws, rest_backfill
from app.grid_storage import persist_raw_event, publish_canonical
from app.grid_normalizer import normalize_grid_event
from app.settings import settings
import os
import asyncio
import logging

logger = logging.getLogger("uvicorn")

app = FastAPI(
    title="Agent Data API",
    description="API for managing AI agent runs, artifacts, and metrics",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(data_router)
app.include_router(hitl_router)
app.include_router(predictions_router)
app.include_router(analytics_router)
app.include_router(opensource_router)

# background ws task handle
_ws_task = None

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup."""
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}", exc_info=True)
        raise
    # optional: start websocket in background
    # loop = asyncio.get_event_loop()
    # global _ws_task
    # _ws_task = loop.create_task(connect_ws())

@app.on_event("shutdown")
async def shutdown_event():
    global _ws_task
    if _ws_task:
        try:
            _ws_task.cancel()
            await _ws_task
        except asyncio.CancelledError:
            pass
        except Exception as e:
            logger.error(f"Error cancelling WebSocket task: {e}", exc_info=True)
        finally:
            _ws_task = None

@app.get("/")
async def root():
    return {"message": "Agent Data API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/webhook/grid")
async def grid_webhook(req: Request):
    """
    GRID can POST events to this endpoint. We persist raw, normalize & publish.
    Keep lightweight to ack quickly (store raw, enqueue to worker to normalize).
    """
    try:
        try:
            raw = await req.json()
        except Exception as e:
            logger.error(f"Failed to parse JSON payload: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid JSON payload: {str(e)}")
        
        if not raw:
            raise HTTPException(status_code=400, detail="empty payload")
        
        # persist raw (idempotent)
        try:
            persist_raw_event(raw)
        except Exception as e:
            logger.error(f"Failed to persist raw event: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to persist raw event")
        
        # synchronous normalize & publish (or push to Celery for heavy pipelines)
        try:
            canonical = await normalize_grid_event(raw)
        except Exception as e:
            logger.error(f"Failed to normalize grid event: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to normalize event")
        
        try:
            await publish_canonical(canonical.dict())
        except Exception as e:
            logger.error(f"Failed to publish canonical event: {e}", exc_info=True)
            # Don't fail the request if publish fails - event is already persisted
            logger.warning("Event persisted but publish failed, continuing")
        
        return {"ok": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in grid_webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error processing webhook")

@app.post("/backfill")
async def backfill(matches: list[str], background: BackgroundTasks):
    """
    Trigger REST backfill. Non-blocking.
    """
    if not matches:
        raise HTTPException(status_code=400, detail="matches list cannot be empty")
    
    if not isinstance(matches, list):
        raise HTTPException(status_code=400, detail="matches must be a list")
    
    try:
        background.add_task(rest_backfill, matches)
        logger.info(f"Scheduled backfill for {len(matches)} matches")
        return {"status": "backfill scheduled", "matches": matches}
    except Exception as e:
        logger.error(f"Failed to schedule backfill: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to schedule backfill")
