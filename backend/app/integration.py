"""
Integration service that wires everything together.
Connects ingestion → metrics → agents → WebSocket → viewer.
"""
from app.metrics import (
    INGEST_EVENTS_TOTAL, INGEST_LATENCY, AGENT_SIGNALS_TOTAL,
    AGENT_CONFIDENCE_AVG, REVIEW_QUEUE_DEPTH
)
from app.ws_replay import broadcast_event
from app.agents.ml.momentum_agent import momentum_agent
from app.ml.features import OnlineFeatureExtractor
from app.signal_gating import signal_gate
from typing import Dict, List
import time


class IntegrationService:
    """Orchestrates the full pipeline."""
    
    def __init__(self):
        self.feature_extractor = OnlineFeatureExtractor()
        self.active_matches = {}
    
    async def process_event(self, event: Dict):
        """
        Process a canonical event through the full pipeline:
        1. Record metrics
        2. Extract features
        3. Run ML agents
        4. Gate signals
        5. Broadcast to viewers
        """
        start_time = time.time()
        event_type = event.get("event_type", "UNKNOWN")
        game = event.get("game", "unknown")
        match_id = event.get("match_id", "unknown")
        
        # 1. Metrics
        INGEST_EVENTS_TOTAL.labels(
            game=game,
            tournament=event.get("tournament", "unknown"),
            event_type=event_type
        ).inc()
        
        # 2. Update feature extractor
        self.feature_extractor.update(event)
        
        # 3. Run ML agents (every N events or on key events)
        if event_type in ["ROUND_END", "KILL"]:
            team = event.get("team")
            if team:
                features = self.feature_extractor.snapshot(team)
                signal = momentum_agent.infer(features)
                
                if signal:
                    # Add metadata
                    signal["match_id"] = match_id
                    signal["timestamp"] = event.get("timestamp")
                    signal["status"] = "PENDING_REVIEW"
                    
                    # Record agent metrics
                    AGENT_SIGNALS_TOTAL.labels(
                        agent="momentum",
                        type=signal["type"],
                        status="PENDING_REVIEW"
                    ).inc()
                    AGENT_CONFIDENCE_AVG.labels(
                        agent="momentum",
                        type=signal["type"]
                    ).observe(signal["confidence"])
                    
                    # Gate signal
                    gated = signal_gate.gate(signal)
                    
                    if gated:
                        # Broadcast to WebSocket viewers
                        await broadcast_event({
                            "type": "AGENT_SIGNAL",
                            **gated
                        })
        
        # 4. Broadcast event to replay viewer
        await broadcast_event(event)
        
        # 5. Record latency
        latency = time.time() - start_time
        INGEST_LATENCY.observe(latency)


# Global service instance
integration_service = IntegrationService()


