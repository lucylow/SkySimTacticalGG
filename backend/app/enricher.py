# app/enricher.py
import math
from datetime import datetime
from typing import Dict, Any
from app.schemas import CanonicalEvent

# simple in-memory match state (for single-process). In prod use Redis or persistent store.
_match_state: Dict[str, Dict[str, Any]] = {}

def _ensure_state(match_id: str):
    if match_id not in _match_state:
        _match_state[match_id] = {
            "last_positions": {},   # player_id -> {"pos": (x,y,z), "t": timestamp}
            "round_econ": {},       # round_id -> {team: econ}
            "last_kills": [],       # recent kill events for streaks
            "round_first_kill": {}, # round_id -> actor
        }
    return _match_state[match_id]

def _distance(a, b):
    return math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2)

async def enrich_canonical(c: CanonicalEvent) -> Dict[str, Any]:
    """
    Add derived signals to canonical event. Keep deterministic and explainable.
    """
    s = _ensure_state(c.match_id)
    payload = c.payload or {}
    enriched = {}

    # 1) Positions -> speed
    # GRID may supply positional sample events: type "position_update" with pos [x,y,z], ts (game time)
    if c.event_type == "POSITION_UPDATE" or payload.get("pos"):
        pid = payload.get("player_id") or c.actor
        pos = payload.get("pos")
        ts = payload.get("ts") or c.ingestion_meta.get("grid_seq") or None
        if pid and pos:
            last = s["last_positions"].get(pid)
            if last and last.get("pos") and ts:
                # compute elapsed in seconds; GRID's ts may be game_time in seconds
                try:
                    elapsed = float(ts) - float(last.get("t"))
                    if elapsed > 0:
                        dist = _distance(pos, last["pos"])
                        speed = dist / elapsed
                        enriched["player_speed_m_s"] = round(speed, 3)
                    else:
                        enriched["player_speed_m_s"] = 0.0
                except Exception:
                    enriched["player_speed_m_s"] = None
            else:
                enriched["player_speed_m_s"] = None
            s["last_positions"][pid] = {"pos": pos, "t": ts}

    # 2) KILL event -> opening_kill & streaks
    if c.event_type == "KILL":
        round_id = payload.get("round_id") or payload.get("round")
        actor = c.actor
        if round_id:
            # opening kill
            if s["round_first_kill"].get(round_id) is None:
                s["round_first_kill"][round_id] = actor
                enriched["opening_kill"] = True
            else:
                enriched["opening_kill"] = False
        # streak detection: count consecutive kills within short timespan
        now = payload.get("ts") or None
        s["last_kills"].append({"actor": actor, "ts": now})
        # keep last 5
        s["last_kills"] = s["last_kills"][-5:]
        # compute streak for same actor in last 10 seconds (approx)
        streak = 0
        for k in reversed(s["last_kills"]):
            if k["actor"] == actor:
                streak += 1
            else:
                break
        enriched["multi_kill_streak"] = streak

    # 3) Economy events -> team econ delta relative to round start
    if c.event_type in ("ECONOMY_UPDATE", "BUY", "ROUND_START"):
        round_id = payload.get("round") or payload.get("round_id")
        if round_id:
            if c.event_type == "ROUND_START":
                s["round_econ"][round_id] = {
                    "teamA": payload.get("teamA_bank"),
                    "teamB": payload.get("teamB_bank")
                }
                enriched["team_econ_delta"] = None
            else:
                prev = s["round_econ"].get(round_id)
                if prev:
                    team = payload.get("team")
                    # compute delta vs previous snapshot or round start
                    if team and prev.get(team) is not None:
                        new = payload.get("bank", prev.get(team))
                        delta = new - prev[team]
                        enriched["team_econ_delta"] = delta
                    else:
                        enriched["team_econ_delta"] = None

    # 4) proximity to objective (bomb site) if position and site coords available
    if payload.get("pos") and payload.get("objective_pos"):
        pos = payload.get("pos")
        obj = payload.get("objective_pos")
        dist = _distance(pos, obj)
        enriched["dist_to_objective_m"] = round(dist, 2)

    # 5) default passthrough enriched metadata: compute confidence placeholders
    # (real confidence comes from models, but we can provide heuristic confidence)
    if c.event_type in ("KILL", "OBJECTIVE", "ROUND_END"):
        enriched.setdefault("heuristic_confidence", 0.5)

    # 6) attach ingestion meta for auditing
    enriched["_ingestion"] = c.ingestion_meta

    return enriched

