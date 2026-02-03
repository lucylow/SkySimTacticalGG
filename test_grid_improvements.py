import asyncio
import json
from datetime import datetime, timezone
from backend.app.grid_normalizer import normalize_grid_event
from backend.app.enricher import _match_state

async def test_grid_analysis():
    print("Testing GRID Analysis Improvements...")
    
    # 1. Test VALORANT Kill with Trade Potential
    match_id = "test_match_valorant"
    # Reset state for test
    if match_id in _match_state:
        del _match_state[match_id]
        
    # Setup positions
    pos_events = [
        {"type": "POSITION_UPDATE", "match_id": match_id, "player_id": "p1", "pos": [10, 10, 0], "ts": 100, "game": "valorant"},
        {"type": "POSITION_UPDATE", "match_id": match_id, "player_id": "p2", "pos": [12, 10, 0], "ts": 100, "game": "valorant"}, # Nearby p1
        {"type": "POSITION_UPDATE", "match_id": match_id, "player_id": "killer", "pos": [50, 50, 0], "ts": 100, "game": "valorant"},
    ]
    
    for evt in pos_events:
        await normalize_grid_event(evt)
        
    # Kill event: killer kills p1. p2 is nearby p1, so trade potential should be 1.
    kill_evt = {
        "type": "KILL",
        "match_id": match_id,
        "killer": "killer",
        "victim": "p1",
        "round_id": "round_1",
        "ts": 105,
        "game": "valorant"
    }
    
    canonical = await normalize_grid_event(kill_evt)
    print(f"VALORANT Kill Enrichment: {json.dumps(canonical.enriched, indent=2)}")
    
    assert canonical.enriched.get("trade_potential_count") == 1
    assert canonical.enriched.get("is_untraded_risk") is False
    
    # 2. Test LoL normalization
    lol_evt = {
        "type": "CHAMPION_KILL",
        "match_id": "test_match_lol",
        "killerId": "player_5",
        "victimId": "player_1",
        "game": "lol"
    }
    canonical_lol = await normalize_grid_event(lol_evt)
    print(f"LoL Actor: {canonical_lol.actor}, Target: {canonical_lol.target}")
    assert canonical_lol.actor == "player_5"
    assert canonical_lol.target == "player_1"

    # 3. Test Objective Control
    obj_evt = {
        "type": "POSITION_UPDATE",
        "match_id": match_id,
        "player_id": "p2",
        "pos": [10, 10, 0],
        "objective_pos": [12, 11, 0], # ~2.23m away
        "ts": 110,
        "game": "valorant"
    }
    canonical_obj = await normalize_grid_event(obj_evt)
    print(f"Objective Control: {json.dumps(canonical_obj.enriched, indent=2)}")
    assert canonical_obj.enriched.get("objective_control") == "ACTIVE"

    print("All tests passed!")

if __name__ == "__main__":
    import sys
    import os
    # Add project root to sys.path
    sys.path.append(os.getcwd())
    asyncio.run(test_grid_analysis())
