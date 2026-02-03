#!/usr/bin/env python3
"""
Example usage of mock data utilities.

This script demonstrates how to:
1. Generate mock data
2. Export to different formats
3. Replay events
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from generate_mock_data import generate_match_archive, export_to_csv, export_to_redis_streams
from datetime import datetime

def main():
    print("=== Mock Data Generation Example ===\n")
    
    # Generate a single match archive
    print("1. Generating match archive...")
    archive = generate_match_archive(
        match_id="example_match_001",
        tournament_id="example_tournament_2026",
        team_alpha_name="Team Alpha",
        team_bravo_name="Team Bravo",
        team_alpha_region="NA",
        team_bravo_region="EU",
        start_time=datetime(2026, 1, 2, 17, 5, 0)
    )
    
    print(f"   Generated match: {archive['match']['match_id']}")
    print(f"   Tournament: {archive['tournament']['name']}")
    print(f"   Maps: {len(archive['maps'])}")
    
    total_events = sum(
        len(round_data['events'])
        for map_data in archive['maps']
        for round_data in map_data['rounds']
    )
    print(f"   Total events: {total_events}")
    print()
    
    # Export to CSV
    print("2. Exporting to CSV...")
    output_dir = Path(__file__).parent.parent / "exports"
    export_to_csv(archive, output_dir)
    print(f"   CSV files written to {output_dir}")
    print()
    
    # Export to Redis streams
    print("3. Generating Redis Stream commands...")
    redis_output = Path(__file__).parent.parent / "redis_streams_example.txt"
    export_to_redis_streams(archive, redis_output)
    print(f"   Redis commands written to {redis_output}")
    print()
    
    # Show sample events
    print("4. Sample events from first round:")
    if archive['maps'] and archive['maps'][0]['rounds']:
        first_round = archive['maps'][0]['rounds'][0]
        for event in first_round['events'][:3]:
            print(f"   [{event['timestamp']}] {event['event_type']}")
            if 'actor' in event:
                print(f"      Actor: {event['actor']}")
    print()
    
    print("=== Example Complete ===")
    print(f"\nTo replay this match:")
    print(f"  python replay_simulator.py --match-archive exports/match_archive.json --speed 1.0")

if __name__ == "__main__":
    main()


