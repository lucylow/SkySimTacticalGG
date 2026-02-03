# extract_features.py
# Produces features.csv with one row per player-round.
import json
import csv
from collections import defaultdict
import math

IN_FILE = "mock_valorant_rounds.jsonl"
OUT_FILE = "features.csv"


def safe_mean(xs):
    return sum(xs) / len(xs) if xs else 0.0


def safe_div(a, b):
    return a / b if b else 0.0


with open(IN_FILE, "r", encoding="utf-8") as fh, open(OUT_FILE, "w", newline='', encoding="utf-8") as outfh:
    writer = None
    for line in fh:
        round_obj = json.loads(line)
        round_no = round_obj["round_no"]
        summary = round_obj["round_summary"]
        for pid, evs in round_obj["player_events"].items():
            # basic features
            n_events = len(evs)
            shoot_events = [e for e in evs if e["event_type"] == "shoot"]
            n_shoot = len(shoot_events)
            latencies = [e.get("first_shot_latency_ms", 0) for e in shoot_events]
            mean_latency = safe_mean(latencies)
            min_latency = min(latencies) if latencies else 0.0
            fast_shots = sum(1 for e in shoot_events if e.get("first_shot_latency_ms", 999) < 180)
            headshots = sum(1 for e in shoot_events if e.get("hit_head", False))

            ability_events = [e for e in evs if e["event_type"] == "ability_cast"]
            n_ability = len(ability_events)
            execute_smokes = sum(1 for e in ability_events if e.get("ability") == "smoke" and e.get("phase") == "execute")
            postplant_smokes = sum(1 for e in ability_events if e.get("ability") == "smoke" and e.get("phase") == "postplant")
            late_smoke_flag = 1 if postplant_smokes > 0 else 0

            n_deaths = sum(1 for e in evs if e["event_type"] == "death")
            n_kills = sum(1 for e in evs if e["event_type"] == "kill")  # Added kill count
            n_trades = sum(1 for e in evs if e["event_type"] == "trade_attempt")

            # More advanced features
            kd_ratio = safe_div(n_kills, max(1, n_deaths))
            accuracy = safe_div(n_kills, n_shoot)  # Rough proxy for accuracy
            headshot_rate = safe_div(headshots, n_shoot)
            fast_shot_rate = safe_div(fast_shots, n_shoot)
            ability_rate = safe_div(n_ability, n_events)
            execute_to_postplant_smoke_ratio = safe_div(execute_smokes, postplant_smokes) if postplant_smokes else (execute_smokes if execute_smokes else 0.0)

            # derived normalizations (per round)
            feat = {
                "match_id": round_obj["match_id"],
                "round_no": round_no,
                "player_id": pid,
                "n_events": n_events,
                "n_shoot": n_shoot,
                "mean_latency": mean_latency,
                "min_latency": min_latency,
                "fast_shots": fast_shots,
                "headshots": headshots,
                "n_ability": n_ability,
                "execute_smokes": execute_smokes,
                "postplant_smokes": postplant_smokes,
                "late_smoke": late_smoke_flag,
                "n_deaths": n_deaths,
                "n_kills": n_kills,
                "n_trades": n_trades,
                "kd_ratio": kd_ratio,
                "accuracy": accuracy,
                "headshot_rate": headshot_rate,
                "fast_shot_rate": fast_shot_rate,
                "ability_rate": ability_rate,
                "execute_to_postplant_smoke_ratio": execute_to_postplant_smoke_ratio,
                "round_total_deaths": summary["total_deaths"],
                "round_late_smokes": summary["late_smokes"],
                # label example: was player dead this round?
                "label_dead": 1 if n_deaths > 0 else 0,
            }
            if writer is None:
                writer = csv.DictWriter(outfh, fieldnames=list(feat.keys()))
                writer.writeheader()
            writer.writerow(feat)

print("Wrote features to", OUT_FILE)

