# generate_sample_lol_dataset.py
# Writes Sample_lol_events.jsonl with synthetic League of Legends events.
# Usage: python generate_sample_lol_dataset.py

import json
import random
from uuid import uuid4
from datetime import datetime, timedelta

SEED = 1337
random.seed(SEED)

TEAMS = ["BLUE", "RED"]
ROLES = ["TOP", "JUNGLE", "MID", "ADC", "SUPPORT"]
CHAMPIONS = [
    "Aatrox","Ahri","Annie","Ashe","Blitzcrank","Caitlyn","Darius","Ekko","Ezreal","Garen",
    "Jinx","Kaisa","Katarina","LeBlanc","LeeSin","Lux","Malphite","Orianna","Riven","Thresh"
]

NUM_MATCHES = 10
GAME_DURATION_MIN = 30


def gen_players(team):
    players = []
    for i, role in enumerate(ROLES):
        players.append({
            "player_id": f"{team[:1]}{i+1:02d}",
            "summoner": f"{team}_{role}",
            "team": team,
            "role": role,
            "champion": random.choice(CHAMPIONS)
        })
    return players


def sample_events_for_player(player, match_id):
    events = []
    time = 0.0
    # CS events roughly each 20-40 seconds in lane
    for m in range(GAME_DURATION_MIN):
        minute_ts = m * 60.0
        # CS
        cs_count = random.randint(0, 6) if player["role"] != "SUPPORT" else random.randint(0, 2)
        for _ in range(cs_count):
            ts = minute_ts + random.uniform(0, 59)
            events.append({
                "id": str(uuid4()),
                "t": round(ts, 1),
                "type": "cs",
                "lane_pressure": random.choice(["push","even","pull"])
            })
        # ability cast
        if random.random() < 0.6:
            events.append({"id": str(uuid4()), "t": minute_ts + random.uniform(0, 59), "type": "ability_cast", "spell": random.choice(["Q","W","E","R"])})
        # ward events
        if random.random() < 0.25:
            events.append({"id": str(uuid4()), "t": minute_ts + random.uniform(0, 59), "type": "ward_place", "ward": random.choice(["trinket","control"])})
        if random.random() < 0.15:
            events.append({"id": str(uuid4()), "t": minute_ts + random.uniform(0, 59), "type": "ward_clear"})
        # roam events (mid game)
        if 8 <= m <= 22 and random.random() < (0.25 if player["role"] in ["MID","JUNGLE","SUPPORT"] else 0.1):
            start_ts = minute_ts + random.uniform(0, 59)
            success = random.random() < 0.5
            events.append({"id": str(uuid4()), "t": round(start_ts,1), "type": "roam_start"})
            outcome_ts = start_ts + random.uniform(10, 40)
            events.append({"id": str(uuid4()), "t": round(outcome_ts,1), "type": "roam_outcome", "success": success})
        # kills/assists (stochastic)
        if random.random() < 0.12:
            events.append({"id": str(uuid4()), "t": minute_ts + random.uniform(0, 59), "type": "kill"})
        if random.random() < 0.20:
            events.append({"id": str(uuid4()), "t": minute_ts + random.uniform(0, 59), "type": "assist"})
    # teleport coordination: create team-wide TP call moments separately (handled at match level)
    return sorted(events, key=lambda e: e["t"])


def generate_match(idx):
    match_id = f"Sample_lol_match_{idx:03d}"
    blue = gen_players("BLUE")
    red = gen_players("RED")
    players = blue + red

    # Per-player events
    player_events = {}
    for p in players:
        player_events[p["player_id"]] = sample_events_for_player(p, match_id)

    # Team-level objective timeline
    objectives = []
    for m in range(6, GAME_DURATION_MIN, 5):
        ts = m * 60.0 + random.uniform(0, 59)
        obj = random.choice(["DRAGON","HERALD","TOWER","BARON"]) if m > 18 else random.choice(["DRAGON","HERALD","TOWER"]) 
        winner = random.choice(["BLUE","RED"]) if obj != "TOWER" else random.choice(["BLUE","RED"])  # tower credited to a team
        objectives.append({"t": round(ts,1), "type": "objective", "name": obj, "winner": winner})

    # TP call & responses (a few per match)
    tp_calls = []
    for _ in range(random.randint(2, 5)):
        call_ts = random.uniform(6*60, 25*60)
        tp_calls.append({
            "t": round(call_ts,1),
            "type": "tp_call",
            "location": random.choice(["TOP","MID","BOT","BARON","DRAGON"]),
            "team": random.choice(["BLUE","RED"]) 
        })
        # generate responses per player on that team
        for p in (blue if tp_calls[-1]["team"] == "BLUE" else red):
            if random.random() < (0.65 if p["role"] in ["TOP","MID","JUNGLE"] else 0.25):
                response_delay = random.uniform(0, 8)
                player_events[p["player_id"]].append({
                    "id": str(uuid4()),
                    "t": round(call_ts + response_delay,1),
                    "type": "tp_start",
                    "call_ts": round(call_ts,1)
                })

    # sort per player
    for pid in player_events:
        player_events[pid] = sorted(player_events[pid], key=lambda e: e["t"])

    summary = {
        "match_id": match_id,
        "duration_min": GAME_DURATION_MIN,
        "objectives": objectives,
        "tp_calls": tp_calls,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

    return {
        "match_id": match_id,
        "players": blue + red,
        "player_events": player_events,
        "summary": summary
    }


OUT = "Sample_lol_events.jsonl"
with open(OUT, "w", encoding="utf-8") as fh:
    for i in range(1, NUM_MATCHES + 1):
        match = generate_match(i)
        fh.write(json.dumps(match) + "\n")

print(f"Wrote {OUT} with {NUM_MATCHES} matches.")

