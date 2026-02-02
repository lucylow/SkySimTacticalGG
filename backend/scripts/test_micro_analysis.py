# scripts/test_micro_analysis.py
import asyncio
import json
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.agents.micro_analysis import handle_canonical_event

sample_event = {
    "event_id": "evt_test_1",
    "match_id": "match_demo_1",
    "event_type": "POSITION_UPDATE",
    "actor": "player:demo_p1",
    "timestamp": "2026-01-01T12:00:00Z",
    "payload": {
        "pos": [12.4, 0, 8.9],
        "objective_pos": [10.0, 0, 10.0],
        "ts": 100.0
    }
}

async def test():
    print("Testing micro_analysis with sample event...")
    try:
        await handle_canonical_event(sample_event)
        print("✓ Event processed successfully")
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())


