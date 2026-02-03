"""
Feature engineering for Valorant / League of Legends Sample matches.

Input:
  - match: Python dict loaded from match JSON (structure produced by the Sample generator).
    Expected keys (Valorant): match['id'], match['players'] (list with 'id' and 'baseSkill'),
      match['rounds'] (list): each round contains:
        - roundNumber (int)
        - buys: list of {playerId, side, buyType, weapon, spent, walletAfter}
        - playerRoundResults: list of {playerId, side, kills, planted, defused, payout, walletAfter}
        - winProbAttack (optional)
  - For positional features: match.get('replayFrames') is optional list of frames:
        frame: {tick, ts, players: [{id, x, y, hp}], events: [...]}

Output:
  - pd.DataFrame: one row per (match, round, player) with >50 engineered features plus labels.
"""

from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from scipy.stats import entropy as sc_entropy
import math
import os

# ---------- Utilities ----------

def safe_div(a, b, eps=1e-9):
    return a / (b + eps)

def zscore(series):
    if series.std(ddof=0) == 0:
        return series * 0.0
    return (series - series.mean()) / (series.std(ddof=0))

# ---------- Flatten match -> player-round rows ----------

def build_base_player_round_df(match: Dict[str, Any]) -> pd.DataFrame:
    """
    Create a DataFrame with one row per player per round combining buys and playerRoundResults.
    """
    rows = []
    match_id = match.get('id', 'unknown')
    # create quick lookup for player base skill
    player_skill = {p['id']: p.get('baseSkill', np.nan) for p in match.get('players', [])}

    for rnd in match.get('rounds', []):
        rnd_num = rnd.get('roundNumber') or rnd.get('roundIndex') or rnd.get('round') or None
        win_prob_attack = rnd.get('winProbAttack', np.nan)
        buys = rnd.get('buys', [])
        pr_results = rnd.get('playerRoundResults', [])
        # index buys by playerId
        buys_by_player = {b['playerId']: b for b in buys}
        results_by_player = {p['playerId']: p for p in pr_results}
        # iterate players in buys for this round (should be same as results)
        for player_id, buy in buys_by_player.items():
            result = results_by_player.get(player_id, {})
            side = buy.get('side')
            weapon = buy.get('weapon')
            buy_type = buy.get('buyType')
            spent = buy.get('spent', 0)
            wallet_after = buy.get('walletAfter', np.nan)
            kills = result.get('kills', 0)
            planted = 1 if result.get('planted') else 0
            defused = 1 if result.get('defused') else 0
            payout = result.get('payout', np.nan)
            row = {
                'matchId': match_id,
                'roundNumber': int(rnd_num) if rnd_num is not None else np.nan,
                'playerId': player_id,
                'side': side,
                'buyType': buy_type,
                'weapon': weapon,
                'spent': spent,
                'walletAfter': wallet_after,
                'kills': kills,
                'planted': planted,
                'defused': defused,
                'payout': payout,
                'winProbAttack': win_prob_attack
            }
            # augment with player base skill if available
            row['baseSkill'] = player_skill.get(player_id, np.nan)
            rows.append(row)

    df = pd.DataFrame(rows)
    if df.empty:
        return df
    df = df.sort_values(['playerId', 'roundNumber']).reset_index(drop=True)
    # ensure types
    df['roundNumber'] = df['roundNumber'].astype(int)
    df['kills'] = df['kills'].astype(int)
    df['spent'] = df['spent'].astype(float)
    df['walletAfter'] = df['walletAfter'].astype(float)
    return df

# ---------- Frame-based positional features (optional) ----------

def compute_positional_aggregates(match: Dict[str, Any], radius_threshold=800.0) -> pd.DataFrame:
    """
    Compute per-player aggregate positional features across the whole match from replayFrames:
      - avg_distance_to_teammates
      - avg_distance_to_enemies
      - position_entropy (spatial entropy, coarse grid)
      - time_in_high_risk_zone (proxied by being within 'radius_threshold' of many opponents)
    Return DataFrame indexed by playerId with these features.
    If replayFrames missing or empty, returns empty df.
    """
    frames = match.get('replayFrames') or []
    if not frames:
        return pd.DataFrame()

    # Build positions per tick per player into dict: playerId -> list of (x,y)
    positions = {}
    for f in frames:
        players = f.get('players', [])
        for p in players:
            pid = p.get('id')
            if pid not in positions:
                positions[pid] = []
            positions[pid].append((p.get('x', np.nan), p.get('y', np.nan)))

    # Precompute enemies/teammates from match players sides
    # derive sides mapping from round 1 buys if available; fallback: assign first 5 players as attackers
    side_map = {}
    all_players = [p['id'] for p in match.get('players', [])]
    if not all_players:
        return pd.DataFrame()
    # find first round buys if available
    first_round = (match.get('rounds') or [None])[0]
    if first_round and 'buys' in first_round:
        for b in first_round['buys']:
            side_map[b['playerId']] = b.get('side')
    else:
        for i, pid in enumerate(all_players):
            side_map[pid] = 'attackers' if i < 5 else 'defenders'

    # compute aggregates
    rows = []
    for pid, coords in positions.items():
        # Filter out invalid coords
        pts = np.array([(x, y) for (x, y) in coords if x is not None and not np.isnan(x)])
        if pts.size == 0:
            # default zeros
            rows.append({
                'playerId': pid,
                'pos_avg_distance_to_teammates': np.nan,
                'pos_avg_distance_to_enemies': np.nan,
                'pos_entropy': np.nan,
                'pos_time_in_high_risk_ratio': np.nan
            })
            continue
        # teammates/enemies sample distances: compute distances per frame to team/enemy players (approx.)
        teammate_ids = [q for q, s in side_map.items() if s == side_map.get(pid)]
        enemy_ids = [q for q, s in side_map.items() if s != side_map.get(pid)]
        # sample per-frame neighbors distances
        # For simplicity, compute pairwise using first matched frame index positions: we accept approximate aggregates
        # Build lookup of last known positions for others
        last_positions = {}
        for other, other_coords in positions.items():
            last_positions[other] = np.array([p for p in other_coords if p is not None and not any(np.isnan(p))])
        # Estimate avg distance to teammates/enemies using per-frame nearest measurement where available
        dists_team = []
        dists_enemy = []
        high_risk_counts = 0
        for idx in range(len(coords)):
            x, y = coords[idx]
            if x is None or np.isnan(x): continue
            # teammates distances at this frame: attempt to get same index for other players else use last known
            team_ds = []
            enemy_ds = []
            for tpid in teammate_ids:
                if tpid == pid: continue
                other_coords = positions.get(tpid)
                if not other_coords: continue
                if idx < len(other_coords):
                    ox, oy = other_coords[idx]
                else:
                    ox, oy = other_coords[-1]
                if ox is None or np.isnan(ox): continue
                d = math.hypot(x - ox, y - oy)
                team_ds.append(d)
            for epid in enemy_ids:
                other_coords = positions.get(epid)
                if not other_coords: continue
                if idx < len(other_coords):
                    ox, oy = other_coords[idx]
                else:
                    ox, oy = other_coords[-1]
                if ox is None or np.isnan(ox): continue
                d = math.hypot(x - ox, y - oy)
                enemy_ds.append(d)
            if team_ds:
                dists_team.append(np.mean(team_ds))
            if enemy_ds:
                dists_enemy.append(np.mean(enemy_ds))
            # high-risk prox: count how many enemies are within radius
            near_enemies = sum(1 for d in enemy_ds if d < radius_threshold) if enemy_ds else 0
            if near_enemies >= 2:
                high_risk_counts += 1

        avg_team = np.mean(dists_team) if dists_team else np.nan
        avg_enemy = np.mean(dists_enemy) if dists_enemy else np.nan
        risk_ratio = safe_div(high_risk_counts, max(1, len(coords)))

        # spatial entropy: bin positions into coarse grid and compute entropy
        xs = pts[:, 0]
        ys = pts[:, 1]
        # create 10x10 grid bounds
        try:
            x_bins = np.linspace(np.nanmin(xs), np.nanmax(xs) + 1e-9, 10)
            y_bins = np.linspace(np.nanmin(ys), np.nanmax(ys) + 1e-9, 10)
            hx, _ = np.histogramdd(pts, bins=(x_bins, y_bins))
            flat = hx.flatten()
            ps = flat / (flat.sum() + 1e-9)
            pos_entropy = float(sc_entropy(ps + 1e-12, base=2))
        except Exception:
            pos_entropy = np.nan

        rows.append({
            'playerId': pid,
            'pos_avg_distance_to_teammates': float(avg_team) if not np.isnan(avg_team) else np.nan,
            'pos_avg_distance_to_enemies': float(avg_enemy) if not np.isnan(avg_enemy) else np.nan,
            'pos_entropy': float(pos_entropy),
            'pos_time_in_high_risk_ratio': float(risk_ratio)
        })

    pos_df = pd.DataFrame(rows).set_index('playerId')
    return pos_df

# ---------- Core feature engineering ----------

def compute_player_round_features(match: Dict[str, Any],
                                  rolling_windows: List[int] = [3,5,10],
                                  include_positional: bool = True) -> pd.DataFrame:
    """
    Compute a broad set (50+) of engineered features for each (player, round) in the match.

    Returns: DataFrame with columns:
      - metadata: matchId, roundNumber, playerId, side, buyType, weapon, spent, walletAfter, kills, baseSkill
      - economy features, rolling features (avgKills@3/5/10, avgSpent@3/5/10), streaks, team/opponent aggregates,
      - positional features if replayFrames present: pos_*,
      - derived ratios: buyValueRatio, economicPressure, buyAggressiveness, weaponPowerScore
      - labels: roundWinnerIsPlayerTeam (binary), nextRoundBuyType (categorical)
    """
    import pandas as pd

    base_df = build_base_player_round_df(match)
    if base_df.empty:
        return base_df

    df = base_df.copy()

    # ---------- Basic derived numeric features ----------
    # label: round winner (per round): find winner side by checking any player's "side" and match.rounds
    # But base_df doesn't include explicit winner flag; we can map by reading match.rounds
    winner_map = {}
    for rnd in match.get('rounds', []):
        rn = rnd.get('roundNumber')
        if rn is None: continue
        winner_map[int(rn)] = rnd.get('winner') or rnd.get('winnerSide') or ( 'attackers' if (rnd.get('winProbAttack',0) > 0.5) else 'defenders')
    df['roundWinnerSide'] = df['roundNumber'].map(winner_map)
    df['roundWinnerIsPlayerTeam'] = (df['side'] == df['roundWinnerSide']).astype(int)

    # create a quick mapping weapon -> power (simple heuristic)
    weapon_power = {
        # conservative numbers (normalized)
        'Classic': 0.1, 'Shorty': 0.08, 'Ghost': 0.45, 'Sheriff': 0.65, 'Frenzy': 0.2,
        'Bulldog': 0.5, 'Guardian': 0.55, 'Phantom': 0.85, 'Vandal': 0.87, 'Operator': 1.1,
        'Spectre': 0.6, 'Judge': 0.45
    }
    df['weaponPower'] = df['weapon'].apply(lambda w: weapon_power.get(w, 0.3))

    # buyType aggressiveness mapping (numeric)
    buy_aggressiveness = {'Eco': 0.0, 'Pistol': 0.4, 'Light': 0.45, 'Partial': 0.75, 'Force': 0.85, 'Full': 1.0}
    df['buyAggressiveness'] = df['buyType'].map(lambda b: buy_aggressiveness.get(b, 0.5))

    # buyValueRatio = weaponPower / spent (if spent >0)
    df['buyValueRatio'] = df.apply(lambda r: safe_div(r['weaponPower'], r['spent']) if r['spent'] > 0 else 0.0, axis=1)

    # map side to numeric
    df['isAttack'] = (df['side'] == 'attackers').astype(int)

    # ---------- Rolling player-level features (group by playerId) ----------
    df = df.sort_values(['playerId', 'roundNumber']).reset_index(drop=True)
    grouped = df.groupby('playerId', sort=False)

    # For each rolling window compute avgKills, avgSpent, countFullBuys, recentKills, recentSpent
    for w in rolling_windows:
        df[f'avgKills_last_{w}'] = grouped['kills'].apply(lambda s: s.shift(1).rolling(window=w, min_periods=1).mean()).reset_index(level=0, drop=True)
        df[f'sumKills_last_{w}'] = grouped['kills'].apply(lambda s: s.shift(1).rolling(window=w, min_periods=1).sum()).reset_index(level=0, drop=True)
        df[f'avgSpent_last_{w}'] = grouped['spent'].apply(lambda s: s.shift(1).rolling(window=w, min_periods=1).mean()).reset_index(level=0, drop=True)
        # fraction of full buys in last w rounds
        df[f'fullBuys_last_{w}'] = grouped['buyType'].apply(lambda s: s.shift(1).rolling(window=w, min_periods=1).apply(lambda x: np.sum([1 if xi == 'Full' else 0 for xi in x]) / max(len(x),1))).reset_index(level=0, drop=True)

    # last round kills
    df['lastRoundKills'] = grouped['kills'].apply(lambda s: s.shift(1)).reset_index(level=0, drop=True).fillna(0).astype(int)

    # eco and buy streaks: consecutive eco/fullWins etc.
    def compute_consecutive(series, target):
        # returns series aligned with original index showing consecutive trailing counts BEFORE current row
        out = []
        prev = 0
        arr = series.values
        # we want the consecutive count of target in the preceding rounds, so shift windows
        consec = 0
        for i, v in enumerate(arr):
            out.append(consec)
            if v == target:
                consec += 1
            else:
                consec = 0
        return pd.Series(out, index=series.index)

    df['ecoStreak_before'] = grouped['buyType'].apply(lambda s: compute_consecutive(s, 'Eco')).reset_index(level=0, drop=True)
    df['fullBuyStreak_before'] = grouped['buyType'].apply(lambda s: compute_consecutive(s, 'Full')).reset_index(level=0, drop=True)

    # clutch history: compute prior 1vX successes from match players if provided (we may look at playerRoundResults 'clutch' flags)
    # We look for pr_result keys like 'clutch' (boolean) or 'clutch_success' — otherwise 0
    # compute prior success rate
    def prior_clutch_rate(player_rows):
        out = []
        successes = 0
        attempts = 0
        for i, row in player_rows.iterrows():
            out.append(safe_div(successes, max(1, attempts)))
            # check current row for clutch attempt indicators
            # support older schema keys
            is_attempt = row.get('clutch_attempt', False) or row.get('clutch', False)
            success = row.get('clutch_success', False) or row.get('clutch', False)
            if is_attempt:
                attempts += 1
                if success:
                    successes += 1
        return pd.Series(out, index=player_rows.index)

    # add placeholder clutch columns if not present
    if 'clutch' not in df.columns:
        df['clutch'] = 0
    df['prior_clutch_success_rate'] = grouped.apply(prior_clutch_rate).reset_index(level=0, drop=True)

    # ---------- Team-level and opponent aggregates per round ----------
    # Compute per-round aggregates: team_total_spent, team_avg_weaponPower, team_avg_baseSkill, opponent analogs
    # We'll pivot by roundNumber and side
    # Build helper table of team aggregated stats per round
    agg_rows = []
    for rnd in match.get('rounds', []):
        rn = rnd.get('roundNumber')
        buys = rnd.get('buys', [])
        # gather stats per side
        stats = {}
        for side in ['attackers', 'defenders']:
            side_buys = [b for b in buys if b.get('side') == side]
            if not side_buys:
                stats[(rn, side, 'team_spent')] = 0
                stats[(rn, side, 'team_avg_weaponPower')] = 0
                stats[(rn, side, 'team_count')] = 0
                stats[(rn, side, 'team_avg_baseSkill')] = 0
                continue
            total_spent = sum([b.get('spent', 0) for b in side_buys])
            avg_weapon = np.mean([ (0.3 if b.get('weapon') is None else (0.85 if b.get('weapon')=='Phantom' else 0.5)) for b in side_buys ])
            base_skills = []
            for b in side_buys:
                pid = b.get('playerId')
                skill = next((p.get('baseSkill', np.nan) for p in match.get('players', []) if p.get('id') == pid), np.nan)
                base_skills.append(skill if not np.isnan(skill) else 0.45)
            stats[(rn, side, 'team_spent')] = total_spent
            stats[(rn, side, 'team_avg_weaponPower')] = avg_weapon
            stats[(rn, side, 'team_count')] = len(side_buys)
            stats[(rn, side, 'team_avg_baseSkill')] = float(np.nanmean(base_skills)) if base_skills else np.nan
        agg_rows.append((rn, stats))
    # Now use stats to add columns to df by mapping roundNumber and side
    def lookup_team_val(rn, side, key):
        for t_rn, stats in agg_rows:
            if t_rn == rn:
                return stats.get((rn, side, key), np.nan)
        return np.nan

    df['team_total_spent_round'] = df.apply(lambda r: lookup_team_val(r['roundNumber'], r['side'], 'team_spent'), axis=1)
    df['team_avg_weaponPower_round'] = df.apply(lambda r: lookup_team_val(r['roundNumber'], r['side'], 'team_avg_weaponPower'), axis=1)
    df['team_avg_baseSkill_round'] = df.apply(lambda r: lookup_team_val(r['roundNumber'], r['side'], 'team_avg_baseSkill'), axis=1)
    # opponent features: side flip
    def flip_side(s):
        return 'defenders' if s == 'attackers' else 'attackers'
    df['opp_total_spent_round'] = df.apply(lambda r: lookup_team_val(r['roundNumber'], flip_side(r['side']), 'team_spent'), axis=1)
    df['opp_avg_weaponPower_round'] = df.apply(lambda r: lookup_team_val(r['roundNumber'], flip_side(r['side']), 'team_avg_weaponPower'), axis=1)
    df['opp_avg_baseSkill_round'] = df.apply(lambda r: lookup_team_val(r['roundNumber'], flip_side(r['side']), 'team_avg_baseSkill'), axis=1)

    # economic pressure index:
    df['economicPressure'] = df.apply(lambda r: safe_div(r['opp_total_spent_round'], (r['team_total_spent_round'] + 1e-9)), axis=1)

    # team buy behavior in prior rounds: fraction of full buys team did in last N rounds
    # compute per-player but aggregated by team: for simplicity, compute fraction on side across players (approx)
    # build a pivot table for buys by round & side
    buys_df_rows = []
    for rnd in match.get('rounds', []):
        rn = rnd.get('roundNumber')
        for b in rnd.get('buys', []):
            buys_df_rows.append({'roundNumber': rn, 'playerId': b['playerId'], 'side': b['side'], 'buyType': b.get('buyType', '')})
    buys_df = pd.DataFrame(buys_df_rows) if buys_df_rows else pd.DataFrame(columns=['roundNumber','playerId','side','buyType'])
    if not buys_df.empty:
        # compute per side rolling fraction of full buys over last 5 rounds
        buys_df = buys_df.sort_values('roundNumber')
        # create side-round level aggregation first
        side_round = buys_df.groupby(['roundNumber', 'side']).agg(total=('playerId','count'), full=('buyType', lambda s: np.sum([1 if v=='Full' else 0 for v in s]))).reset_index()
        # now for each side compute rolling fraction
        side_round['full_frac_last_5'] = side_round.groupby('side').full.apply(lambda s: s.shift(1).rolling(5, min_periods=1).sum() / side_round.groupby('side').total.apply(lambda t: t.shift(1).rolling(5, min_periods=1).sum()))
        # map this into df
        side_round_map = {(int(r['roundNumber']), r['side']): float(r.get('full_frac_last_5', np.nan)) for _, r in side_round.iterrows()}
        df['team_full_frac_last_5'] = df.apply(lambda r: side_round_map.get((r['roundNumber'], r['side']), np.nan), axis=1)
        df['opp_full_frac_last_5'] = df.apply(lambda r: side_round_map.get((r['roundNumber'], flip_side(r['side'])), np.nan), axis=1)
    else:
        df['team_full_frac_last_5'] = np.nan
        df['opp_full_frac_last_5'] = np.nan

    # ---------- Temporal context features ----------
    # is pistol round: round 1 or pistol rounds (if half logic not provided we assume r==1 and r==halfStart)
    nRounds = max(df['roundNumber'].max(), 0)
    halfStart = int(math.ceil(nRounds / 2)) + 1 if nRounds > 0 else None
    df['isPistolRound'] = df['roundNumber'].apply(lambda rn: 1 if (rn == 1 or (halfStart and rn == halfStart)) else 0)
    df['roundInHalf'] = df['roundNumber'].apply(lambda rn: rn if not halfStart else ((rn - 1) % (halfStart - 1) + 1))

    # momentum / streak features at team level: team win streak prior to this round
    # compute winners sequence per round from match
    winner_seq = []
    for rnd in sorted([r for r in (match.get('rounds') or [])], key=lambda x: x.get('roundNumber', 0)):
        rn = rnd.get('roundNumber')
        winner_seq.append({'roundNumber': rn, 'winner': rnd.get('winner') or ( 'attackers' if rnd.get('winProbAttack', 0) > 0.5 else 'defenders')})
    winner_df = pd.DataFrame(winner_seq)
    if not winner_df.empty:
        # compute team streak before each round
        def team_streak_before(rn, side):
            # look at previous rounds (rn-1, rn-2...) and count consecutive wins for side
            streak = 0
            prev_rounds = winner_df[winner_df['roundNumber'] < rn].sort_values('roundNumber', ascending=False)
            for _, row in prev_rounds.iterrows():
                if row['winner'] == side:
                    streak += 1
                else:
                    break
            return streak
        df['team_win_streak_before'] = df.apply(lambda r: team_streak_before(r['roundNumber'], r['side']), axis=1)
        df['opp_win_streak_before'] = df.apply(lambda r: team_streak_before(r['roundNumber'], flip_side(r['side'])), axis=1)
    else:
        df['team_win_streak_before'] = 0
        df['opp_win_streak_before'] = 0

    # ---------- Positional features (optional) ----------
    pos_df = compute_positional_aggregates(match) if include_positional else pd.DataFrame()
    if not pos_df.empty:
        # join position features to df by playerId
        pos_df = pos_df.reset_index().rename(columns={'index':'playerId'}) if 'playerId' not in pos_df.columns else pos_df.reset_index()
        # ensure columns exist
        pos_df = pos_df.rename(columns={'playerId':'playerId'}) if 'playerId' in pos_df.columns else pos_df
        df = df.merge(pos_df.reset_index() if 'playerId' in pos_df.columns else pos_df.reset_index(), on='playerId', how='left')

    # ---------- Derived ratios and advanced features ----------
    # normalized player rating (zscore within match)
    # we can use baseSkill or kills aggregated: compute zscore of baseSkill across players
    try:
        base_skill_series = df.groupby('playerId')['baseSkill'].transform('mean')
        df['playerSkill_z'] = zscore(base_skill_series)
    except Exception:
        df['playerSkill_z'] = 0.0

    # team variance in skill for the round
    def team_skill_var(rn, side):
        players_side = df[(df['roundNumber'] == rn) & (df['side'] == side)]
        return float(players_side['baseSkill'].var()) if not players_side.empty else 0.0
    df['team_skill_var'] = df.apply(lambda r: team_skill_var(r['roundNumber'], r['side']), axis=1)
    df['opp_skill_var'] = df.apply(lambda r: team_skill_var(r['roundNumber'], flip_side(r['side'])), axis=1)

    # buyValueRelativeToTeam: spent / (team_total_spent_round / team_count)
    def team_avg_spent_per_player(rn, side):
        total = lookup_team_val_local(rn, side, match, 'team_spent')
        count = lookup_team_val_local(rn, side, match, 'team_count')
        return safe_div(total, max(1, count))
    df['avgTeamSpent'] = df.apply(lambda r: team_avg_spent_per_player(r['roundNumber'], r['side']), axis=1)
    df['spent_over_team_avg'] = df.apply(lambda r: safe_div(r['spent'], (r['avgTeamSpent'] + 1e-9)), axis=1)

    # expected kills by simple model: baseSkill * weaponPower * buyAggressiveness * team_avg_baseSkill_round factor
    df['expectedKills_simple'] = df['baseSkill'] * df['weaponPower'] * df['buyAggressiveness'] * (df['team_avg_baseSkill_round'].fillna(df['baseSkill']) / 0.5)

    # next round label: nextRoundBuyType (we can look up in match rounds)
    # Build a mapping match.rounds[rn+1] buys table
    next_buy_map = {}
    for rnd in match.get('rounds', []):
        rn = rnd.get('roundNumber')
        # prepare mapping for players
        if not rn:
            continue
        next_rnd = next((r for r in match.get('rounds', []) if r.get('roundNumber') == rn + 1), None)
        if not next_rnd:
            continue
        for b in (next_rnd.get('buys') or []):
            next_buy_map[(rn, b['playerId'])] = b.get('buyType')
    df['nextRoundBuyType'] = df.apply(lambda r: next_buy_map.get((r['roundNumber'], r['playerId']), 'NA'), axis=1)
    df['next_can_full_buy'] = df.apply(lambda r: 1 if r['nextRoundBuyType'] == 'Full' else 0, axis=1)

    # fatigue index: roundNumber scaled + rolling monotonic increases for the player (games in match)
    df['fatigue_index'] = df.groupby('playerId').cumcount() / df.groupby('playerId')['roundNumber'].transform('max').replace(0,1)

    # day/time features if match has timestamp (startedAt)
    started_at = match.get('startedAt', None)
    if started_at:
        dt = pd.to_datetime(started_at, unit='s')
        df['match_hour'] = dt.hour
        df['match_weekday'] = dt.weekday()
    else:
        df['match_hour'] = 0
        df['match_weekday'] = 0

    # pressure metric: opponent avg weapon - team avg weapon (per round)
    df['pressure_metric'] = df['opp_avg_weaponPower_round'] - df['team_avg_weaponPower_round']

    # participation indicator: player in top 3 kills of round?
    def top_n_kills(rn, n=3):
        players = df[df['roundNumber'] == rn]
        if players.empty: return {}
        top = players.sort_values('kills', ascending=False).head(n)['playerId'].tolist()
        return {pid: 1 if pid in top else 0 for pid in players['playerId'].tolist()}
    # compute for each round
    top_map = {}
    for rn in df['roundNumber'].unique():
        top_map[rn] = top_n_kills(rn, n=3)
    df['in_top3_kills'] = df.apply(lambda r: top_map.get(r['roundNumber'], {}).get(r['playerId'], 0), axis=1)

    # finally, select a curated feature list (60+)
    feature_columns = list(df.columns)  # include all computed columns
    # reorder columns: metadata first
    meta_cols = ['matchId', 'roundNumber', 'playerId', 'side', 'buyType', 'weapon', 'spent', 'walletAfter', 'kills', 'payout']
    other_cols = [c for c in feature_columns if c not in meta_cols]
    ordered_cols = meta_cols + other_cols
    df = df[ordered_cols]
    return df

# Helper used earlier to lookup team aggregated values created in compute_player_round_features.
def lookup_team_val_local(rn, side, match, key):
    # rebuild same simple stat compute done previously (avoid circular import)
    buys = []
    for r in match.get('rounds', []):
        if r.get('roundNumber') == rn:
            buys = r.get('buys', [])
            break
    side_buys = [b for b in buys if b.get('side') == side]
    if not side_buys: 
        if key == 'team_spent': return 0
        if key == 'team_count': return 0
        return 0
    if key == 'team_spent':
        return sum([b.get('spent', 0) for b in side_buys])
    if key == 'team_count':
        return len(side_buys)
    if key == 'team_avg_baseSkill':
        sks = []
        for b in side_buys:
            pid = b.get('playerId')
            sk = next((p.get('baseSkill', np.nan) for p in match.get('players', []) if p.get('id') == pid), np.nan)
            sks.append(sk if not np.isnan(sk) else 0.45)
        return float(np.nanmean(sks)) if sks else 0.0
    if key == 'team_avg_weaponPower':
        # simple mapping similar to compute_player_round_features
        power_map = {'Phantom':0.85, 'Vandal':0.87, 'Operator':1.1}
        vals = [power_map.get(b.get('weapon'), 0.5) for b in side_buys]
        return float(np.nanmean(vals)) if vals else 0.0
    return 0

# ---------- Feature list explanation ----------
FEATURE_DESCRIPTIONS = {
    # Short descriptions for each key feature that compute_player_round_features produces (examples)
    'avgKills_last_3': 'Average kills by player in last 3 rounds (excluding current)',
    'avgKills_last_5': 'Average kills in last 5 rounds',
    'avgSpent_last_5': 'Average money spent by player in last 5 rounds',
    'fullBuys_last_5': 'Fraction of rounds in last 5 where player performed a full buy',
    'ecoStreak_before': 'Number of consecutive Eco buys the player made prior to this round',
    'fullBuyStreak_before': 'Number of consecutive Full buys the player made prior to this round',
    'team_total_spent_round': 'Total money spent by the team in this round',
    'opp_total_spent_round': 'Total money spent by opponent in this round',
    'economicPressure': 'opp_total_spent / team_total_spent (pressure index)',
    'isPistolRound': 'Boolean if round is a pistol round (round 1 / half-start)',
    'team_win_streak_before': 'Team consecutive wins before this round',
    'opp_win_streak_before': 'Opposing team consecutive wins before this round',
    'weaponPower': 'Numeric heuristic of weapon power (higher => stronger)',
    'buyAggressiveness': 'Numeric encoding (Eco=0..Full=1)',
    'buyValueRatio': 'weaponPower / spent (higher => efficient purchase)',
    'expectedKills_simple': 'Simple expectation for kills based on skill * weapon * buy aggressiveness',
    'pos_avg_distance_to_teammates': 'Avg distance to teammates across frames (positional)',
    'pos_avg_distance_to_enemies': 'Avg distance to enemies across frames (positional)',
    'pos_entropy': 'Spatial entropy of player positions (higher => more spread)',
    'pos_time_in_high_risk_ratio': 'Fraction of frames in which multiple enemies were nearby',
    'playerSkill_z': 'Player skill z-score among match players',
    'team_skill_var': 'Variance of baseSkill among team players',
    'in_top3_kills': 'Indicator if player is top-3 kills this round',
    'nextRoundBuyType': 'Label: buy type in the next round (for sequence modelling)'
}

# ---------- Example usage (CLI) ----------
def process_match_json_file(json_path: str, out_csv: Optional[str] = None, include_positional: bool = True):
    import json
    with open(json_path, 'r') as f:
        match = json.load(f)
    df = compute_player_round_features(match, include_positional=include_positional)
    if out_csv:
        df.to_csv(out_csv, index=False)
        print(f"Wrote features CSV: {out_csv} ({len(df)} rows)")
    return df

if __name__ == '__main__':
    # Example: process server/data/valorant_matches_full.json produced by generator earlier
    example_path = os.path.join(os.path.dirname(__file__), 'data', 'valorant_matches_full.json')
    if os.path.exists(example_path):
        print('Processing example match:', example_path)
        df = process_match_json_file(example_path, out_csv=os.path.join(os.path.dirname(__file__), 'data', 'valorant_features_example.csv'))
        print(df.head(10).T)
    else:
        print('No example match JSON found at:', example_path)
        print('Run the match generator first (economy_and_curves.js) to create sample JSONs.')

