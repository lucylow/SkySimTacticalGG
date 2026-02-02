# League of Legends — 15-Page Application Blueprint

## How Your AI Assistant Coach Can Transform LoL Performance Analysis

---

## 1. Executive Summary

League of Legends is a complex, real-time, team-strategy game with discrete events, clear roles, and a rich causal space spanning laning, rotations, objective control, and teamfights. Your AI Assistant Coach platform—designed with micro → macro analytics, explainability, and human-in-loop capabilities—is uniquely positioned to transform how LoL teams analyze performance, develop players, and optimize strategy.

### Value Proposition

Your Assistant Coach converts raw micro-events (CS, ability casts, movement, vision actions, gold transactions, TP usage) into prioritized, explainable action cards that coaches and players can act on immediately. The platform detects recurring micro-mistakes (poor CSing, missed skillshots, ward timing, TP timing), quantifies their team-level consequences (lost objectives, failed roams, lost teamfights), and prescribes high-confidence drills and tactical adjustments with evidence clips and measurable KPIs.

### Key Outcomes

- **Faster skill acquisition**: Players identify and fix mistakes through targeted, evidence-backed feedback
- **Fewer unforced mistakes**: Pattern detection surfaces recurring errors before they become habits
- **Improved objective control**: Quantified impact of micro-decisions on macro outcomes (dragon/baron timing, TP coordination)
- **Better coordination in teamfights**: Team-level insights highlight synchronization gaps and optimal execution windows
- **Coach time saved**: Automated analysis reduces manual VOD review hours by 60-80%, allowing coaches to focus on strategy and player development

### Differentiators

Unlike generic analytics tools, your platform provides:

1. **Explainable AI**: Every recommendation includes SHAP-based feature attribution and clear causal reasoning
2. **Human-in-loop workflow**: Coaches review, adjust, and approve insights before they reach players
3. **Evidence-backed insights**: Each action card includes 3-6 timestamped clips showing the mistake in context
4. **Drill-to-measurement loop**: Practice plans are automatically generated and outcomes tracked, closing the feedback loop

---

## 2. Why League of Legends is a Perfect Fit

### Event-Rich & Structured Data

LoL matches contain thousands of timestamped discrete events that make feature extraction tractable:

- **Ability casts**: Every Q/W/E/R with target, position, cooldown state
- **Movement**: Per-frame positions for pathing analysis
- **Economy**: Gold transactions, item purchases, CS events
- **Vision**: Ward placements/clears, sweepers, control wards
- **Objectives**: Dragon/Baron/Rift Herald timings, smite battles
- **Team coordination**: TP usage, engage timing, follow-up windows

This structured event stream aligns perfectly with your platform's GRID-like data ingestion pipeline, allowing you to adapt your existing enrichment and normalization layers.

### Clear Roles & Game Phases

LoL's distinct roles (Top, Jungle, Mid, ADC, Support) and phases (laning, roaming, objectives, late game) enable phase-specific signals and interventions:

- **Laning phase (0-14 min)**: CS efficiency, trading patterns, wave management, ward coverage
- **Mid game (14-25 min)**: Roam coordination, objective setup, TP timing, skirmish positioning
- **Late game (25+ min)**: Teamfight positioning, engage windows, objective control, split-push coordination

Your platform's micro → macro correlation engine can map early-game mistakes (e.g., missed CS under pressure) to mid-game consequences (weaker item timings, lost teamfights).

### Strong Coach & Analyst Culture

Teams at all levels (professional, academy, amateur, high-elo solo queue) already use VOD review extensively. Your product accelerates and automates this process:

- **Pro teams**: Replace 4-6 hour manual VOD sessions with 30-minute automated analysis + targeted review
- **Academy teams**: Scale coaching resources by identifying fixable mistakes automatically
- **Solo players**: Self-coaching through personalized insight cards and drill recommendations

### High ROI Per Marginal Improvement

Small improvements in CS, objective trades, or TP timing materially change match outcomes:

- **+2 CS/min improvement**: ~400g advantage at 20 minutes → earlier item spikes → higher teamfight win rate
- **3-second faster TP response**: 18% reduction in turret loss probability during sieges
- **+5% skillshot accuracy in teamfights**: Measurable increase in teamfight win rate

Your platform quantifies these marginal gains, making ROI visible and motivating behavior change.

### Repeatability

Micro-behaviors repeat across games—definable patterns to detect:

- Players consistently miss CS under pressure (detectable pattern: enemy within 600 units → missed last hit rate increases)
- Teams have consistent TP delay patterns (detectable: call time → TP start time → arrival time)
- Skillshot accuracy drops in 5v5 scenarios (detectable: accuracy in 1v1 vs 5v5 contexts)

Your pattern recognition engine, already proven on tactical FPS games, adapts naturally to these LoL-specific patterns.

---

## 3. Target Users & Success Scenarios

### Primary Users

#### Professional & Semi-Pro Coaches / Analysts

- **Pain point**: Manual VOD review takes 4-6 hours per match, limiting time for strategic planning
- **Use case**: Automated post-game analysis with top-3 action cards, evidence clips, and drill recommendations
- **Success metric**: 60-80% reduction in manual review time, increased coach satisfaction scores

#### Amateur Team Coaches & Academy Staff

- **Pain point**: Limited coaching resources, need to scale player development
- **Use case**: Practice planning with drill packs scheduled for training sessions, player progress tracking
- **Success metric**: Improved player skill acquisition rate, higher drill adherence percentages

#### Solo Players (High Elo) & Content Creators

- **Pain point**: Limited self-coaching tools, difficulty identifying own mistakes
- **Use case**: Post-game summaries with personalized insights, practice drill recommendations
- **Success metric**: Improved rank progression, content creation efficiency (faster VOD review for YouTube/Twitch)

#### Esports Organizations (Scouting & Player Development)

- **Pain point**: Subjective player evaluation, difficulty quantifying strengths/weaknesses
- **Use case**: Player profiling with quantified metrics, scouting reports with evidence
- **Success metric**: Improved scouting accuracy, better player development trajectories

### Use Cases

#### 1. Post-Game Debrief

- **Flow**: Match ends → automated analysis runs (5-10 minutes) → coach receives top-3 action cards
- **Output**: Each card includes confidence score, impact estimate, 3 evidence clips, prebuilt drill
- **Action**: Coach reviews, adjusts priority, assigns to players, exports to Practice Planner

#### 2. Practice Planning

- **Flow**: Coach selects action cards → converts to drill packs → schedules on team calendar
- **Output**: Drill assignments with duration, reps, target players, expected outcomes
- **Action**: Track adherence, measure post-drill KPIs, iterate on drill design

#### 3. Live Scrim Assistant

- **Flow**: Real-time match data ingestion → low-latency analysis (< 5s delay) → non-intrusive alerts
- **Output**: Analyst-only notifications (e.g., "Jungler flash on cooldown for 45s; avoid fight windows")
- **Action**: Analyst relays critical insights to coach during breaks, avoids disrupting player focus

#### 4. Scouting & Recruitment

- **Flow**: Upload match replays → automated player profiling → quantified strength/weakness reports
- **Output**: Per-player metrics with evidence clips, role-specific comparisons, development potential scores
- **Action**: Scout reviews reports, schedules follow-up interviews, makes recruitment decisions

### Success Signals

- **Percent reduction in target micro-mistakes**: e.g., missed CS rate decreases by 25% after 4 weeks of drill implementation
- **Improvement in objective control rates**: Dragon/baron secure rate increases by 15%
- **Coach adoption**: 80%+ of action cards are reviewed and assigned within 48 hours
- **Reduced manual VOD hours**: Average review time per match drops from 4 hours to 45 minutes

---

## 4. Data Sources & Ingestion

### Primary Sources

#### Official Match Data / Riot Match APIs (Post-Game)

- **Riot Match-V5 API**: Game timeline, events, participant stats, post-game data
- **Data available**: Match metadata, champion picks/bans, events (kills, deaths, objectives), participant stats, timeline events
- **Usage**: Primary data source for post-game analysis; respect Riot developer policy and rate limits
- **Integration**: Adapt your existing GRID ingestion pipeline to Riot API response format

#### VODs / Replay Parsing

- **Riot Replay Files (.rofl)**: Frame-accurate replay data with full match reconstruction
- **Community parsers**: Tools like `rofl-parser` or `rift-explorer` extract frame-level data
- **Data available**: Per-frame positions, ability casts, vision states, minion/ward positions, animations
- **Usage**: Fine-grain analysis for micro-signals (pathing, positioning, skillshot trajectories)
- **Integration**: Build replay parser module that extracts normalized events matching your event schema

#### Client Telemetry (Opt-In)

- **Local parser/plugin**: Teams opt-in to share live data during scrims
- **Data available**: Real-time event stream with < 1s latency
- **Usage**: Live scrim assistant, real-time alerts, practice session monitoring
- **Requirements**: Must follow Riot permissions, player consent (especially for minors), data privacy compliance
- **Integration**: WebSocket/SSE stream processing similar to your existing real-time pipeline

#### Third-Party Analytic Feeds

- **Tracker websites**: op.gg, u.gg, porofessor.gg (public match data enrichment)
- **Community parsers**: Additional context on meta trends, champion performance
- **Usage**: Enrichment layer for context (patch meta, champion win rates, item builds)
- **Integration**: Optional enrichment service that fetches and merges third-party data

### Minimum Event Schema

Your platform already uses a normalized event schema. For LoL, adapt it as follows:

```json
{
  "match_id": "match_001",
  "timestamp": 12345.678,
  "player_id": "blue_p1",
  "champion": "Zed",
  "role": "Mid",
  "event_type": "ability_cast",
  "ability": "R",
  "position": { "x": 3240, "y": 765, "z": 0 },
  "target_id": "red_p3",
  "metadata": {
    "cooldown_remaining_ms": 0,
    "cast_phase": "activate",
    "damage_dealt": 450,
    "kill_participation": true
  },
  "context": {
    "game_phase": "mid_game",
    "gold_at_time": 5200,
    "item_slots": ["duskblade", "youmuus", "boots"],
    "team_state": "even"
  }
}
```

### Design Notes

- **Normalized timestamps**: All events timestamped to a common clock (game time in seconds)
- **Per-frame positions**: Store positions at 1-4 Hz for pathing/positioning features (balance detail vs storage)
- **Event bus architecture**: Use your existing Kafka/Redis queue for near-real-time processing (SSE/WebSocket for live assistant)
- **Data retention**: Store raw events for 90 days, aggregated features indefinitely (aligns with Riot data policies)
- **Privacy**: Anonymize player IDs for public demos, support GDPR deletion requests

---

## 5. Micro-Signals: What to Capture

Break signals into player, position, ability, vision, economy, and team categories. Your platform's micro-analysis layer (`heuristicEngine.ts`) already detects mistakes in similar categories—adapt the heuristics to LoL-specific signals.

### Player Micro-Signals

#### CS-Per-Minute (CS/min)

- **Early game (0-10 min)**: Baseline CS expectations by role (ADC: 7-9/min, Mid: 8-10/min, Top: 7-9/min, Support: 0.5-1/min)
- **Mid game (10-20 min)**: CS/min adjusted for role and game state (roaming reduces CS, split-push increases)
- **Late game (20+ min)**: CS/min becomes less relevant; focus shifts to objective control and teamfight participation

#### Minion-Wave Metrics

- **Missed last-hits**: Count opportunities vs actual CS (whiffed CS due to trading, pressure, poor timing)
- **Gold lost**: Quantify gold deficit from missed CS (average 20g per minion)
- **Wave management**: Freeze vs push vs slow push patterns (detectable via minion health states and player positioning)

#### Ability Timing

- **Cast latency**: Time from trade cue (enemy ability cast, minion death) to player ability cast
- **Ultimate/flash misuse**: Track ultimate usage in low-impact scenarios (wasted ults, flash-for-nothing)
- **Cooldown utilization**: Percent of time abilities are used when off cooldown (efficiency metric)

#### Summoner Spell Timing

- **Heal/Ignite/TP usage**: Compare usage timing vs optimal windows (TP for objective vs TP for wave clear)
- **Flash usage**: Track flash-for-kill vs flash-to-survive efficiency, flash cooldown awareness

#### Reaction Time Metrics

- **Time from enemy reveal to first action**: Measure reaction speed to ganks, skillshots, engages
- **Peek timing**: ADC/Support reaction time to enemy ability casts in lane

### Position & Movement

#### Pathing Efficiency

- **Extra distance**: Compare actual path length vs shortest path for intended objective (jungle pathing, rotation efficiency)
- **Back timing**: Detect suboptimal back timing (backing before wave crash, backing during objective windows)

#### Lane Positioning

- **Average distance from tower**: Measure aggression/defensive positioning by game phase
- **Time spent in dangerous zones**: Percent time in gankable positions (detected via vision coverage + enemy jungle position)
- **Wave state positioning**: Positioning relative to minion wave (ahead/behind wave, wave crash timing)

#### Vision Proximity

- **Percent time inside vision range**: Time spent within range of friendly wards
- **Vision gaps**: Time spent in unwarded areas during high-risk phases (early game laning)

### Ability & Item Usage

#### Skillshot Accuracy

- **Hit/miss rate per ability**: Track skillshot accuracy for key abilities (Ezreal Q, Thresh Q, Lux Q, etc.)
- **Context-adjusted accuracy**: Accuracy in 1v1 vs teamfight scenarios (detect performance degradation under pressure)
- **Target selection**: Track skillshot target priority (hitting priority targets vs hitting tanks)

#### Ability Overlap

- **Wasted AoE**: Detect AoE abilities cast on unoccupied space (missed ults, wasted waveclear)
- **Ability combos**: Track combo execution (e.g., Leona E→Q→R combo timing)

#### Cleanse/Timing

- **Cleanse timing**: Time from incoming CC to cleanse usage (optimal: < 100ms, poor: > 500ms)
- **QSS usage**: Track QSS timing relative to critical CC (Malzahar R, Skarner R, etc.)

### Vision & Control

#### Wards Placed Per Minute

- **Wards/min by role**: Baseline expectations (Support: 1.5-2/min, Jungle: 0.8-1.2/min, others: 0.3-0.5/min)
- **Control ward usage**: Control wards placed per game, placement timing (before objectives, defensive vs offensive)

#### Vision Overlap

- **Redundant wards**: Detect overlapping ward coverage (inefficient vision economy)
- **Unique coverage**: Measure unique vision coverage per game phase

#### Scout Timing

- **Wards placed before objectives**: Detect ward placement timing relative to dragon/baron spawn (optimal: 60-90s before)
- **Sweeper usage**: Track sweeper activation timing and coverage

### Economy & Objective Signals

#### Gold Differential

- **Gold differential at 10/15/20 mins**: Team gold advantage/disadvantage at key milestones
- **Item timing**: Track item completion timing vs optimal windows (e.g., ADC first item at 12-14 min)

#### Drake / Baron Contest Participation

- **Contest participation**: Track presence at objective contests, damage dealt to objectives
- **Steal attempts**: Detect smite battle participation, steal success/failure
- **Objective setup**: Ward coverage, positioning, engage timing before objectives

#### Turret Damage & Timing

- **Turret damage per player**: Track turret damage contribution by role
- **Turret loss timing**: Detect preventable turret losses (early turret loss due to poor TP response)

### Team Coordination

#### TP Arrival Spread

- **TP arrival time variance**: Standard deviation of TP arrival times (low variance = good coordination)
- **TP delay**: Time from TP call to TP arrival (optimal: < 4s, poor: > 8s)

#### Engage-Follow Ratio

- **Engage success rate**: Percent of engages that yield successful follow-ups (detect communication/coordination gaps)
- **Follow-up timing**: Time from engage to follow-up actions (optimal: < 1s)

#### Trade Success Chains

- **First blood → objective**: Track how often first blood leads to objective within 60s
- **Kill → turret**: Track kill-to-turret conversion rate
- **Objective → objective**: Track objective chain success (dragon → turret → baron)

---

## 6. Feature Engineering Examples

Your platform's feature engineering layer (`features.py`) already handles aggregation, derivation, and temporal features. Adapt these examples to LoL:

### Simple Aggregates

- `cs_0_10`: CS per minute in first 10 minutes
- `cs_10_20`: CS per minute from 10-20 minutes
- `cs_20_plus`: CS per minute after 20 minutes
- `avg_skillshot_accuracy_last_10games`: Rolling average skillshot accuracy (last 10 matches)
- `wards_per_min_by_role`: Wards per minute normalized by role baseline
- `gold_diff_at_15`: Team gold differential at 15 minutes

### Derived Features

- `missed_cs_rate_when_under_pressure`: Missed CS / CS opportunities when enemy within 600 units
- `avg_tp_delay_on_defense`: Average seconds between enemy tower dive start and TP arrival
- `vision_gap_index`: Fraction of critical map tiles without friendly vision prior to objective (dragon/baron pit + approaches)
- `skillshot_accuracy_drop_in_teamfights`: Accuracy in 1v1 contexts - accuracy in 5v5 contexts
- `pathing_inefficiency_score`: (Actual path distance - shortest path distance) / shortest path distance
- `cooldown_utilization_rate`: Abilities used when off cooldown / total ability cooldown windows

### Temporal & Sequence Features

- `reaction_latency_series`: Sequence of reaction times per fight/scenario (feed to LSTM/Transformer for pattern detection)
- `ability_cooldown_utilization_series`: Time series of cooldown utilization by game phase
- `cs_trend`: Slope of CS/min over time (detect improving/declining performance)
- `gold_curve`: Gold over time, compared to role baseline (detect item timing issues)

### Context-Aware Features

- **Role normalization**: Normalize CS by role (Top vs Mid vs ADC have different baselines)
- **Champion normalization**: Adjust metrics by champion (Azir has different CS patterns than Zed)
- **Game phase modifiers**: Early game expectations differ from late game (CS matters early, teamfight positioning matters late)
- **Matchup context**: Adjust expectations based on lane matchup difficulty (counterpick vs favorable matchup)

### Team-Level Features

- `team_tp_coordination_score`: 1 / (stddev of TP arrival times) (higher = better coordination)
- `team_engage_follow_rate`: Successful engages / total engages
- `team_objective_control_rate`: Objectives secured / objectives contested
- `team_vision_control_score`: Average vision coverage in key areas (jungle entrances, objective pits)

---

## 7. Modeling & Reasoning

Your platform uses a multi-model approach (rule engines, gradient boosting, sequence models, counterfactuals). Adapt to LoL:

### Model Types

#### Rule Engine (Fast, Deterministic)

- **Use cases**: Simple heuristics that don't require ML
  - Late TP detection: `tp_delay > 10s` → flag as mistake
  - Missing CS under pressure: `missed_cs_rate_when_enemy_nearby > 0.3` → flag
  - Low ward coverage: `wards_per_min < role_baseline - 0.5` → flag
- **Implementation**: Adapt your existing rule-based mistake detection to LoL signals

#### Gradient Boosting (LightGBM/XGBoost)

- **Use cases**: Tabular features for interpretable predictions
  - Probability of death within 10s (positioning risk)
  - Probability of objective secure (dragon/baron steal prediction)
  - Win probability at game state (macro prediction)
- **Implementation**: Your existing LightGBM pipeline adapts directly (replace features, retrain)

#### Sequence Models (RNN/Transformer)

- **Use cases**: Temporal patterns for multi-tick decisions
  - Skillshot sequences: Predict next ability cast given sequence history
  - Kiting patterns: Analyze ADC kiting sequences in teamfights
  - Rotation patterns: Predict team rotation timing from movement sequences
- **Implementation**: Use your existing sequence modeling infrastructure (LSTM/Transformer layers)

#### Counterfactual Simulation

- **Use cases**: Estimate impact of small changes
  - "What if TP arrived 3s earlier?" → simulate objective outcome
  - "What if skillshot hit instead of missed?" → estimate teamfight outcome delta
  - "What if ward was placed 30s earlier?" → estimate vision impact on gank success
- **Implementation**: Your existing `counterfactual.py` module adapts to LoL game states

#### Causal Structure / Causal Inference

- **Use cases**: Estimate effect sizes for intervention claims
  - "CS improvement → item timing improvement → teamfight win rate increase" (causal chain)
  - "TP delay reduction → turret loss reduction" (causal effect)
- **Implementation**: Use matching/causal methods (propensity score matching, difference-in-differences) where applicable

### Explainability

Your platform already uses SHAP for tabular models and attention/attribution for sequence models. For LoL:

- **SHAP for LightGBM**: Feature importance for predictions (e.g., "CS/min contributes +0.15 to win probability, skillshot accuracy contributes +0.08")
- **Attention for Transformers**: Highlight which timesteps matter for sequence predictions (e.g., "Ability cast at t=120s is most predictive of teamfight outcome")
- **Textual rationales**: Combine top SHAP features with representative clips (e.g., "Missed CS under pressure (SHAP: +0.12) → weaker item timing → reduced teamfight DPS. Evidence: 6 clips showing missed last hits while trading.")

### Recommendation Ranking

Rank potential actions by:

- **Estimated impact**: Δ win probability or Δ objective chance (e.g., "TP delay reduction → +0.18 turret save probability")
- **Confidence**: Model stability + evidence count (e.g., "High confidence: 15+ examples of this mistake, consistent pattern")
- **Effort / cost to implement**: Drill time, role swap complexity (e.g., "Low effort: 10-minute drill, no role changes needed")

Your existing insight prioritization logic (`prioritizeInsights()` in `insightEngine.ts`) adapts to these LoL-specific ranking criteria.

---

## 8. User Flows & UX

Your platform's UI already supports insights, drills, and practice planning. Adapt these flows to LoL:

### Design Philosophy: Coach-First

LoL coaches are the primary users—design flows that save time, provide actionable insights, and integrate seamlessly into existing workflows (VOD review, practice planning, live scrims).

### Primary Modes

#### 1. Post-Game Debrief Flow

**Entry point**: Match ends → automated analysis completes (5-10 minutes) → coach receives notification

**Screen 1: Match Summary Dashboard**

- Match overview: Teams, score, duration, key events (first blood, first dragon, baron, game end)
- Top 3 recommended action cards (player & team level)
- Quick filters: By player, by role, by game phase

**Screen 2: Insight Card Detail**

- **Header**: Title, player/team, confidence badge, impact estimate
- **Observation**: Textual summary of the issue (e.g., "Player05 missed 37 last hits when enemy top laner was in proximity")
- **Impact**: Quantified consequences (e.g., "Estimated -120g/game → weaker item timings → less teamfight DPS")
- **Evidence**: 3-6 evidence clips (6-8 second auto-clips centered on timestamp)
- **Action**: Prebuilt drill recommendation with duration, reps, target players
- **Buttons**: "Play Clip", "Add to Practice", "Share with Player", "Dismiss", "Explain" (opens SHAP rationale)

**Screen 3: Practice Planner Integration**

- Click "Add to Practice" → modal opens with drill pre-filled
- Coach adjusts: Duration, reps, target players, schedule date/time
- Click "Save & Assign" → drill added to Practice Planner calendar

#### 2. Practice Planner

**Screen 1: Drill Library**

- Browse prebuilt drills by category (CS, positioning, team coordination, etc.)
- Filter by role, difficulty, duration
- Create custom drills

**Screen 2: Calendar View**

- Weekly/monthly calendar with scheduled drills
- Drill assignments by player/role
- Track adherence: Completed / Assigned / Pending

**Screen 3: Drill Detail**

- Drill parameters: Duration, reps, instructions, target KPIs
- Player assignments: Who should do this drill
- Outcomes: Track post-drill KPIs (e.g., "CS/min improved from 7.2 to 8.1 after 3 sessions")

#### 3. Live / Scrim Assistant

**Screen 1: Analyst Dashboard (Non-Intrusive)**

- Real-time match timeline with key events highlighted
- Low-latency alerts (< 5s delay): "Jungler flash on cooldown for 45s", "Enemy TP available, watch for split push"
- Quiet mode: Alerts visible to analyst only, not players
- Export insights to post-game analysis

**Screen 2: Coach Overlay (Optional)**

- Coach can view analyst dashboard during breaks
- Prioritize insights for post-game discussion
- Mark insights as "discussed" to avoid redundancy

### UI Primitives

#### Insight Card Component

- **Title**: Concise, action-oriented (e.g., "Missed CS Under Pressure — Top")
- **Impact badge**: Visual indicator (High/Medium/Low impact, color-coded)
- **Confidence**: Percentage or badge (High/Medium/Low confidence)
- **Evidence thumbnails**: Clickable thumbnails that open clip viewer
- **Action buttons**: "Play Clip", "Add to Practice", "Share", "Dismiss", "Explain"

#### Clip Scrubber Component

- 6-8 second auto-clips centered on evidence timestamp
- Playback controls: Play, pause, seek, speed (0.5x, 1x, 2x)
- Context: Show 2-3 seconds before and after key event
- Overlay: Highlight key events (ability cast, CS miss, TP arrival)

#### Timeline Component

- Per-match timeline with game phases labeled (Laning / Mid Game / Late Game)
- Heatmap overlays: High-activity periods (teamfights, objective contests)
- Event filters: Filter by event type (kills, objectives, wards, abilities)
- Click event → jump to clip viewer

#### Drill Builder Modal

- Parameters: Duration, reps, instructions, target KPIs
- Quick assign: Select players/roles, schedule date/time
- Preview: Show drill details before saving

### Accessibility & Coach Needs

- **Coach-centric language**: Use LoL terminology (e.g., "trade order", "wave management") not raw model jargon
- **Explain button**: Opens concise rationalization (SHAP top features + causal reasoning)
- **Export options**: Export insights to PDF, share via team Slack/Discord, integrate with team management tools
- **Mobile responsive**: Coaches review insights on tablets/phones during travel
- **Dark mode**: Reduce eye strain during long VOD review sessions

---

## 9. Example Insight Cards

Three sample insights tailored to LoL, ready for UI implementation:

### Card 1 — "Missed CS Under Pressure (Top Lane)"

```json
{
  "id": "insight_001",
  "title": "Missed CS Under Pressure — Top (Player_blue_p1)",
  "player_id": "blue_p1",
  "role": "Top",
  "champion": "Garen",
  "issue": "Player05 missed 37 last hits when enemy top laner was in proximity (last 20 games).",
  "impact": "Estimated -120g/game → weaker item timings (Trinity Force delayed by ~2 min) → less teamfight DPS.",
  "recommendation": "Warmup drill: 10 minutes of pressure CS warmups (controlled skirmish + wave freeze practice).",
  "confidence": 0.78,
  "impact_level": "high",
  "evidence": [
    { "match_id": "match_001", "time": 120, "clip_url": "/clips/match_001_120.mp4" },
    { "match_id": "match_001", "time": 345, "clip_url": "/clips/match_001_345.mp4" },
    { "match_id": "match_003", "time": 78, "clip_url": "/clips/match_003_78.mp4" }
  ],
  "shap_rationale": "Missed CS under pressure (SHAP: +0.12) → CS/min below role baseline (SHAP: +0.08) → gold deficit (SHAP: +0.15) → item timing delay (SHAP: +0.10).",
  "buttons": ["Play Clip", "Add to Practice", "Share with Player", "Explain"]
}
```

**UI Display**:

- **Header**: "Missed CS Under Pressure — Top (Player_blue_p1)" with High Impact badge (red)
- **Observation**: "Player05 missed 37 last hits when enemy top laner was in proximity (last 20 games)."
- **Impact**: "Estimated -120g/game → weaker item timings → less teamfight DPS."
- **Evidence**: 3 thumbnail clips, click to open clip viewer
- **Action**: "10-minute pressure CS warmup drill"
- **Buttons**: Play Clip, Add to Practice, Share, Explain

### Card 2 — "Late TP Response (Mid Lane)"

```json
{
  "id": "insight_002",
  "title": "Late Teleport Response — Mid (Player_red_p3)",
  "player_id": "red_p3",
  "role": "Mid",
  "champion": "Syndra",
  "issue": "Average TP response delay is 7.8s after objective call (ideal < 4s) across 8 rotations.",
  "impact": "Increased turret loss probability by +18% in sieges. Lost 3 turrets in last 10 matches due to late TP.",
  "recommendation": "Establish standardized TP call procedure; practice 5x 'fast TP' scenarios with set backup positions.",
  "confidence": 0.84,
  "impact_level": "high",
  "evidence": [
    { "match_id": "match_002", "time": 620, "clip_url": "/clips/match_002_620.mp4" },
    { "match_id": "match_005", "time": 410, "clip_url": "/clips/match_005_410.mp4" },
    { "match_id": "match_007", "time": 732, "clip_url": "/clips/match_007_732.mp4" }
  ],
  "shap_rationale": "TP delay (SHAP: +0.18) → turret loss probability (SHAP: +0.22) → objective control deficit (SHAP: +0.15).",
  "buttons": ["Show Timeline", "Create Team Drill", "Export to Planner"]
}
```

**UI Display**:

- **Header**: "Late Teleport Response — Mid (Player_red_p3)" with High Impact badge (red)
- **Observation**: "Average TP response delay is 7.8s after objective call (ideal < 4s)."
- **Impact**: "Increased turret loss probability by +18% in sieges."
- **Evidence**: Timeline view showing TP events and resulting turret losses
- **Action**: "Standardized TP call procedure + 5x fast TP drills"
- **Buttons**: Show Timeline, Create Team Drill, Export to Planner

### Card 3 — "Skillshot Accuracy Drop in Teamfights (ADC)"

```json
{
  "id": "insight_003",
  "title": "Skillshot Accuracy Drop in 5v5 — ADC (Player_blue_p4)",
  "player_id": "blue_p4",
  "role": "ADC",
  "champion": "Ezreal",
  "issue": "Skillshot accuracy (Ezreal Q) drops from 74% in isolated fights to 49% in 5v5 teamfights—positioning/peeking problem suspected.",
  "impact": "Reduced DPS window in teamfights, fewer teamfight wins (teamfight win rate: 45% vs 62% team average).",
  "recommendation": "Positioning & kiting drills: 6 x 2-minute scrim pockets focusing on pre-aim in teamfight setups.",
  "confidence": 0.73,
  "impact_level": "medium",
  "evidence": [
    { "match_id": "match_004", "time": 1020, "clip_url": "/clips/match_004_1020.mp4" },
    { "match_id": "match_004", "time": 1036, "clip_url": "/clips/match_004_1036.mp4" },
    { "match_id": "match_004", "time": 1044, "clip_url": "/clips/match_004_1044.mp4" }
  ],
  "shap_rationale": "Teamfight skillshot accuracy (SHAP: +0.14) → DPS window (SHAP: +0.12) → teamfight win probability (SHAP: +0.16).",
  "buttons": ["Play Teamfight Clips", "Assign Drill", "Mark Implemented"]
}
```

**UI Display**:

- **Header**: "Skillshot Accuracy Drop in 5v5 — ADC (Player_blue_p4)" with Medium Impact badge (yellow)
- **Observation**: "Skillshot accuracy drops from 74% (1v1) to 49% (5v5 teamfights)."
- **Impact**: "Reduced DPS window, fewer teamfight wins."
- **Evidence**: Overlaid teamfight replays with positional heatmaps, skillshot trajectory overlays
- **Action**: "6 x 2-minute positioning & kiting drills"
- **Buttons**: Play Teamfight Clips, Assign Drill, Mark Implemented

---

## 10. Pilot Design & Evaluation

Design a 6-12 week pilot with an academy or semi-pro team to validate the platform's effectiveness.

### Pilot Objectives

1. **Validate detection accuracy**: Precision/recall of micro-mistake detection (e.g., "Is the missed CS detection accurate?")
2. **Measure behavior change**: Implementation rate of action cards (e.g., "Do players complete assigned drills?")
3. **Measure outcome impact**: CS improvement, objective control improvement, win rate improvement

### Pilot Phases

#### Phase 1: Onboarding & Baseline (2 weeks)

- **Week 1**: Onboard team, collect historical match data (last 20-30 matches), set up data pipeline
- **Week 2**: Collect 2 weeks of live match data, establish baseline KPIs (CS/min, objective control rate, TP delay, etc.)
- **Deliverables**: Baseline KPI report, data pipeline validated

#### Phase 2: Intervention (6 weeks)

- **Week 3-8**: Weekly action cards delivered to coach, 2 mandatory drills per week per player
- **Process**: Coach reviews action cards, assigns drills, tracks adherence
- **Support**: Weekly check-ins with coach, adjust recommendations based on feedback
- **Deliverables**: Weekly action cards, drill assignments, adherence tracking

#### Phase 3: Measurement (2 weeks)

- **Week 9-10**: Measure KPIs against baseline, compare intervention group vs control group (if applicable)
- **Analysis**: Statistical tests (paired t-test for continuous metrics, logistic regression for binary outcomes)
- **Deliverables**: Pilot results report, ROI analysis, coach/player feedback

### Metrics

#### Primary Metrics

- **Reduction in target micro-mistakes**: e.g., missed CS rate decreases by 25% (from 0.30 to 0.225)
- **CS improvement**: CS/min increases by 0.5-1.0 (role-dependent)
- **TP delay reduction**: Average TP delay decreases by 2-3 seconds

#### Secondary Metrics

- **Objective control rate**: Dragon/baron secure rate increases by 10-15%
- **Win rate in contested scenarios**: Teamfight win rate improves by 5-10%
- **Gold/10 improvement**: Team gold/10 increases by 50-100g at 15 minutes

#### Adoption Metrics

- **Action card implementation rate**: 80%+ of action cards reviewed and assigned within 48 hours
- **Drill adherence**: 70%+ of assigned drills completed
- **Coach satisfaction**: Coach satisfaction score > 4.0/5.0 (survey)

### Experimental Design

#### Option 1: Pre-Post Design (No Control Group)

- **Baseline**: Measure KPIs for 2 weeks before intervention
- **Intervention**: Apply platform for 6 weeks
- **Post-measurement**: Measure KPIs for 2 weeks after intervention
- **Analysis**: Paired t-test comparing baseline vs post-intervention

#### Option 2: A/B Design (If Feasible)

- **Split team**: Divide players into intervention group (receive action cards + drills) vs control group (no action cards)
- **Matching**: Match players by role and baseline performance
- **Analysis**: Compare intervention group vs control group (independent t-test, controlling for baseline differences)

#### Statistical Tests

- **Continuous metrics** (CS/min, TP delay): Paired t-test (pre-post) or independent t-test (A/B)
- **Binary outcomes** (objective secure, teamfight win): Logistic regression controlling for opponent strength, patch changes, game length
- **Effect sizes**: Report Cohen's d for continuous metrics, odds ratios for binary outcomes

### Success Criteria

- **Detection accuracy**: Precision > 0.80, recall > 0.75 for micro-mistake detection
- **Behavior change**: 70%+ drill adherence, 80%+ action card implementation rate
- **Outcome impact**: Statistically significant improvement (p < 0.05) in at least 2 primary metrics
- **Coach satisfaction**: Coach satisfaction score > 4.0/5.0

---

## 11. KPIs & Dashboard

Your platform's dashboard already supports KPIs and visualizations. Adapt these to LoL:

### Player KPIs

#### CS Per Minute (Phase Split)

- **Early game (0-10 min)**: CS/min with role baseline comparison (e.g., "7.2/min vs 8.0/min baseline")
- **Mid game (10-20 min)**: CS/min adjusted for role and game state
- **Trend**: CS/min trend over last 10 matches (improving/declining)

#### KDA Adjusted for Role & Match Context

- **Raw KDA**: Kills, deaths, assists
- **Adjusted KDA**: Normalized by role (Supports have lower KDA, ADCs have higher) and match context (winning vs losing)
- **Kill participation**: KP% (kills + assists) / team kills

#### Skillshot Hit Rate (Phase Split)

- **1v1 accuracy**: Skillshot accuracy in isolated scenarios
- **Teamfight accuracy**: Skillshot accuracy in 5v5 scenarios
- **Accuracy drop**: Difference between 1v1 and teamfight accuracy (detect performance degradation)

#### Average TP Delay (Seconds)

- **TP delay**: Average time from TP call to TP arrival
- **Target**: < 4s (good), 4-8s (needs improvement), > 8s (poor)
- **Trend**: TP delay trend over last 10 matches

### Team KPIs

#### Objective Success Rate

- **Dragon secure rate**: Dragons secured / dragons contested
- **Baron secure rate**: Barons secured / barons contested
- **Objective control score**: Weighted average of dragon/baron/rift herald secure rates

#### Tower Decline Rate

- **Turret loss rate**: Turrets lost per match
- **Preventable turret losses**: Turrets lost due to late TP / poor coordination (flagged by analysis)

#### Teamfight Win Probability (Modeled)

- **Teamfight win rate**: Teamfights won / total teamfights
- **Modeled probability**: Predicted teamfight win probability based on game state (gold, positioning, cooldowns)

#### Vision Control Metrics

- **Wards per minute**: Team average wards/min
- **Ward coverage %**: Percent of critical map areas with friendly vision (jungle entrances, objective pits)
- **Vision score**: Composite metric combining wards/min, coverage %, and control ward usage

### Coach/Operational KPIs

#### Time Saved Per VOD Review (Hours)

- **Baseline**: Average hours spent on manual VOD review per match (e.g., 4 hours)
- **With platform**: Average hours spent with platform (e.g., 0.75 hours: 30 min automated analysis + 45 min targeted review)
- **Time saved**: Baseline - With platform (e.g., 3.25 hours saved per match)

#### Action Cards Implemented (%)

- **Implementation rate**: Action cards assigned to players / total action cards generated
- **Target**: 80%+ implementation rate

#### Drill Adherence (%)

- **Adherence rate**: Drills completed / drills assigned
- **Target**: 70%+ adherence rate

### Dashboard Layout

#### Top Row: Match Summary + Top 3 Insights

- **Match overview**: Teams, score, duration, key events
- **Top 3 insights**: Action cards with confidence, impact, evidence thumbnails
- **Quick filters**: By player, by role, by game phase

#### Mid Section: Timeline + Team Heatmap

- **Timeline**: Per-match timeline with game phases, key events, heatmap overlays
- **Team heatmap**: Map visualization showing player positions, ward coverage, objective locations
- **Event filters**: Filter by event type (kills, objectives, wards, abilities)

#### Bottom Section: Drill Planner + KPI Trends

- **Drill planner**: Calendar view with scheduled drills, adherence tracking
- **KPI trends**: Sparkline charts per KPI showing trends over last 10 matches
- **Player comparison**: Compare players by role (e.g., "Top laner CS/min vs team average")

---

## 12. Monetization & GTM

### Pricing Tiers

#### Free / Community Tier

- **Target**: Solo players (high elo), content creators
- **Features**: Post-game summaries for solo queue, limited insights (3 per match), basic evidence clips
- **Limitations**: No drill library, no practice planner, no team features
- **Monetization**: Freemium model, upsell to paid tiers

#### Team Starter Tier ($99/month per team)

- **Target**: Amateur teams, small organizations
- **Features**: Post-game analytics, 10 action cards per month, basic drill library, practice planner (basic)
- **Limitations**: No API access, no custom model training, limited evidence clip storage

#### Pro / Academy Tier ($299/month per team)

- **Target**: Academy teams, semi-pro organizations
- **Features**: Extended drill library, practice planner (full), evidence clip hosting (unlimited), API access, priority support
- **Add-ons**: Custom drill creation, advanced analytics, team comparison tools

#### Enterprise / Org Tier (Custom pricing)

- **Target**: Professional organizations, large esports orgs
- **Features**: SSO, on-prem option (if needed), custom model training, white-glove onboarding, dedicated support
- **Add-ons**: Custom integrations (Slack, Discord, team management tools), dedicated account manager

### GTM Channels

#### Partnerships

- **Esports academies**: Partner with academy programs (T1 Academy, Fnatic Rising, etc.) for pilot programs
- **Coaching schools**: Integrate with coaching education programs (e.g., GameLeap, Skill-Capped)
- **Content creators**: Sponsor LoL coaching content creators (LS, Coach Curtis, etc.) for product demos

#### Content & Creator Integrations

- **Coach partnerships**: Work with professional coaches to create drill library content
- **Streamer integrations**: Provide tools for streamers to analyze their own gameplay (content creation tool)
- **YouTube/Twitch**: Sponsor LoL coaching channels, provide free tools for content creation

#### Integration Partnerships

- **Scrim lobbies**: Integrate with scrim platforms (e.g., Scrim.gg) for easier data ingestion
- **Team management tools**: Integrate with team management platforms (e.g., TeamSpeak, Discord bots)
- **Analytics platforms**: Partner with existing LoL analytics tools (op.gg, u.gg) for data enrichment

#### Pilot Offers

- **Free pilot**: Offer 6-week free pilot to qualified teams (academy, semi-pro)
- **Success stories**: Document pilot results, create case studies, share on website/blog
- **Referral program**: Incentivize teams to refer other teams (discount on subscription)

### Sales Motion

#### Pilot-First Approach

1. **Outreach**: Reach out to academy/semi-pro teams via email, LinkedIn, Discord
2. **Pilot offer**: Offer free 6-week pilot with data collection + training
3. **Onboarding**: Set up data pipeline, train coach on platform, establish baseline KPIs
4. **Support**: Weekly check-ins, adjust recommendations, gather feedback
5. **Results**: Measure outcomes, create case study, convert to paid subscription

#### ROI Emphasis

- **Time savings**: "Save 3+ hours per match on VOD review" (quantified value)
- **Measurable improvements**: "Average CS/min improvement of 0.8 after 4 weeks" (proof of value)
- **Coach efficiency**: "Coaches spend 60% less time on manual analysis, 40% more time on strategy" (efficiency gain)

#### Pricing Strategy

- **Start low**: Initial pricing may be lower to gain traction, raise as value is proven
- **Value-based pricing**: Price based on value delivered (time saved, improvements achieved) not cost
- **Annual discounts**: Offer 20% discount for annual subscriptions (improve cash flow, reduce churn)

---

## 13. Technical Architecture

Your platform's architecture (FastAPI backend, React frontend, PostgreSQL, Redis, Celery) adapts well to LoL. Key adaptations:

### High-Level Architecture

#### Ingest Layer

- **Riot API ingestion**: Adapt your GRID ingestion pipeline to Riot Match-V5 API
- **Replay parser**: Build replay parser module (`.rofl` file parsing) → normalized event stream
- **Client telemetry (opt-in)**: WebSocket/SSE stream for real-time data (live scrim assistant)
- **Output**: Normalized event stream matching your existing event schema

#### Stream Processing

- **Event enrichment**: Adapt your `enricher.py` to add LoL-specific context (game phase, role, matchup)
- **Queue**: Use Kafka/Redis queue for event enrichment (same as existing architecture)
- **Real-time processing**: Near-real-time streams for scrim/live assistant (< 5s latency target)

#### Feature Store

- **PostgreSQL**: Store aggregated features (CS/min, skillshot accuracy, TP delay, etc.)
- **Redis**: Real-time features for live assistant (current game state, recent events)
- **Schema**: Adapt your existing feature schema to LoL signals

#### Model Services

- **Python microservices**: LightGBM, PyTorch models served via REST/gRPC (same as existing)
- **Model types**: Rule engine, LightGBM, sequence models (LSTM/Transformer), counterfactuals
- **Explainability service**: SHAP/attention explainers + rationalizer (same as existing)

#### API & UI

- **Backend**: FastAPI (same as existing) with LoL-specific endpoints
- **Frontend**: React (same as existing) with LoL-specific components (insight cards, timeline, drill planner)
- **WebSocket**: Real-time updates for live scrim assistant (same as existing WebSocket infrastructure)

#### Clip Generation

- **Snippet generator**: Extract 6-8 second clips from replay files centered on evidence timestamps
- **Storage**: S3 for clip storage, CDN for delivery (same as existing)
- **Processing**: Async clip generation via Celery (same as existing task queue)

#### Auth & Data Governance

- **OAuth2**: Same as existing authentication
- **Role-based access**: Coach, analyst, player roles (same as existing)
- **Team segregation**: Data isolation per team (same as existing)

### Scalability Notes

- **Batch processing**: Use batch for historical feature computation (same as existing)
- **Near-real-time streams**: Use streams for scrim/live assistant (same as existing)
- **Precomputed indicators**: Cache expensive analyses (e.g., per-match SHAP explanations) (same as existing)
- **Horizontal scaling**: Stateless API services, scale via load balancer (same as existing)

### Key Adaptations from Existing Architecture

1. **Data ingestion**: Replace GRID ingestion with Riot API + replay parser
2. **Feature engineering**: Adapt `features.py` to LoL signals (CS/min, TP delay, etc.)
3. **Model training**: Retrain models on LoL data (same pipeline, different features)
4. **UI components**: Adapt insight cards, timeline, drill planner to LoL terminology and workflows
5. **Clip generation**: Replace FPS replay parsing with LoL replay parsing (`.rofl` files)

---

## 14. Safety, Legal & Ethical Considerations

### Riot Policy & IP

#### API Terms & Developer Policies

- **Riot Developer Portal**: Review and comply with Riot's API terms of service
- **Rate limits**: Respect API rate limits (100 requests per 2 minutes per API key)
- **Data usage**: Use Riot data only for permitted purposes (coaching, analytics, not for gambling/betting)
- **Attribution**: Acknowledge Riot Games as data source (if required by terms)

#### Plugin/Telemetry Permissions

- **Client telemetry**: Any plugin/telemetry that accesses game client must comply with Riot's policies
- **Third-party tools**: Riot may prohibit certain third-party tools—verify before building client-side telemetry
- **Approvals**: Obtain necessary approvals from Riot before launching client telemetry features

#### VOD/Replay Parsing

- **Replay files**: Replay files (`.rofl`) are user-generated—parsing is generally allowed
- **Redistribution**: Avoid redistributing Riot assets (champion models, maps, etc.) without permission
- **Video clips**: Generated clips may contain Riot IP—consider watermarking, attribution

### Privacy & Consent

#### Player Consent

- **Opt-in data**: For any live client telemetry, obtain explicit player/team consent
- **Minors**: Special considerations for academy players (may require parental consent)
- **Data deletion**: Support GDPR deletion requests (delete player data on request)

#### Data Anonymization

- **Public demos**: Anonymize player IDs/names in public demonstrations
- **Research**: If sharing data for research, anonymize and aggregate appropriately

#### Data Retention

- **Retention policy**: Define clear data retention policy (e.g., raw events 90 days, aggregated features indefinitely)
- **Deletion**: Provide data deletion capability for players/teams

### Responsible Recommendations

#### Human-in-Loop

- **Always keep human-in-loop**: Coaches review, adjust, and approve insights before they reach players
- **No automation of in-game actions**: Do not automate in-game actions (no bots, no automation tools)
- **No cheating recommendations**: Do not recommend behaviors that encourage cheating/exploitation

#### Confidence & Provenance

- **Visible confidence**: Make model confidence visible to coaches (confidence badges, uncertainty intervals)
- **Provenance**: Show data provenance (which matches, which events contributed to insight)
- **Explainability**: Provide SHAP-based explanations for all recommendations (avoid black-box recommendations)

### Bias & Fairness

#### Patch/Champion Limitations

- **Patch changes**: Models must adapt quickly with patch changes (retrain models after major patches)
- **Champion-specific**: Be transparent about limitations across champions (some champions have different patterns)
- **Meta shifts**: Acknowledge that recommendations may be meta-dependent (current meta may differ from training data)

#### Role-Normalized Features

- **Role-appropriate behavior**: Avoid penalizing players for role-appropriate behavior (Supports have lower CS, that's expected)
- **Role normalization**: Use role-normalized features (compare ADC CS to ADC baseline, not to Support baseline)
- **Context-aware**: Consider matchup context (counterpick vs favorable matchup) when setting expectations

---

## 15. Roadmap, Risks & Appendix

### 6-Month Roadmap (Summary)

#### Month 0-1: Data Plumbing & Prototype

- **Week 1-2**: Set up Riot API integration, build replay parser prototype (`.rofl` parsing)
- **Week 3-4**: Build minimal UI (match summary, basic insight cards), extract basic features (CS/min, skillshot accuracy)
- **Deliverable**: Working prototype that ingests LoL data and displays basic insights

#### Month 2-3: Rule Engine & Action Cards

- **Week 5-6**: Implement rule engine for LoL-specific mistakes (late TP, missed CS under pressure)
- **Week 7-8**: Build action card generation pipeline, create first 10 action cards
- **Week 9-10**: Pilot with academy team (data collection, baseline KPIs)
- **Week 11-12**: Refine action cards based on pilot feedback
- **Deliverable**: Rule-based action cards with evidence clips, pilot results

#### Month 4: ML Models & Explainability

- **Week 13-14**: Train LightGBM models (death prediction, objective secure prediction)
- **Week 15-16**: Add SHAP explanations, integrate into action cards
- **Week 17**: Clip evidence generation (6-8 second clips from replays)
- **Deliverable**: ML-powered insights with SHAP explanations, evidence clips

#### Month 5: Practice Planner & Drill Library

- **Week 18-19**: Build practice planner (calendar, drill assignments, adherence tracking)
- **Week 20-21**: Create drill library (20+ drills covering CS, positioning, team coordination)
- **Week 22**: Coach UX polish (improve language, add export options, mobile responsive)
- **Deliverable**: Full practice planner with drill library, polished UX

#### Month 6: Scaled Pilots & GTM

- **Week 23-24**: Scale pilots (3-5 teams), measure outcomes, create case studies
- **Week 25-26**: GTM (partnerships, content, integrations), billing system
- **Week 27-28**: Launch (public beta or paid tiers), iterate based on feedback
- **Deliverable**: Launched product with paying customers, case studies, GTM materials

### Key Risks & Mitigations

#### Risk 1: Data Quality / Patch Drift

- **Risk**: LoL patches change game balance frequently (every 2 weeks), models may become outdated
- **Mitigation**:
  - Retrain models after major patches (monthly retraining schedule)
  - Maintain per-patch models (separate models for patch 13.1, 13.2, etc.)
  - Add rule fallbacks (rule-based recommendations work even if ML models are outdated)
  - Monitor model performance (track prediction accuracy over time, retrain if accuracy drops)

#### Risk 2: Coach Adoption

- **Risk**: Coaches may not adopt platform if it doesn't integrate well with existing workflows
- **Mitigation**:
  - Start with coach-centric UX (design for coaches, not players)
  - Provide actionable suggestions (not just analytics, but drills and practice plans)
  - Start with small, safe recommendations (build trust before recommending major changes)
  - Offer training/onboarding (help coaches learn to use platform effectively)

#### Risk 3: Legal / Riot Policy

- **Risk**: Riot may change API terms or prohibit certain use cases
- **Mitigation**:
  - Consult Riot policy early (review terms before building)
  - Use opt-in data (avoid client telemetry if uncertain about permissions)
  - Build defensively (design system to work with public API data only, client telemetry as optional)
  - Monitor Riot communications (watch for policy changes, adapt quickly)

#### Risk 4: Technical Complexity (Replay Parsing)

- **Risk**: LoL replay parsing (`.rofl` files) is complex, may delay development
- **Mitigation**:
  - Use existing community parsers (leverage `rofl-parser` or similar tools, don't build from scratch)
  - Start with API data (use Riot API for initial version, add replay parsing later)
  - Incremental approach (start simple, add complexity over time)

### Appendix: Example SQL Queries

#### Count Missed CS While Enemy Nearby

```sql
SELECT
    player_id,
    SUM(CASE WHEN event_type = 'cs_miss' AND enemy_nearby = 1 THEN 1 ELSE 0 END) AS missed_cs_under_pressure,
    SUM(CASE WHEN event_type = 'cs_opportunity' AND enemy_nearby = 1 THEN 1 ELSE 0 END) AS cs_opportunities_under_pressure,
    COUNT(DISTINCT match_id) AS total_matches
FROM player_events
WHERE event_type IN ('cs_miss', 'cs_opportunity')
GROUP BY player_id
HAVING SUM(CASE WHEN event_type = 'cs_opportunity' AND enemy_nearby = 1 THEN 1 ELSE 0 END) > 10
ORDER BY missed_cs_under_pressure DESC;
```

#### Estimate TP Delay

```sql
SELECT
    m.match_id,
    p.player_id,
    p.role,
    MIN(CASE WHEN e.event_type = 'tp_cast' THEN e.timestamp END) AS tp_start_time,
    MIN(CASE WHEN c.event_type = 'tp_call' THEN c.timestamp END) AS tp_call_time,
    MIN(CASE WHEN e.event_type = 'tp_cast' THEN e.timestamp END) -
    MIN(CASE WHEN c.event_type = 'tp_call' THEN c.timestamp END) AS tp_delay_seconds
FROM matches m
JOIN players p ON m.match_id = p.match_id
LEFT JOIN events e ON e.match_id = m.match_id AND e.player_id = p.player_id AND e.event_type = 'tp_cast'
LEFT JOIN team_events c ON c.match_id = m.match_id AND c.event_type = 'tp_call'
WHERE c.timestamp IS NOT NULL AND e.timestamp IS NOT NULL
GROUP BY m.match_id, p.player_id, p.role
HAVING MIN(CASE WHEN e.event_type = 'tp_cast' THEN e.timestamp END) -
       MIN(CASE WHEN c.event_type = 'tp_call' THEN c.timestamp END) > 0
ORDER BY tp_delay_seconds DESC;
```

#### Calculate Skillshot Accuracy by Context

```sql
SELECT
    player_id,
    champion,
    SUM(CASE WHEN context = '1v1' AND hit = 1 THEN 1 ELSE 0 END) AS hits_1v1,
    SUM(CASE WHEN context = '1v1' THEN 1 ELSE 0 END) AS attempts_1v1,
    SUM(CASE WHEN context = 'teamfight' AND hit = 1 THEN 1 ELSE 0 END) AS hits_teamfight,
    SUM(CASE WHEN context = 'teamfight' THEN 1 ELSE 0 END) AS attempts_teamfight,
    ROUND(100.0 * SUM(CASE WHEN context = '1v1' AND hit = 1 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN context = '1v1' THEN 1 ELSE 0 END), 0), 2) AS accuracy_1v1_pct,
    ROUND(100.0 * SUM(CASE WHEN context = 'teamfight' AND hit = 1 THEN 1 ELSE 0 END) /
          NULLIF(SUM(CASE WHEN context = 'teamfight' THEN 1 ELSE 0 END), 0), 2) AS accuracy_teamfight_pct
FROM skillshot_events
WHERE event_type = 'ability_cast' AND ability_type = 'skillshot'
GROUP BY player_id, champion
HAVING SUM(CASE WHEN context = '1v1' THEN 1 ELSE 0 END) > 10
   AND SUM(CASE WHEN context = 'teamfight' THEN 1 ELSE 0 END) > 10
ORDER BY (accuracy_1v1_pct - accuracy_teamfight_pct) DESC;
```

---

## Conclusion

Your AI Assistant Coach platform is uniquely positioned to transform LoL performance analysis. The platform's existing architecture—micro → macro analytics, explainability, human-in-loop workflows—aligns naturally with LoL's event-rich, role-based, phase-structured gameplay.

**Key Advantages**:

1. **Proven architecture**: Your existing platform (FastAPI, React, ML pipeline, explainability) adapts directly to LoL
2. **Strong market fit**: LoL's coach/analyst culture, event-rich data, and high ROI per marginal improvement create strong demand
3. **Differentiated value**: Explainable AI, evidence-backed insights, and drill-to-measurement loops differentiate from generic analytics tools

**Next Steps**:

1. **Month 0-1**: Build data plumbing (Riot API integration, replay parser prototype)
2. **Month 2-3**: Implement rule engine, create first action cards, pilot with academy team
3. **Month 4-6**: Add ML models, build practice planner, scale pilots, launch

This blueprint provides a complete roadmap for applying your platform to League of Legends. The 15 sections cover technical architecture, user flows, monetization, risks, and implementation details—everything needed to execute on this opportunity.

---

_Document Version: 1.0_  
_Last Updated: January 2026_  
_Total Pages: 15_
