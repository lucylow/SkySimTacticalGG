#!/usr/bin/env python3
"""
Live Replay Simulator

Simulates GRID live feeds from historical match data.
Streams events in real-time (or time-scaled) to Redis Streams.

Usage:
    python replay_simulator.py --match-archive match_archive.json --speed 1.0
    python replay_simulator.py --match-archive match_archive.json --speed 3.0 --redis-host localhost
"""

import json
import time
import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    print("Warning: redis not available. Install with: pip install redis")


def load_match_archive(file_path: Path) -> Dict[str, Any]:
    """Load match archive JSON."""
    with open(file_path, 'r') as f:
        return json.load(f)


def extract_all_events(archive: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Extract all events from archive, flattening structure."""
    events = []
    match_id = archive["match"]["match_id"]
    tournament_id = archive["tournament"]["tournament_id"]
    
    for map_data in archive["maps"]:
        map_id = map_data["map_id"]
        for round_data in map_data["rounds"]:
            round_num = round_data["round_number"]
            for event in round_data["events"]:
                # Enrich event with context
                enriched_event = {
                    **event,
                    "match_id": match_id,
                    "tournament_id": tournament_id,
                    "map_id": map_id,
                    "round": round_num
                }
                events.append(enriched_event)
    
    # Sort by timestamp
    events.sort(key=lambda e: e["timestamp"])
    return events


def replay_events(events: List[Dict[str, Any]], 
                  speed: float = 1.0,
                  redis_client: Optional[Any] = None,
                  stream_name: str = "events:canonical",
                  verbose: bool = True):
    """
    Replay events in real-time (time-scaled).
    
    Args:
        events: List of events sorted by timestamp
        speed: Time scaling factor (1.0 = real-time, 2.0 = 2x speed, 0.5 = half speed)
        redis_client: Optional Redis client for streaming
        stream_name: Redis stream name
        verbose: Print events to stdout
    """
    prev_timestamp = None
    
    for i, event in enumerate(events):
        # Parse timestamp
        event_timestamp = datetime.fromisoformat(event["timestamp"].replace("Z", "+00:00"))
        
        # Calculate sleep time
        if prev_timestamp:
            delta = (event_timestamp - prev_timestamp).total_seconds() / speed
            if delta > 0:
                time.sleep(delta)
        
        # Prepare Redis stream payload
        stream_payload = {
            "event_id": event["event_id"],
            "match_id": event["match_id"],
            "tournament_id": event["tournament_id"],
            "map_id": event.get("map_id", ""),
            "round": str(event.get("round", "")),
            "event_type": event["event_type"],
            "timestamp": event["timestamp"]
        }
        
        if "actor" in event:
            stream_payload["actor"] = event["actor"]
        if "target" in event:
            stream_payload["target"] = event["target"]
        if "team" in event:
            stream_payload["team"] = event["team"]
        if "payload" in event:
            import json as json_module
            stream_payload["payload"] = json_module.dumps(event["payload"])
        
        # Stream to Redis if available
        if redis_client:
            try:
                redis_client.xadd(stream_name, stream_payload)
            except Exception as e:
                print(f"Error streaming to Redis: {e}", file=sys.stderr)
        
        # Print to stdout
        if verbose:
            print(f"[{event['timestamp']}] {event['event_type']}: {event.get('actor', 'N/A')}")
        
        prev_timestamp = event_timestamp
    
    print(f"\nReplay complete: {len(events)} events streamed")


def create_redis_consumer_groups(redis_client: Any):
    """Create consumer groups for event streams."""
    groups = [
        ("events:canonical", "state_updater"),
        ("events:canonical", "agent_momentum"),
        ("events:canonical", "ws_broadcaster"),
        ("events:agent:review", "human_reviewers"),
    ]
    
    for stream_name, group_name in groups:
        try:
            redis_client.xgroup_create(stream_name, group_name, id="0", mkstream=True)
            print(f"Created consumer group: {group_name} on {stream_name}")
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP" in str(e):
                print(f"Consumer group {group_name} already exists on {stream_name}")
            else:
                raise


def main():
    parser = argparse.ArgumentParser(description="Replay esports match data in real-time")
    parser.set_defaults(**{'redis_host': 'localhost', 'redis_port': 6379, 'redis_db': 0})
    parser.add_argument("--match-archive", type=str, required=True,
                       help="Path to match archive JSON file")
    parser.add_argument("--speed", type=float, default=1.0,
                       help="Replay speed (1.0 = real-time, 2.0 = 2x speed)")
    parser.add_argument("--redis-host", type=str, default="localhost",
                       help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379,
                       help="Redis port")
    parser.add_argument("--redis-db", type=int, default=0,
                       help="Redis database number")
    parser.add_argument("--redis-password", type=str, default=None,
                       help="Redis password")
    parser.add_argument("--stream-name", type=str, default="events:canonical",
                       help="Redis stream name")
    parser.add_argument("--setup-groups", action="store_true",
                       help="Create Redis consumer groups")
    parser.add_argument("--no-redis", action="store_true",
                       help="Don't use Redis, just print to stdout")
    parser.add_argument("--quiet", action="store_true",
                       help="Don't print events to stdout")
    
    args = parser.parse_args()
    
    # Load archive
    archive_path = Path(args.match_archive)
    if not archive_path.exists():
        print(f"Error: File not found: {archive_path}", file=sys.stderr)
        sys.exit(1)
    
    archive = load_match_archive(archive_path)
    events = extract_all_events(archive)
    
    print(f"Loaded {len(events)} events from {archive_path}")
    print(f"Match: {archive['match']['match_id']}")
    print(f"Tournament: {archive['tournament']['name']}")
    print(f"Replay speed: {args.speed}x")
    print()
    
    # Setup Redis
    redis_client = None
    if not args.no_redis and REDIS_AVAILABLE:
        try:
            redis_client = redis.Redis(
                host=args.redis_host,
                port=args.redis_port,
                db=args.redis_db,
                password=args.redis_password,
                decode_responses=True
            )
            redis_client.ping()
            print(f"Connected to Redis at {args.redis_host}:{args.redis_port}")
            
            if args.setup_groups:
                create_redis_consumer_groups(redis_client)
        except Exception as e:
            print(f"Warning: Could not connect to Redis: {e}", file=sys.stderr)
            print("Continuing without Redis...", file=sys.stderr)
            redis_client = None
    elif args.no_redis:
        print("Redis disabled (--no-redis)")
    else:
        print("Warning: redis library not available. Install with: pip install redis")
    
    # Start replay
    try:
        replay_events(
            events,
            speed=args.speed,
            redis_client=redis_client,
            stream_name=args.stream_name,
            verbose=not args.quiet
        )
    except KeyboardInterrupt:
        print("\nReplay interrupted by user")


if __name__ == "__main__":
    main()


