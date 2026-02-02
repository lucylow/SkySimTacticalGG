# app/analytics/aggregate.py
"""
Aggregate micro_actions per round/team into feature vectors for correlation and modeling.
"""
import asyncpg
import pandas as pd
import json
from datetime import datetime
from app.settings import settings


async def extract_round_features(pg_pool):
    """
    Build a DataFrame with one row per (round_id, team) containing:
      - counts of intents by type (advance_count, hold_count, plant_count,...)
      - mean confidence per intent
      - aggregate motion features (mean speed, avg approach_velocity)
      - econ_delta, site_executed (from rounds / macro_outcomes)
      - outcome: round_win boolean
    """
    async with pg_pool.acquire() as conn:
        rows = await conn.fetch("""
        SELECT 
            r.id as round_id, 
            r.match_id, 
            r.round_no, 
            r.winner_team, 
            r.economy_snapshot, 
            r.site_executed as round_site_executed,
            ma.team,
            jsonb_agg(
                jsonb_build_object(
                    'intent', ma.intent, 
                    'confidence', ma.confidence, 
                    'features', ma.features
                )
            ) FILTER (WHERE ma.id IS NOT NULL) as micro_actions,
            mo.round_win,
            mo.econ_delta,
            mo.site_executed
        FROM rounds r
        LEFT JOIN micro_actions ma ON ma.round_id = r.id
        LEFT JOIN macro_outcomes mo ON mo.round_id = r.id AND mo.team = ma.team
        WHERE r.round_end IS NOT NULL
        GROUP BY r.id, r.match_id, r.round_no, r.winner_team, r.economy_snapshot, 
                 r.site_executed, ma.team, mo.round_win, mo.econ_delta, mo.site_executed
        ORDER BY r.match_id, r.round_no, ma.team
        """)
        
        # Convert to pandas DataFrame
        recs = []
        for row in rows:
            micro = row["micro_actions"] or []
            
            # Compute per-team aggregates
            intents = {}
            confs = {}
            speeds = []
            approach = []
            rotations = []
            positions = []
            
            for m in micro:
                if not m:
                    continue
                intent = m.get("intent")
                if intent:
                    intents[intent] = intents.get(intent, 0) + 1
                    conf = m.get("confidence")
                    if conf is not None:
                        confs.setdefault(intent, []).append(float(conf))
                
                features = m.get("features") or {}
                if isinstance(features, str):
                    try:
                        features = json.loads(features)
                    except:
                        features = {}
                
                if features.get("speed_mean") is not None:
                    speeds.append(float(features["speed_mean"]))
                if features.get("approach_velocity") is not None:
                    approach.append(float(features["approach_velocity"]))
                if features.get("rotation_speed") is not None:
                    rotations.append(float(features["rotation_speed"]))
                if features.get("position_x") is not None and features.get("position_y") is not None:
                    positions.append((float(features["position_x"]), float(features["position_y"])))
            
            # Calculate mean confidence
            all_confs = [c for cl in confs.values() for c in cl]
            mean_confidence = float(sum(all_confs) / len(all_confs)) if all_confs else 0.0
            
            # Build flat record
            rec = {
                "round_id": str(row["round_id"]),
                "match_id": row["match_id"],
                "round_no": row["round_no"],
                "team": row["team"],
                "winner_team": row["winner_team"],
                "round_win": bool(row["round_win"]) if row["round_win"] is not None else None,
                "site_executed": bool(row["site_executed"]) if row["site_executed"] is not None else (bool(row["round_site_executed"]) if row["round_site_executed"] is not None else None),
                "econ_delta": int(row["econ_delta"]) if row["econ_delta"] is not None else None,
                "econ_snapshot": row["economy_snapshot"],
                "total_actions": sum(intents.values()) if intents else 0,
                "advance_count": intents.get("advance", 0),
                "hold_count": intents.get("hold", 0),
                "plant_count": intents.get("plant", 0),
                "engage_count": intents.get("engage", 0),
                "retreat_count": intents.get("retreat", 0),
                "rotate_count": intents.get("rotate", 0),
                "mean_confidence": mean_confidence,
                "speed_mean": float(sum(speeds) / len(speeds)) if speeds else 0.0,
                "approach_mean": float(sum(approach) / len(approach)) if approach else 0.0,
                "rotation_mean": float(sum(rotations) / len(rotations)) if rotations else 0.0,
                "action_diversity": len(intents),  # number of unique intent types
            }
            recs.append(rec)
        
        df = pd.DataFrame.from_records(recs)
        return df


