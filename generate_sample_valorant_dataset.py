# generate_Sample_valorant_dataset.py
# Python 3.8+. Writes Sample_valorant_rounds.jsonl to current directory.
# Usage: python generate_Sample_valorant_dataset.py

import json
import random
import math
from datetime import datetime, timedelta
from uuid import uuid4

SEED = 42
random.seed(SEED)

NUM_ROUNDS = 100
PLAYERS = [
    {"player_id": f"p{idx+1:02d}", "name": f"Player{idx+1}", "role": random.choice(["Duelist","Controller","Initiator","Sentinel"])}
    for idx in range(10)
]
MAP_NAME = "Ascent"
AGENTS = ["Jett","Sage","Viper","Omen","Reyna","Sova","Breach","Brimstone","Killjoy","Phoenix"]

def rand_pos():
    return {"x": round(random.uniform(-2000,2000), 1), "y": round(random.uniform(-2000,2000),1), "z": round(random.uniform(0,200),1)}

def rand_angle():
    return {"yaw": round(random.uniform(-180,180),2), "pitch": round(random.uniform(-20,20),2)}

def sample_events_for_player(round_no, player):
    # produce a short list of events per player for this round (2-6)
    evs = []
    base_ts = round_no * 60.0
    n = random.randint(2,6)
    for i in range(n):
        etype = random.choices(
            population=["movement","ability_cast","shoot","death","assist","trade_attempt"],
            weights=[0.35,0.25,0.25,0.08,0.05,0.02],
            k=1
        )[0]
        ev = {
            "event_id": str(uuid4()),
            "player_id": player["player_id"],
            "agent": random.choice(AGENTS),
            "timestamp": round(base_ts + random.uniform(0,59.9), 3),
            "position": rand_pos(),
            "view_angle": rand_angle(),
            "event_type": etype
        }
        if etype == "ability_cast":
            ev["ability"] = random.choice(["smoke","flash","molotov","healing","recon"])
            # mark timing relative to round phase
            ev["phase"] = random.choices(["early","execute","postplant"], weights=[0.5,0.35,0.15])[0]
        if etype == "shoot":
            ev["shots_fired"] = random.randint(1,6)
            ev["first_shot_latency_ms"] = random.choice([int(random.gauss(220,80)), int(random.gauss(120,40))])
            ev["hit_head"] = random.random() < 0.18
        if ev["event_type"] == "death":
            ev["killed_by"] = random.choice([p["player_id"] for p in PLAYERS if p["player_id"]!=player["player_id"]])
            ev["death_type"] = random.choice(["peek","trade","utility","aim_miss"])
            ev["time_to_revive"] = None
        evs.append(ev)
    return evs

def compute_round_summary(round_no, player_events):
    # compute a few aggregated features per round usable for UI:
    round_kills = 0
    round_deaths = 0
    late_smokes = 0
    entries_success = 0
    entries_attempts = 0
    # simplistic rule-based derivations for demo
    for p, evs in player_events.items():
        for e in evs:
            if e["event_type"] == "death":
                round_deaths += 1
            if e["event_type"] == "shoot" and e.get("first_shot_latency_ms", 999) < 180:
                entries_success += 1
            if e["event_type"] == "ability_cast" and e.get("ability") == "smoke" and e.get("phase") == "postplant":
                late_smokes += 1
    entries_attempts = sum(1 for p, evs in player_events.items() for e in evs if e["event_type"]=="shoot")
    round_kills = max(0, entries_success - int(round_deaths*0.1))  # fake but plausible
    return {
        "round_no": round_no,
        "map": MAP_NAME,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "total_deaths": round_deaths,
        "total_kills": round_kills,
        "late_smokes": late_smokes,
        "entries_success": entries_success,
        "entries_attempts": entries_attempts,
        "winner": random.choice(["attack","defend"])
    }

OUT_FILE = "Sample_valorant_rounds.jsonl"
with open(OUT_FILE, "w", encoding="utf-8") as fh:
    for r in range(1, NUM_ROUNDS+1):
        # per-player events for the round
        player_events = {}
        for pl in PLAYERS:
            player_events[pl["player_id"]] = sample_events_for_player(r, pl)
        summary = compute_round_summary(r, player_events)
        round_obj = {
            "match_id": f"Sample_match_001",
            "round_no": r,
            "map": MAP_NAME,
            "players": PLAYERS,
            "player_events": player_events,
            "round_summary": summary
        }
        fh.write(json.dumps(round_obj) + "\n")

print(f"Wrote {OUT_FILE} with {NUM_ROUNDS} rounds and {len(PLAYERS)} players.")


