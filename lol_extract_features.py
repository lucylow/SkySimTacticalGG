# lol_extract_features.py
# Extract per-player per-match features from Sample_lol_events.jsonl
# Usage: python lol_extract_features.py

import json
import csv
from statistics import mean

IN_FILE = "Sample_lol_events.jsonl"
OUT_FILE = "lol_features.csv"


def safe_mean(xs):
    return mean(xs) if xs else 0.0


def safe_div(a, b):
    return a / b if b else 0.0


with open(IN_FILE, "r", encoding="utf-8") as fh, open(OUT_FILE, "w", newline='', encoding="utf-8") as outfh:
    writer = None
    for line in fh:
        match = json.loads(line)
        match_id = match["match_id"]
        duration_min = match["summary"]["duration_min"]
        player_events = match["player_events"]

        # derive team objective counts
        blue_objs = sum(1 for o in match["summary"]["objectives"] if o["winner"] == "BLUE")
        red_objs = sum(1 for o in match["summary"]["objectives"] if o["winner"] == "RED")

        for pid, evs in player_events.items():
            cs_events = [e for e in evs if e["type"] == "cs"]
            kills = sum(1 for e in evs if e["type"] == "kill")
            assists = sum(1 for e in evs if e["type"] == "assist")
            wards_placed = sum(1 for e in evs if e["type"] == "ward_place")
            wards_cleared = sum(1 for e in evs if e["type"] == "ward_clear")

            # TP reaction time: difference between tp_call and player's tp_start when present
            tp_starts = [e for e in evs if e["type"] == "tp_start"]
            tp_reactions = []
            for e in tp_starts:
                call_ts = e.get("call_ts")
                if call_ts is not None:
                    tp_reactions.append(max(0.0, e["t"] - call_ts))
            tp_reaction_mean = safe_mean(tp_reactions)

            # Roam success rate
            roam_starts = [e for e in evs if e["type"] == "roam_start"]
            roam_outcomes = [e for e in evs if e["type"] == "roam_outcome"]
            roam_success = sum(1 for e in roam_outcomes if e.get("success"))
            roam_rate = safe_div(len(roam_starts), duration_min)
            roam_success_rate = safe_div(roam_success, max(1, len(roam_outcomes)))

            # CS and gold proxies
            cs_total = len(cs_events)
            cs_per_min = safe_div(cs_total, duration_min)
            kda = safe_div(kills + assists, 1)  # deaths not tracked in Sample, use KA as a simple proxy

            # Vision score proxy
            vision_actions = wards_placed + wards_cleared
            vision_per_min = safe_div(vision_actions, duration_min)

            # Team objective influence proxy (share team objectives equally to players of that team not available here; keep match-level for now)
            feat = {
                "match_id": match_id,
                "player_id": pid,
                "duration_min": duration_min,
                "cs_total": cs_total,
                "cs_per_min": round(cs_per_min, 3),
                "kills": kills,
                "assists": assists,
                "ka_sum": kills + assists,
                "kda_proxy": kda,
                "wards_placed": wards_placed,
                "wards_cleared": wards_cleared,
                "vision_per_min": round(vision_per_min, 3),
                "tp_reaction_mean": round(tp_reaction_mean, 3),
                "roam_count": len(roam_starts),
                "roam_rate": round(roam_rate, 3),
                "roam_success_rate": round(roam_success_rate, 3),
                "team_blue_objectives": blue_objs,
                "team_red_objectives": red_objs,
            }

            if writer is None:
                writer = csv.DictWriter(outfh, fieldnames=list(feat.keys()))
                writer.writeheader()
            writer.writerow(feat)

print(f"Wrote LoL features to {OUT_FILE}")

