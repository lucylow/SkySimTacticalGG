# extract_features.py
# Produces features.csv with one row per player-round.
import json
import csv
from collections import defaultdict
import math

IN_FILE = "mock_valorant_rounds.jsonl"
OUT_FILE = "features.csv"

def safe_mean(xs):
    return sum(xs)/len(xs) if xs else 0.0

with open(IN_FILE, "r", encoding="utf-8") as fh, open(OUT_FILE, "w", newline='', encoding="utf-8") as outfh:
    writer = None
    for line in fh:
        round_obj = json.loads(line)
        round_no = round_obj["round_no"]
        summary = round_obj["round_summary"]
        for pid, evs in round_obj["player_events"].items():
            # basic features
            n_events = len(evs)
            n_shoot = sum(1 for e in evs if e["event_type"]=="shoot")
            mean_latency = safe_mean([e.get("first_shot_latency_ms", 0) for e in evs if e["event_type"]=="shoot"])
            n_ability = sum(1 for e in evs if e["event_type"]=="ability_cast")
            late_smoke_flag = any(e.get("ability")=="smoke" and e.get("phase")=="postplant" for e in evs)
            n_deaths = sum(1 for e in evs if e["event_type"]=="death")
            n_trades = sum(1 for e in evs if e["event_type"]=="trade_attempt")
            # derived normalizations (per round)
            feat = {
                "match_id": round_obj["match_id"],
                "round_no": round_no,
                "player_id": pid,
                "n_events": n_events,
                "n_shoot": n_shoot,
                "mean_latency": mean_latency,
                "n_ability": n_ability,
                "late_smoke": int(late_smoke_flag),
                "n_deaths": n_deaths,
                "n_trades": n_trades,
                "round_total_deaths": summary["total_deaths"],
                "round_late_smokes": summary["late_smokes"],
                # label example: was player dead this round?
                "label_dead": 1 if n_deaths>0 else 0
            }
            if writer is None:
                writer = csv.DictWriter(outfh, fieldnames=list(feat.keys()))
                writer.writeheader()
            writer.writerow(feat)

print("Wrote features to", OUT_FILE)

