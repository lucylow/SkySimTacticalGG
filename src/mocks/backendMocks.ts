// Mock data matching the Python FastAPI backend schema
import type {
  MatchMetadata,
  RoundData,
  PlayerRoundStat,
  StrategicPattern,
  PlayerMistake,
  MotionSequence,
  MicroMacroConnection,
  TeamPattern,
  CoachingInsight,
  ActionItem,
  DevelopmentPlan,
  ComprehensiveAnalysisResponse,
  MicroAnalysis,
  MacroAnalysis,
  HealthCheck,
  APIInfo,
  MacroReview,
  MacroReviewEvent,
} from '@/types/backend';
import { mockPlayers } from '@/data/mockData';

// ============= Mock GRID Match Data =============

export const mockMatchMetadata: MatchMetadata[] = [
  {
    id: 'grid_match_001',
    game: 'valorant',
    tournament: 'VCT Americas 2024',
    map_name: 'Bind',
    start_time: new Date(Date.now() - 3600000).toISOString(),
    end_time: new Date().toISOString(),
    team_a_id: 't1',
    team_b_id: 't2',
    status: 'completed',
  },
  {
    id: 'grid_match_002',
    game: 'valorant',
    tournament: 'VCT Americas 2024',
    map_name: 'Haven',
    start_time: new Date().toISOString(),
    team_a_id: 't1',
    team_b_id: 't3',
    status: 'live',
  },
];

export const mockRoundData: RoundData[] = Array.from({ length: 24 }, (_, i) => ({
  id: `round_${i + 1}`,
  match_id: 'grid_match_001',
  round_number: i + 1,
  winning_team_id: Math.random() > 0.45 ? 't1' : 't2',
  round_type: i < 2 ? 'pistol' : ['eco', 'force', 'full', 'full', 'full'][Math.floor(Math.random() * 5)] as RoundData['round_type'],
  duration_seconds: 45 + Math.random() * 75,
  team_a_start_money: i < 2 ? 800 : 2000 + Math.floor(Math.random() * 7000),
  team_b_start_money: i < 2 ? 800 : 2000 + Math.floor(Math.random() * 7000),
  bomb_site: ['A', 'B'][Math.floor(Math.random() * 2)] as 'A' | 'B',
  round_phase_stats: {
    execute_time: 30 + Math.random() * 40,
    post_plant_time: Math.random() > 0.5 ? 10 + Math.random() * 20 : undefined,
  },
}));

export const mockPlayerRoundStats: PlayerRoundStat[] = mockPlayers.flatMap(player =>
  mockRoundData.map(round => ({
    id: `prs_${round.id}_${player.id}`,
    round_id: round.id,
    player_id: player.id,
    team_id: player.team_id,
    positioning_score: 0.5 + Math.random() * 0.5,
    crosshair_placement_score: 0.4 + Math.random() * 0.6,
    utility_efficiency: 0.3 + Math.random() * 0.7,
    trade_deaths: Math.floor(Math.random() * 3),
    clutchness_score: 0.2 + Math.random() * 0.8,
    position_heatmap: {
      x: Array.from({ length: 20 }, () => Math.random()),
      y: Array.from({ length: 20 }, () => Math.random()),
    },
    death_location: Math.random() > 0.7 ? { x: Math.random(), y: Math.random() } : undefined,
    motion_sequence_id: Math.random() > 0.8 ? `motion_${Math.floor(Math.random() * 100)}` : undefined,
  }))
);

// ============= Mock Strategic Patterns =============

export const mockStrategicPatterns: StrategicPattern[] = [
  {
    id: 'pattern_001',
    team_id: 't1',
    map_name: 'Bind',
    side: 'attack',
    pattern_type: 'execute',
    success_rate: 0.68,
    avg_execution_time: 42.5,
    common_mistakes: ['Early rotation read', 'Utility timing off', 'Entry fragger isolated'],
    key_player_actions: {
      entry: 'smoke_push',
      support: 'flash_assist',
      controller: 'site_smoke',
      sentinel: 'flank_watch',
    },
    win_conditions: ['Trade the entry kill', 'Plant within 5 seconds of execute', 'Maintain post-plant crossfires'],
  },
  {
    id: 'pattern_002',
    team_id: 't1',
    map_name: 'Bind',
    side: 'defense',
    pattern_type: 'retake',
    success_rate: 0.54,
    avg_execution_time: 18.2,
    common_mistakes: ['Staggered retake timing', 'Utility overlap', 'No info gathered'],
    key_player_actions: {
      anchor: 'delay_plant',
      rotator: 'fast_rotate',
      controller: 'post_plant_smoke',
      duelist: 'entry_retake',
    },
    win_conditions: ['Coordinate utility usage', 'Clear corners systematically', 'Trade kills effectively'],
  },
  {
    id: 'pattern_003',
    team_id: 't1',
    map_name: 'Haven',
    side: 'attack',
    pattern_type: 'default',
    success_rate: 0.72,
    avg_execution_time: 55.8,
    common_mistakes: ['Predictable default', 'Lack of map control', 'Late rotations'],
    key_player_actions: {
      igl: 'call_reads',
      initiator: 'info_gather',
      duelist: 'space_creation',
    },
    win_conditions: ['Maintain tempo control', 'React to opponent utility', 'Execute off of info'],
  },
];

// ============= Mock Player Mistakes =============

export const mockPlayerMistakes: PlayerMistake[] = [
  {
    id: 'mistake_001',
    player_id: 'p1',
    player_name: 'OXY',
    match_id: 'grid_match_001',
    mistake_type: 'positioning',
    severity: 0.75,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    round_number: 8,
    game_state: {
      player_count_alive: 4,
      time_remaining: 45,
      economy_state: 'full_buy',
    },
    expected_action: 'Hold angle with cover from box',
    actual_action: 'Overextended into open without utility',
    round_impact: 0.35,
    match_impact: 0.08,
    correction_suggestion: 'Use flash before peeking or wait for teammate trade position',
    motion_sequence_id: 'motion_mistake_001',
    corrected_motion_id: 'motion_correct_001',
  },
  {
    id: 'mistake_002',
    player_id: 'p4',
    player_name: 'SMOKE',
    match_id: 'grid_match_001',
    mistake_type: 'utility',
    severity: 0.6,
    timestamp: new Date(Date.now() - 1500000).toISOString(),
    round_number: 12,
    game_state: {
      player_count_alive: 5,
      time_remaining: 70,
      economy_state: 'full_buy',
    },
    expected_action: 'Save smoke for post-plant or retake denial',
    actual_action: 'Used all smokes during initial execute',
    round_impact: 0.28,
    match_impact: 0.05,
    correction_suggestion: 'Reserve at least one smoke for post-plant situations',
    motion_sequence_id: 'motion_mistake_002',
  },
  {
    id: 'mistake_003',
    player_id: 'p2',
    player_name: 'NOVA',
    match_id: 'grid_match_001',
    mistake_type: 'timing',
    severity: 0.85,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    round_number: 15,
    game_state: {
      player_count_alive: 3,
      time_remaining: 25,
      economy_state: 'force_buy',
    },
    expected_action: 'Wait for teammate to set up crossfire',
    actual_action: 'Pushed alone without communication',
    round_impact: 0.52,
    match_impact: 0.12,
    correction_suggestion: 'Communicate push timing with team, wait for flash assist',
  },
];

// ============= Mock Motion Sequences =============

export const mockMotionSequences: MotionSequence[] = [
  {
    id: 'motion_mistake_001',
    prompt_used: 'A professional esports player (Jett) overextending into an open area without utility support, getting caught in a crossfire',
    motion_data: {
      smpl_params: Array.from({ length: 72 }, () => Math.random()),
      joint_positions: Array.from({ length: 150 }, () => Array.from({ length: 22 }, () => Math.random())),
    },
    duration_frames: 150,
    fps: 30,
    action_type: 'peek',
    player_role: 'entry',
    quality_score: 0.92,
  },
  {
    id: 'motion_correct_001',
    prompt_used: 'A professional esports player (Jett) properly checking angles with flash support before aggressive peek',
    motion_data: {
      smpl_params: Array.from({ length: 72 }, () => Math.random()),
      joint_positions: Array.from({ length: 180 }, () => Array.from({ length: 22 }, () => Math.random())),
    },
    duration_frames: 180,
    fps: 30,
    action_type: 'peek',
    player_role: 'entry',
    quality_score: 0.95,
  },
];

// ============= Mock Micro-Macro Connections =============

export const mockMicroMacroConnection: MicroMacroConnection = {
  player_id: 'p1',
  timeframe_minutes: 10,
  total_mistakes: 3,
  strategy_impacts: [
    {
      mistake_type: 'positioning',
      round_number: 8,
      impact_score: 0.72,
      strategy_broken: 'A-site split execute',
      win_probability_swing: -0.18,
      corrective_action: 'Practice angle holding with utility support before aggressive peeks',
      motion_visualization_id: 'motion_mistake_001',
    },
    {
      mistake_type: 'timing',
      round_number: 15,
      impact_score: 0.85,
      strategy_broken: 'Coordinated retake',
      win_probability_swing: -0.25,
      corrective_action: 'Improve communication timing with IGL calls',
    },
  ],
};

// ============= Mock Team Patterns =============

export const mockTeamPattern: TeamPattern = {
  team_id: 't1',
  total_patterns_identified: 12,
  patterns: [
    {
      pattern_type: 'A-site fast execute',
      success_rate: 0.68,
      frequency: 15,
      key_players: ['OXY', 'NOVA'],
      typical_execution_time: 8.5,
      counter_strategies: ['Stack A site', 'Early aggression', 'Utility denial'],
    },
    {
      pattern_type: 'Default with late hit',
      success_rate: 0.72,
      frequency: 22,
      key_players: ['CHIEF', 'SMOKE'],
      typical_execution_time: 55.2,
      counter_strategies: ['Aggressive info plays', 'Early rotations', 'Lurk denial'],
    },
    {
      pattern_type: 'B-site split',
      success_rate: 0.58,
      frequency: 10,
      key_players: ['NOVA', 'SAGE'],
      typical_execution_time: 12.8,
      counter_strategies: ['Heavy B stack', 'Fast rotate', 'Utility spam'],
    },
  ],
  pattern_strengths: {
    'fast_execute': 0.75,
    'default': 0.82,
    'retake': 0.54,
    'eco_round': 0.45,
  },
  recommended_strategies: [
    'Increase B-site split success by adding flash support',
    'Practice eco round anti-eco setups',
    'Improve retake coordination timing',
  ],
};

// ============= Mock Coaching Insights =============

export const mockCoachingInsights: CoachingInsight[] = [
  {
    id: 'insight_001',
    title: 'Entry Fragger Positioning Breakdown',
    description: 'OXY is overextending without utility backup in 40% of aggressive peeks, leading to untraded deaths that break execute timings.',
    type: 'connection',
    priority: 'high',
    evidence: [
      'Round 8: Death in A-short without flash',
      'Round 15: Isolated push on B-main',
      'Pattern detected in 6 of last 10 matches',
    ],
    impact_score: 0.85,
    recommendations: [
      'Coordinate flash timing with NOVA before aggressive peeks',
      'Practice trade positioning with SAGE',
      'Review VODs of top-tier entry fraggers',
    ],
    metadata: {
      mistake_type: 'positioning',
      player_ids: ['p1'],
      rounds_affected: [8, 12, 15, 18],
    },
  },
  {
    id: 'insight_002',
    title: 'Controller Utility Economy',
    description: 'SMOKE is exhausting all utility pre-plant, leaving no resources for post-plant denial which reduces clutch potential by 35%.',
    type: 'micro',
    priority: 'high',
    evidence: [
      'Avg smokes used pre-plant: 2.8/3',
      'Post-plant smoke denial: only 15% of plants',
      'Lost 4 post-plant situations due to no utility',
    ],
    impact_score: 0.72,
    recommendations: [
      'Reserve minimum 1 smoke for post-plant',
      'Practice one-smoke executes',
      'Coordinate with CHIEF for smoke timing calls',
    ],
    metadata: {
      mistake_type: 'utility',
      player_ids: ['p4'],
    },
  },
  {
    id: 'insight_003',
    title: 'Retake Coordination Failing',
    description: 'Team retake success rate is 54% vs league average of 62%. Staggered timing and utility overlap are key issues.',
    type: 'macro',
    priority: 'medium',
    evidence: [
      'Avg time between first and last retake player: 4.2s (should be <2s)',
      'Utility overlap in 35% of retakes',
      'No info gathered in 40% of retakes',
    ],
    impact_score: 0.68,
    recommendations: [
      'Establish clear retake call structure',
      'Assign utility roles for retakes',
      'Practice synchronized retake drills',
    ],
  },
];

// ============= Mock Action Items =============

export const mockActionItems: ActionItem[] = [
  {
    insight_id: 'insight_001',
    title: 'Entry Fragger Positioning Breakdown',
    drills: [
      {
        name: 'Flash-Peek Coordination Drill',
        description: 'Practice coordinated flash-peek timings with support player',
        duration: '20 minutes',
        focus: 'Timing and communication',
        setup: '2v2 custom with specific peek scenarios',
      },
      {
        name: 'Trade Position Workshop',
        description: 'Establish optimal trade positions for common map areas',
        duration: '30 minutes',
        focus: 'Positioning and awareness',
        setup: 'Custom map walkthrough with coach',
      },
    ],
    strategy_changes: [
      'Add mandatory flash call before aggressive peeks',
      'Assign dedicated trade partner for each map',
    ],
    player_feedback: [
      {
        player_id: 'p1',
        player_name: 'OXY',
        feedback: 'Excellent mechanical skill but overconfidence leading to untraded deaths. Focus on team coordination.',
        priority: 'high',
      },
    ],
    estimated_impact: 0.85,
    implementation_time: '1 week',
  },
  {
    insight_id: 'insight_002',
    title: 'Controller Utility Economy',
    drills: [
      {
        name: 'One-Smoke Execute Practice',
        description: 'Execute site takes using only one smoke to preserve utility',
        duration: '25 minutes',
        focus: 'Utility economy',
        setup: '5v5 scrims with utility restrictions',
      },
    ],
    strategy_changes: [
      'Designate post-plant smoke responsibility',
      'Call out utility count at 30-second mark',
    ],
    player_feedback: [
      {
        player_id: 'p4',
        player_name: 'SMOKE',
        feedback: 'Great execute smokes but need to reserve utility for clutch situations.',
        priority: 'high',
      },
    ],
    estimated_impact: 0.72,
    implementation_time: '3 days',
  },
];

// ============= Mock Development Plan =============

export const mockDevelopmentPlan: DevelopmentPlan = {
  player_id: 'p1',
  timeframe_days: 30,
  generated_at: new Date().toISOString(),
  focus_areas: [
    {
      area: 'Team Coordination',
      current_level: 0.65,
      target_level: 0.85,
      priority: 'high',
      exercises: [
        'Daily flash-peek coordination with NOVA',
        'Trade position review sessions',
        'VOD review of team execute timings',
      ],
    },
    {
      area: 'Positioning Discipline',
      current_level: 0.58,
      target_level: 0.80,
      priority: 'high',
      exercises: [
        'Angle isolation practice',
        'Cover usage drills',
        'Risk assessment scenarios',
      ],
    },
    {
      area: 'Clutch Situations',
      current_level: 0.78,
      target_level: 0.85,
      priority: 'medium',
      exercises: [
        '1vX scenario practice',
        'Time management drills',
        'Economy-based decision making',
      ],
    },
  ],
  weekly_goals: [
    {
      week: 1,
      objectives: ['Reduce untraded deaths by 30%', 'Complete coordination drill 5x'],
      metrics_to_track: ['Untraded death count', 'Trade success rate'],
      expected_improvement: 0.1,
    },
    {
      week: 2,
      objectives: ['Integrate new positioning into scrims', 'Review and adjust'],
      metrics_to_track: ['First blood success rate', 'Round win rate after entry'],
      expected_improvement: 0.15,
    },
    {
      week: 3,
      objectives: ['Stress test in tournament practice', 'Identify remaining gaps'],
      metrics_to_track: ['Overall rating improvement', 'Team feedback scores'],
      expected_improvement: 0.12,
    },
    {
      week: 4,
      objectives: ['Consolidate improvements', 'Prepare for tournament'],
      metrics_to_track: ['Consistency metrics', 'Pressure performance'],
      expected_improvement: 0.08,
    },
  ],
  skill_progression: [
    {
      skill: 'Coordination',
      current: 0.65,
      projected: [0.70, 0.76, 0.82, 0.85],
      milestones: ['Basic coordination', 'Consistent timing', 'Adaptive coordination', 'Tournament ready'],
    },
    {
      skill: 'Positioning',
      current: 0.58,
      projected: [0.64, 0.72, 0.78, 0.80],
      milestones: ['Cover awareness', 'Angle discipline', 'Trade setup', 'Master level'],
    },
  ],
  recommended_vods: [
    'TenZ - Entry fragging fundamentals',
    'Aspas - Team coordination in VCT',
    'Pro team retake analysis',
  ],
};

// ============= Mock API Responses =============

export const mockMicroAnalysis: MicroAnalysis = {
  team_id: 't1',
  match_id: 'grid_match_001',
  player_performances: mockPlayers.map(p => ({
    player_id: p.id,
    player_name: p.name,
    role: p.role,
    overall_rating: 0.8 + Math.random() * 0.4,
    mechanical_score: 0.7 + Math.random() * 0.3,
    tactical_score: 0.6 + Math.random() * 0.4,
    utility_score: 0.5 + Math.random() * 0.5,
    communication_score: 0.6 + Math.random() * 0.4,
    key_moments: [
      'Clutch 1v2 in round 8',
      'Triple kill entry in round 15',
    ].slice(0, Math.floor(Math.random() * 3)),
  })),
  mistakes_detected: mockPlayerMistakes,
  standout_moments: [
    {
      player_id: 'p1',
      round_number: 18,
      description: 'OXY clutches a 1v3 with Operator to secure match point',
      impact: 'positive',
      highlight_type: 'clutch',
    },
    {
      player_id: 'p2',
      round_number: 5,
      description: 'NOVA gets a 4k entry to break the enemy economy',
      impact: 'positive',
      highlight_type: 'entry',
    },
  ],
};

export const mockMacroAnalysis: MacroAnalysis = {
  team_id: 't1',
  match_id: 'grid_match_001',
  strategy_effectiveness: {
    'fast_execute': 0.72,
    'default': 0.68,
    'split': 0.55,
    'eco_convert': 0.35,
  },
  round_type_performance: {
    'pistol': { wins: 3, losses: 1 },
    'eco': { wins: 2, losses: 4 },
    'force': { wins: 4, losses: 2 },
    'full': { wins: 7, losses: 5 },
  },
  economy_management_score: 0.78,
  adaptation_score: 0.72,
  patterns_identified: mockStrategicPatterns,
};

export const mockComprehensiveAnalysis: ComprehensiveAnalysisResponse = {
  match_id: 'grid_match_001',
  analysis_completed: new Date().toISOString(),
  micro_analysis: mockMicroAnalysis,
  macro_analysis: mockMacroAnalysis,
  micro_macro_connections: mockMicroMacroConnection,
  coaching_insights: {
    generated_at: new Date().toISOString(),
    team_id: 't1',
    match_id: 'grid_match_001',
    summary: 'Team Alpha showed strong mechanical performance but coordination issues in high-pressure situations led to preventable round losses. Focus on entry coordination and utility economy.',
    key_insights: mockCoachingInsights,
    action_items: mockActionItems,
    visualizations: [
      { type: 'heatmap', data_source: 'player_positions', config: { map: 'Bind' } },
      { type: 'timeline', data_source: 'round_events', config: { highlight_mistakes: true } },
    ],
  },
  actionable_items: mockActionItems,
};

export const mockHealthCheck: HealthCheck = {
  status: 'healthy',
  timestamp: new Date().toISOString(),
  services: {
    database: true,
    redis: true,
    kafka: true,
    ml_models: true,
  },
};

export const mockAPIInfo: APIInfo = {
  message: 'Esports Assistant Coach API',
  version: '1.0.0',
  endpoints: {
    matches: '/api/v1/matches',
    players: '/api/v1/players',
    analysis: '/api/v1/analysis',
    insights: '/api/v1/insights',
    motion: '/api/v1/motion',
    docs: '/docs',
    redoc: '/redoc',
  },
};

// ============= Mock Macro Review =============

export const mockMacroReviewEvents: MacroReviewEvent[] = [
  {
    type: 'PISTOL_ROUND_IMPACT',
    round_number: 1,
    title: 'Lost Pistol Round - Economic Collapse',
    description: 'Lost the opening pistol round, which cascaded into 4 consecutive round losses due to economic disadvantage.',
    impact_score: 0.85,
    strategic_insight: 'The pistol round loss forced 3 consecutive eco rounds, allowing the enemy to build a 4-0 lead. This early deficit required perfect economy management to recover.',
    recommendation: 'Practice pistol round anti-eco setups and consider force-buy strategies after pistol loss to prevent momentum snowball.',
    needs_visualization: true,
    visualization_type: 'economic_flow',
    round_ids: [1, 2, 3, 4, 5],
    motion_prompt: 'Show team\'s economic disadvantage positions versus enemy economic advantage positions in rounds 1-5.',
    motion_visualization: mockMotionSequences[0],
  },
  {
    type: 'CRITICAL_ECONOMIC_DECISION',
    round_number: 6,
    title: 'Costly Force Buy After Eco Loss',
    description: 'Forced after eco loss in round 5, spending $4,200 with only 28% win probability. This extended economic disadvantage by 2 additional rounds.',
    impact_score: 0.72,
    strategic_insight: 'This decision extended economic disadvantage by 2 additional rounds. The force buy failed, leaving the team with insufficient funds for a full buy until round 9.',
    recommendation: 'Consider saving in this scenario to ensure full buys for upcoming key rounds. Establish clear force-buy criteria based on win probability.',
    needs_visualization: true,
    visualization_type: 'economic_flow',
    round_ids: [5, 6, 7, 8],
    motion_prompt: 'Show team\'s expensive buy positions versus enemy economic advantage positions.',
    motion_visualization: mockMotionSequences[0],
  },
  {
    type: 'FAILED_EXECUTE',
    round_number: 12,
    title: 'A-Site Execute Breakdown',
    description: 'Failed A-site execute due to staggered entry timing. Entry fragger was isolated and killed before support could trade.',
    impact_score: 0.78,
    strategic_insight: 'The execute failed because OXY pushed 2 seconds before NOVA\'s flash was ready, resulting in an untraded death. This pattern occurred in 3 of 5 A-site executes.',
    recommendation: 'Establish clear flash-peek timing calls. Practice coordinated entry drills with 0.5-second tolerance windows.',
    needs_visualization: true,
    visualization_type: 'team_execute',
    round_ids: [12],
    motion_prompt: 'Show team\'s failed A-site execute with staggered entry timing.',
    motion_visualization: mockMotionSequences[0],
  },
  {
    type: 'MOMENTUM_SHIFT',
    round_number: 15,
    title: 'The Turning Point - Clutch Round',
    description: 'Round 15 clutch victory (1v3) by OXY shifted momentum and broke enemy economy, leading to 4 consecutive round wins.',
    impact_score: 0.88,
    strategic_insight: 'This clutch not only won the round but broke the enemy\'s economy and shifted psychological momentum. The team capitalized with aggressive plays in subsequent rounds.',
    recommendation: 'Identify clutch opportunities earlier and position players to support clutch scenarios. Practice 1vX decision-making under pressure.',
    needs_visualization: true,
    visualization_type: 'clutch',
    round_ids: [15],
    motion_prompt: 'Show OXY\'s 1v3 clutch sequence with positioning and decision-making.',
    motion_visualization: mockMotionSequences[1] || mockMotionSequences[0],
  },
  {
    type: 'MAP_CONTROL_LOSS',
    round_number: 18,
    title: 'Lost Map Control on Defense',
    description: 'Failed to maintain mid control, allowing enemy to freely rotate between sites and execute with full utility.',
    impact_score: 0.65,
    strategic_insight: 'The team lost mid control in 60% of defensive rounds, allowing the enemy to dictate the pace and execute with full utility advantage.',
    recommendation: 'Practice mid control holds and establish default positions that maintain map control. Consider utility allocation for mid control.',
    needs_visualization: true,
    visualization_type: 'map_control',
    round_ids: [18, 19, 20],
    motion_prompt: 'Show team\'s defensive positioning and enemy\'s map control advantage.',
    motion_visualization: mockMotionSequences[0],
  },
];

export const mockMacroReview: MacroReview = {
  match_id: 'grid_match_001',
  generated_at: new Date().toISOString(),
  summary: 'Team Alpha showed strong mechanical performance but coordination issues in high-pressure situations led to preventable round losses. The match was defined by early economic struggles and mid-game momentum shifts.',
  key_themes: [
    'Economic Management',
    'Entry Coordination',
    'Map Control',
    'Clutch Situations',
    'Momentum Shifts',
  ],
  review_agenda: [
    {
      phase: 'Early Game (Rounds 1-6)',
      focus: 'Establishing Momentum',
      items: mockMacroReviewEvents.filter(e => e.round_number <= 6).sort((a, b) => b.impact_score - a.impact_score),
      time_allocation: '15 minutes',
      coaching_question: 'How did our early round decisions set the tone for the match?',
    },
    {
      phase: 'Mid Game (Rounds 7-15)',
      focus: 'Economic Management & Map Control',
      items: mockMacroReviewEvents.filter(e => e.round_number > 6 && e.round_number <= 15).sort((a, b) => b.impact_score - a.impact_score),
      time_allocation: '25 minutes',
      coaching_question: 'Where did we lose/gain control of the game\'s economy and map control?',
    },
    {
      phase: 'Late Game (Rounds 16-24)',
      focus: 'Closing Out & Adaptation',
      items: mockMacroReviewEvents.filter(e => e.round_number > 15).sort((a, b) => b.impact_score - a.impact_score),
      time_allocation: '20 minutes',
      coaching_question: 'How did we adapt (or fail to adapt) to enemy strategies in the final rounds?',
    },
  ],
  action_items: mockActionItems.slice(0, 3),
};
