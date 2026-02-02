# app/api.py
import os
import uvicorn
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.celery_orchestrator import run_orchestration   # celery task from earlier
from app.ws_broadcast import broadcaster
from app.api_data import router as data_router
from app.api_hitl import router as hitl_router
from app.ws_replay import router as replay_router
from app.narrative import router as narrative_router
from app.api_motion import router as motion_router
from app.db import init_db
from app.metrics import metrics_response
import structlog

log = structlog.get_logger()

app = FastAPI(title="Agents Orchestrator API")

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
app.include_router(replay_router)
app.include_router(narrative_router, prefix="/api/v1", tags=["narrative"])
app.include_router(motion_router)

@app.post("/api/v1/orchestrate")
async def start_orchestration(payload: dict):
    """
    Start orchestration. This enqueues a Celery task and returns the job id.
    Expect payload to include match_id, round, grid_snapshot, etc.
    """
    try:
        if not payload:
            raise HTTPException(status_code=400, detail="payload is required")
        
        if not payload.get("match_id"):
            raise HTTPException(status_code=400, detail="missing match_id")
        
        try:
            async_result = run_orchestration.delay(payload)
            log.info("Orchestration task enqueued", job_id=async_result.id, match_id=payload.get("match_id"))
            return JSONResponse({"job_id": async_result.id})
        except Exception as e:
            log.error("Failed to enqueue orchestration task", error=str(e), exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to enqueue orchestration task")
    except HTTPException:
        raise
    except Exception as e:
        log.error("Unexpected error in start_orchestration", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Internal server error")

@app.websocket("/ws/agents")
async def ws_agents(ws: WebSocket):
    """
    Clients connect here to receive progress events (published to Redis channel by orchestrator/tasks).
    The broadcaster handles subscribing to Redis on app import.
    """
    try:
        await broadcaster.connect(ws)
        log.info("WebSocket client connected to /ws/agents")
    except Exception as e:
        log.error("Failed to connect WebSocket client", error=str(e), exc_info=True)
        try:
            await ws.close(code=1011, reason="Internal server error during connection")
        except Exception:
            pass
        return
    
    try:
        # keep connection open. Allow client pings (but we don't need to read).
        while True:
            try:
                # wait for client messages (ping/pong) to detect disconnects
                await ws.receive_text()
            except WebSocketDisconnect:
                log.info("WebSocket client disconnected normally")
                break
            except Exception as e:
                log.error("Error receiving WebSocket message", error=str(e), exc_info=True)
                break
    except Exception as e:
        log.error("Unexpected error in WebSocket handler", error=str(e), exc_info=True)
    finally:
        try:
            await broadcaster.disconnect(ws)
        except Exception as e:
            log.error("Error disconnecting WebSocket client", error=str(e), exc_info=True)

# optional: health endpoint
@app.get("/health")
def health():
    return {"ok": True}

# Prometheus metrics endpoint
@app.get("/metrics")
async def metrics():
    try:
        return metrics_response()
    except Exception as e:
        log.error("Error generating metrics", error=str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate metrics")

@app.on_event("startup")
async def startup_event():
    """Initialize database and WebSocket broadcaster on startup."""
    try:
        init_db()
        log.info("Database initialized successfully")
    except Exception as e:
        log.error("Failed to initialize database", error=str(e), exc_info=True)
        raise
    
    try:
        broadcaster.set_event_loop(asyncio.get_event_loop())
        log.info("WebSocket broadcaster initialized")
    except Exception as e:
        log.error("Failed to initialize WebSocket broadcaster", error=str(e), exc_info=True)
        raise

# If running as main process
if __name__ == "__main__":
    uvicorn.run("app.api:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)), reload=False)

