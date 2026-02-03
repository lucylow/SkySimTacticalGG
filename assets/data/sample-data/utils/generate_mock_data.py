#!/usr/bin/env python3
"""
Sample Esports Data Generator

Generates comprehensive Sample esports data in multiple formats:
- JSON (single match archive, multi-tournament)
- CSV (events, player stats, agent signals, reviews)
- Redis Stream commands
- Replay simulator support

Usage:
    python generate_Sample_data.py --format json --output single_match.json
    python generate_Sample_data.py --format csv --output-dir ./exports
    python generate_Sample_data.py --format redis --output redis_commands.txt
"""

import json
import csv
import uuid
import argparse
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from pathlib import Path
import random

# Constants
WEAPONS = ["AK47", "M4A4", "AWP", "Glock", "USP-S", "Desert Eagle", "FAMAS", "Galil"]
MAPS = ["de_mirage", "de_inferno", "de_dust2", "de_cache", "de_overpass", "de_ancient", "de_vertigo"]
ROLES = ["Entry", "AWP", "Support", "Lurker", "IGL"]
TEAM_NAMES = [
    ("Team Alpha", "NA"), ("Team Bravo", "EU"), ("Team Charlie", "NA"),
    ("Team Delta", "EU"), ("Team Echo", "NA"), ("Team Foxtrot", "EU")
]
EVENT_TYPES = ["ROUND_START", "KILL", "ASSIST", "OBJECTIVE", "ROUND_END", "MAP_END"]


def generate_player_id(team_id: str, player_num: int) -> str:
    return f"{team_id}_p{player_num}"


def generate_event_id(event_num: int) -> str:
    return f"evt_{event_num:06d}"


def generate_signal_id(signal_num: int) -> str:
    return f"sig_{signal_num:03d}"


def generate_round(round_num: int, start_time: datetime, map_id: str, 
                   team_alpha_id: str, team_bravo_id: str, 
                   alpha_wins: bool, event_counter: int) -> Tuple[Dict, int]:
    """Generate a single round with events."""
    round_duration = timedelta(seconds=random.randint(60, 180))
    round_start = start_time
    round_end = round_start + round_duration
    
    events = []
    
    # ROUND_START
    events.append({
        "event_id": generate_event_id(event_counter),
        "event_type": "ROUND_START",
        "timestamp": round_start.isoformat() + "Z"
    })
    event_counter += 1
    
    # Generate kills (4-9 kills per round)
    num_kills = random.randint(4, 9)
    kill_events = []
    for _ in range(num_kills):
        actor_team = random.choice([team_alpha_id, team_bravo_id])
        target_team = team_bravo_id if actor_team == team_alpha_id else team_alpha_id
        actor_player = random.choice([f"{actor_team}_p{i}" for i in range(1, 6)])
        target_player = random.choice([f"{target_team}_p{i}" for i in range(1, 6)])
        
        kill_time = round_start + timedelta(seconds=random.randint(5, round_duration.seconds - 10))
        kill_events.append({
            "event_id": generate_event_id(event_counter),
            "event_type": "KILL",
            "actor": f"player:{actor_player}",
            "target": f"player:{target_player}",
            "team": actor_team,
            "payload": {
                "weapon": random.choice(WEAPONS),
                "headshot": random.random() > 0.7,
                "trade": False
            },
            "timestamp": kill_time.isoformat() + "Z"
        })
        event_counter += 1
    
    events.extend(sorted(kill_events, key=lambda e: e["timestamp"]))
    
    # Objective event (50% chance)
    if random.random() > 0.5:
        obj_time = round_start + timedelta(seconds=random.randint(30, round_duration.seconds - 30))
        events.append({
            "event_id": generate_event_id(event_counter),
            "event_type": "OBJECTIVE",
            "team": team_alpha_id if alpha_wins else team_bravo_id,
            "payload": {
                "objective": "BOMB_PLANT",
                "site": random.choice(["A", "B"])
            },
            "timestamp": obj_time.isoformat() + "Z"
        })
        event_counter += 1
    
    # ROUND_END
    events.append({
        "event_id": generate_event_id(event_counter),
        "event_type": "ROUND_END",
        "payload": {
            "winner": team_alpha_id if alpha_wins else team_bravo_id,
            "win_condition": random.choice(["ELIMINATION", "BOMB_EXPLODED", "DEFUSE", "TIME"])
        },
        "timestamp": round_end.isoformat() + "Z"
    })
    event_counter += 1
    
    round_data = {
        "round_number": round_num,
        "start_time": round_start.isoformat() + "Z",
        "economy": {
            team_alpha_id: random.randint(2000, 16000),
            team_bravo_id: random.randint(2000, 16000)
        },
        "events": sorted(events, key=lambda e: e["timestamp"])
    }
    
    return round_data, event_counter


def generate_map(map_num: int, match_id: str, start_time: datetime,
                 team_alpha_id: str, team_bravo_id: str, 
                 target_score: int, event_counter: int) -> Tuple[Dict, int, datetime]:
    """Generate a map with rounds."""
    map_id = f"{match_id}_map_{map_num}"
    map_name = random.choice(MAPS)
    
    # Generate score
    alpha_score = target_score
    bravo_score = random.randint(0, target_score - 1) if alpha_score == target_score else target_score
    
    total_rounds = alpha_score + bravo_score
    
    rounds = []
    current_time = start_time
    
    # Generate rounds
    for round_num in range(1, total_rounds + 1):
        # Determine winner (alternate to create realistic flow)
        alpha_wins = round_num <= alpha_score or (round_num - alpha_score) % 2 == 0
        if len(rounds) > 0 and rounds[-1]["events"][-1]["payload"]["winner"] == team_alpha_id:
            alpha_wins = random.random() > 0.4  # Tendency to continue winning
        
        round_data, event_counter = generate_round(
            round_num, current_time, map_id,
            team_alpha_id, team_bravo_id, alpha_wins, event_counter
        )
        rounds.append(round_data)
        
        # Advance time
        last_event = round_data["events"][-1]
        last_event_time = datetime.fromisoformat(last_event["timestamp"].replace("Z", ""))
        current_time = last_event_time + timedelta(seconds=30)
    
    map_data = {
        "map_id": map_id,
        "map_name": map_name,
        "winner": team_alpha_id if alpha_score > bravo_score else team_bravo_id,
        "final_score": {
            team_alpha_id: alpha_score,
            team_bravo_id: bravo_score
        },
        "rounds": rounds
    }
    
    return map_data, event_counter, current_time


def generate_match_archive(match_id: str, tournament_id: str, 
                          team_alpha_name: str, team_bravo_name: str,
                          team_alpha_region: str, team_bravo_region: str,
                          start_time: datetime) -> Dict[str, Any]:
    """Generate a complete match archive."""
    team_alpha_id = f"team_{team_alpha_name.lower().replace(' ', '_')}"
    team_bravo_id = f"team_{team_bravo_name.lower().replace(' ', '_')}"
    
    # Generate teams
    teams = [
        {
            "team_id": team_alpha_id,
            "name": team_alpha_name,
            "region": team_alpha_region,
            "players": [
                {
                    "player_id": generate_player_id(team_alpha_id, i),
                    "handle": random.choice(["Apex", "Viper", "Ghost", "Nova", "Pulse", "Rex", "Frost"]),
                    "role": ROLES[i-1]
                }
                for i in range(1, 6)
            ]
        },
        {
            "team_id": team_bravo_id,
            "name": team_bravo_name,
            "region": team_bravo_region,
            "players": [
                {
                    "player_id": generate_player_id(team_bravo_id, i),
                    "handle": random.choice(["Ion", "Shade", "Atlas", "Cipher", "Blade", "Phantom"]),
                    "role": ROLES[i-1]
                }
                for i in range(1, 6)
            ]
        }
    ]
    
    # Generate maps (best of 3)
    maps = []
    event_counter = 1
    current_time = start_time
    maps_won_alpha = 0
    maps_won_bravo = 0
    best_of = 3
    
    for map_num in range(1, best_of + 1):
        target_score = 16
        map_data, event_counter, current_time = generate_map(
            map_num, match_id, current_time,
            team_alpha_id, team_bravo_id, target_score, event_counter
        )
        maps.append(map_data)
        
        if map_data["winner"] == team_alpha_id:
            maps_won_alpha += 1
        else:
            maps_won_bravo += 1
        
        # Stop if team won majority
        if maps_won_alpha >= 2 or maps_won_bravo >= 2:
            break
        
        current_time += timedelta(minutes=5)  # Break between maps
    
    # Determine match winner
    match_winner = team_alpha_id if maps_won_alpha > maps_won_bravo else team_bravo_id
    
    # Generate derived statistics (simplified)
    player_stats = {}
    for team in teams:
        for player in team["players"]:
            player_stats[player["player_id"]] = {
                "kills": random.randint(15, 30),
                "deaths": random.randint(12, 25),
                "assists": random.randint(3, 12),
                "adr": round(random.uniform(70, 110), 1)
            }
    
    team_stats = {
        team_alpha_id: {
            "rounds_won": sum(m["final_score"][team_alpha_id] for m in maps),
            "eco_round_wins": random.randint(1, 4),
            "clutches_won": random.randint(2, 5)
        },
        team_bravo_id: {
            "rounds_won": sum(m["final_score"][team_bravo_id] for m in maps),
            "eco_round_wins": random.randint(0, 3),
            "clutches_won": random.randint(1, 4)
        }
    }
    
    # Generate agent insights
    agent_insights = [
        {
            "signal_id": generate_signal_id(1),
            "agent": "momentum_reasoner",
            "type": "MOMENTUM_SHIFT",
            "team": match_winner,
            "confidence": round(random.uniform(0.75, 0.95), 2),
            "explanation": {
                "rounds_won_in_row": random.randint(3, 5),
                "eco_rounds_won": random.randint(1, 2),
                "key_player": random.choice(teams[0]["players"])["player_id"] if match_winner == team_alpha_id else random.choice(teams[1]["players"])["player_id"]
            },
            "generated_at": (current_time - timedelta(minutes=10)).isoformat() + "Z",
            "status": "PENDING_REVIEW"
        }
    ]
    
    # Generate human reviews (some approved)
    human_review = []
    for signal in agent_insights:
        if random.random() > 0.3:  # 70% approved
            human_review.append({
                "review_id": f"rev_{len(human_review) + 1:03d}",
                "signal_id": signal["signal_id"],
                "reviewer": f"user_reviewer_{random.randint(1, 100)}",
                "decision": "APPROVED",
                "notes": "Signal aligns with match timeline",
                "reviewed_at": (datetime.fromisoformat(signal["generated_at"].replace("Z", "")) + timedelta(minutes=5)).isoformat() + "Z"
            })
    
    # Generate audit log
    audit_log = [
        {
            "action": "MATCH_START",
            "actor": "system",
            "timestamp": start_time.isoformat() + "Z",
            "details": f"Match {match_id} started"
        }
    ]
    
    for signal in agent_insights:
        audit_log.append({
            "action": "AGENT_SIGNAL_CREATED",
            "actor": signal["agent"],
            "timestamp": signal["generated_at"],
            "details": signal["signal_id"]
        })
    
    for review in human_review:
        audit_log.append({
            "action": "HUMAN_APPROVAL",
            "actor": review["reviewer"],
            "timestamp": review["reviewed_at"],
            "details": f"{review['signal_id']} {review['decision'].lower()}"
        })
    
    archive = {
        "metadata": {
            "source": "Sample_GRID_COMPATIBLE",
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "game": "cs2",
            "version": "1.0",
            "description": "Synthetic esports match data for demos, AI agents, and dashboards"
        },
        "tournament": {
            "tournament_id": tournament_id,
            "name": tournament_id.replace("_", " ").title(),
            "organizer": "Sample Esports League",
            "tier": "S",
            "region": team_alpha_region,
            "start_date": start_time.date().isoformat(),
            "end_date": (start_time + timedelta(days=8)).date().isoformat()
        },
        "teams": teams,
        "match": {
            "match_id": match_id,
            "best_of": best_of,
            "start_time": start_time.isoformat() + "Z",
            "teams": [team_alpha_id, team_bravo_id],
            "status": "COMPLETED",
            "winner": match_winner
        },
        "maps": maps,
        "derived_statistics": {
            "player_stats": player_stats,
            "team_stats": team_stats
        },
        "agent_insights": agent_insights,
        "human_review": human_review,
        "audit_log": audit_log
    }
    
    return archive


def export_to_csv(archive: Dict[str, Any], output_dir: Path):
    """Export match archive to CSV files."""
    output_dir.mkdir(parents=True, exist_ok=True)
    match_id = archive["match"]["match_id"]
    
    # Export events
    events_file = output_dir / "events.csv"
    with open(events_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "event_id", "tournament_id", "match_id", "map_id", "round_number",
            "event_type", "actor", "target", "team", "payload", "timestamp"
        ])
        
        for map_data in archive["maps"]:
            for round_data in map_data["rounds"]:
                for event in round_data["events"]:
                    payload_str = json.dumps(event.get("payload", {}))
                    writer.writerow([
                        event["event_id"],
                        archive["tournament"]["tournament_id"],
                        match_id,
                        map_data["map_id"],
                        round_data["round_number"],
                        event["event_type"],
                        event.get("actor", ""),
                        event.get("target", ""),
                        event.get("team", ""),
                        payload_str,
                        event["timestamp"]
                    ])
    
    # Export player stats
    player_stats_file = output_dir / "player_stats.csv"
    with open(player_stats_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "tournament_id", "match_id", "player_id", "kills", "deaths",
            "assists", "adr", "opening_kills"
        ])
        
        for player_id, stats in archive["derived_statistics"]["player_stats"].items():
            writer.writerow([
                archive["tournament"]["tournament_id"],
                match_id,
                player_id,
                stats.get("kills", 0),
                stats.get("deaths", 0),
                stats.get("assists", 0),
                stats.get("adr", 0),
                stats.get("opening_kills", 0)
            ])
    
    # Export agent signals
    signals_file = output_dir / "agent_signals.csv"
    with open(signals_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "signal_id", "match_id", "type", "subject", "confidence", "status"
        ])
        
        for signal in archive["agent_insights"]:
            subject = signal.get("team") or signal.get("player", "")
            writer.writerow([
                signal["signal_id"],
                match_id,
                signal["type"],
                subject,
                signal["confidence"],
                signal["status"]
            ])
    
    # Export human reviews
    reviews_file = output_dir / "human_reviews.csv"
    with open(reviews_file, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow([
            "review_id", "signal_id", "reviewer", "decision", "notes", "reviewed_at"
        ])
        
        for review in archive["human_review"]:
            writer.writerow([
                review["review_id"],
                review["signal_id"],
                review["reviewer"],
                review["decision"],
                review["notes"],
                review["reviewed_at"]
            ])
    
    print(f"CSV exports written to {output_dir}")


def export_to_redis_streams(archive: Dict[str, Any], output_file: Path):
    """Generate Redis Stream commands."""
    match_id = archive["match"]["match_id"]
    tournament_id = archive["tournament"]["tournament_id"]
    
    commands = []
    
    # Generate canonical event stream commands
    for map_data in archive["maps"]:
        for round_data in map_data["rounds"]:
            for event in round_data["events"]:
                cmd_parts = [
                    "XADD", "events:canonical", "*",
                    "event_id", event["event_id"],
                    "tournament_id", tournament_id,
                    "match_id", match_id,
                    "map_id", map_data["map_id"],
                    "round", str(round_data["round_number"]),
                    "event_type", event["event_type"],
                    "timestamp", event["timestamp"]
                ]
                
                if "actor" in event:
                    cmd_parts.extend(["actor", event["actor"]])
                if "target" in event:
                    cmd_parts.extend(["target", event["target"]])
                if "team" in event:
                    cmd_parts.extend(["team", event["team"]])
                if "payload" in event:
                    cmd_parts.extend(["payload", json.dumps(event["payload"])])
                
                commands.append(" ".join(cmd_parts))
    
    # Generate agent signal stream commands
    for signal in archive["agent_insights"]:
        cmd_parts = [
            "XADD", "events:agent:signals", "*",
            "signal_id", signal["signal_id"],
            "match_id", match_id,
            "type", signal["type"],
            "confidence", str(signal["confidence"]),
            "explanation", json.dumps(signal["explanation"])
        ]
        if "team" in signal:
            cmd_parts.extend(["team", signal["team"]])
        if "player" in signal:
            cmd_parts.extend(["player", signal["player"]])
        commands.append(" ".join(cmd_parts))
    
    # Write to file
    with open(output_file, 'w') as f:
        f.write("\n".join(commands))
    
    print(f"Redis Stream commands written to {output_file}")


def main():
    parser = argparse.ArgumentParser(description="Generate Sample esports data")
    parser.add_argument("--format", choices=["json", "csv", "redis", "all"], default="json",
                       help="Output format")
    parser.add_argument("--output", type=str, help="Output file (for JSON)")
    parser.add_argument("--output-dir", type=str, help="Output directory (for CSV)")
    parser.add_argument("--match-id", type=str, default="match_001",
                       help="Match ID")
    parser.add_argument("--tournament-id", type=str, default="tourn_na_winter_2026",
                       help="Tournament ID")
    parser.add_argument("--multi", action="store_true",
                       help="Generate multiple tournaments")
    
    args = parser.parse_args()
    
    if args.multi:
        # Generate multiple tournaments
        tournaments = [
            ("tourn_na_winter_2026", "Team Alpha", "Team Bravo", "NA", "EU"),
            ("tourn_eu_spring_2026", "Team Charlie", "Team Delta", "EU", "NA"),
        ]
        start_time = datetime(2026, 1, 2, 17, 0, 0)
        
        for i, (tourn_id, team_a, team_b, region_a, region_b) in enumerate(tournaments):
            match_id = f"{tourn_id}_match_{i+1:03d}"
            archive = generate_match_archive(
                match_id, tourn_id, team_a, team_b, region_a, region_b,
                start_time + timedelta(days=i*10)
            )
            
            if args.format in ["json", "all"]:
                output_file = Path(args.output or f"Sample_data_{match_id}.json")
                with open(output_file, 'w') as f:
                    json.dump(archive, f, indent=2)
                print(f"Generated {output_file}")
            
            if args.format in ["csv", "all"]:
                output_dir = Path(args.output_dir or "./exports")
                export_to_csv(archive, output_dir / match_id)
            
            if args.format in ["redis", "all"]:
                output_file = Path(f"redis_streams_{match_id}.txt")
                export_to_redis_streams(archive, output_file)
    else:
        # Generate single match
        archive = generate_match_archive(
            args.match_id, args.tournament_id,
            "Team Alpha", "Team Bravo", "NA", "EU",
            datetime(2026, 1, 2, 17, 5, 0)
        )
        
        if args.format in ["json", "all"]:
            output_file = Path(args.output or "Sample_esports_match_archive.json")
            with open(output_file, 'w') as f:
                json.dump(archive, f, indent=2)
            print(f"Generated {output_file}")
        
        if args.format in ["csv", "all"]:
            output_dir = Path(args.output_dir or "./exports")
            export_to_csv(archive, output_dir)
        
        if args.format in ["redis", "all"]:
            output_file = Path(args.output or "redis_streams.txt")
            export_to_redis_streams(archive, output_file)


if __name__ == "__main__":
    main()


