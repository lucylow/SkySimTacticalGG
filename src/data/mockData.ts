// Comprehensive Mock Data for Esports Assistant Coach
import type { Player, Match, Team, Round, Insight, DashboardData, MotionData } from '@/types';

// Player Avatars (placeholder gradients)
const avatarColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'] as const;

export const mockPlayers: Player[] = [
  { 
    id: 'p1', 
    name: 'OXY', 
    team_id: 't1', 
    role: 'duelist',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=OXY&backgroundColor=${avatarColors[0].slice(1)}`,
    stats: { kd_ratio: 1.32, adr: 165.4, hs_percentage: 28, first_bloods: 45, clutches_won: 12, kast: 78 }
  },
  { 
    id: 'p2', 
    name: 'NOVA', 
    team_id: 't1', 
    role: 'initiator',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=NOVA&backgroundColor=${avatarColors[1].slice(1)}`,
    stats: { kd_ratio: 1.15, adr: 142.8, hs_percentage: 24, first_bloods: 22, clutches_won: 8, kast: 82 }
  },
  { 
    id: 'p3', 
    name: 'SAGE', 
    team_id: 't1', 
    role: 'sentinel',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=SAGE&backgroundColor=${avatarColors[2].slice(1)}`,
    stats: { kd_ratio: 0.98, adr: 128.2, hs_percentage: 22, first_bloods: 15, clutches_won: 10, kast: 85 }
  },
  { 
    id: 'p4', 
    name: 'SMOKE', 
    team_id: 't1', 
    role: 'controller',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=SMOKE&backgroundColor=${avatarColors[3].slice(1)}`,
    stats: { kd_ratio: 1.05, adr: 135.6, hs_percentage: 26, first_bloods: 18, clutches_won: 6, kast: 80 }
  },
  { 
    id: 'p5', 
    name: 'CHIEF', 
    team_id: 't1', 
    role: 'igl',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=CHIEF&backgroundColor=${avatarColors[4].slice(1)}`,
    stats: { kd_ratio: 0.92, adr: 118.9, hs_percentage: 20, first_bloods: 12, clutches_won: 9, kast: 76 }
  },
];

export const mockTeams: Team[] = [
  { id: 't1', name: 'Team Alpha', logo: '🔷', players: mockPlayers },
  { id: 't2', name: 'Team Beta', logo: '🔶', players: [] },
  { id: 't3', name: 'Team Gamma', logo: '🟢', players: [] },
  { id: 't4', name: 'Team Delta', logo: '🔴', players: [] },
  { id: 't5', name: 'Team Epsilon', logo: '🟣', players: [] },
];

const generateRounds = (count: number, teamAWins: number): Round[] => {
  const rounds: Round[] = [];
  let teamACurrentWins = 0;
  
  for (let i = 1; i <= count; i++) {
    const isTeamAWin = teamACurrentWins < teamAWins && (Math.random() > 0.4 || count - i < teamAWins - teamACurrentWins);
    if (isTeamAWin) teamACurrentWins++;
    
    const randomPlayer = mockPlayers[Math.floor(Math.random() * 5)];
    const randomPlayerForMistake = mockPlayers[Math.floor(Math.random() * 5)];
    
    rounds.push({
      round_number: i,
      winner: isTeamAWin ? 'Team Alpha' : 'Enemy',
      win_type: ['elimination', 'defuse', 'time', 'plant'][Math.floor(Math.random() * 4)] as Round['win_type'],
      events: [
        {
          timestamp: Math.random() * 100,
          type: 'kill',
          player_id: randomPlayer?.id ?? 'p1',
          target_id: 'enemy_1',
          weapon: ['Vandal', 'Phantom', 'Operator', 'Sheriff'][Math.floor(Math.random() * 4)],
          description: 'First blood secured'
        }
      ],
      mistakes: Math.random() > 0.7 ? [{
        id: `m_${i}`,
        player_id: randomPlayerForMistake?.id ?? 'p1',
        player_name: randomPlayerForMistake?.name ?? 'Player',
        type: ['positioning', 'utility', 'timing', 'rotation'][Math.floor(Math.random() * 4)] ?? 'positioning',
        severity: Math.floor(Math.random() * 3) + 1,
        description: 'Overextended without utility backup',
        recommendation: 'Wait for teammates before pushing'
      }] : undefined
    });
  }
  
  return rounds;
};

export const mockMatches: Match[] = [
  {
    id: 'match_001',
    team_a: mockTeams[0]!,
    team_b: mockTeams[1]!,
    map: 'Bind',
    score: [13, 9],
    duration: 42,
    winner: 'Team Alpha',
    rounds: generateRounds(22, 13),
    created_at: new Date().toISOString(),
  },
  {
    id: 'match_002',
    team_a: mockTeams[0]!,
    team_b: mockTeams[2]!,
    map: 'Haven',
    score: [11, 13],
    duration: 48,
    winner: 'Team Gamma',
    rounds: generateRounds(24, 11),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'match_003',
    team_a: mockTeams[0]!,
    team_b: mockTeams[3]!,
    map: 'Ascent',
    score: [13, 7],
    duration: 35,
    winner: 'Team Alpha',
    rounds: generateRounds(20, 13),
    created_at: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'match_004',
    team_a: mockTeams[0]!,
    team_b: mockTeams[4]!,
    map: 'Split',
    score: [9, 13],
    duration: 44,
    winner: 'Team Epsilon',
    rounds: generateRounds(22, 9),
    created_at: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'match_005',
    team_a: mockTeams[0]!,
    team_b: mockTeams[1]!,
    map: 'Icebox',
    score: [13, 11],
    duration: 50,
    winner: 'Team Alpha',
    rounds: generateRounds(24, 13),
    created_at: new Date(Date.now() - 345600000).toISOString(),
  },
  {
    id: 'match_006',
    team_a: mockTeams[0]!,
    team_b: mockTeams[2]!,
    map: 'Breeze',
    score: [13, 5],
    duration: 28,
    winner: 'Team Alpha',
    rounds: generateRounds(18, 13),
    created_at: new Date(Date.now() - 432000000).toISOString(),
  },
];

export const mockInsights: Insight[] = [
  {
    id: 'i1',
    type: 'warning',
    title: 'Eco Round Win Rate Low',
    description: 'Team wins only 23% of eco rounds. Consider adjusting eco strategies or forcing more.',
    priority: 'high',
    created_at: new Date().toISOString(),
    actionable: true,
  },
  {
    id: 'i2',
    type: 'improvement',
    title: 'A-Site Executes Improving',
    description: 'A-site execute success rate increased by 15% this week. Keep refining the split push timing.',
    priority: 'medium',
    created_at: new Date().toISOString(),
    actionable: false,
  },
  {
    id: 'i3',
    type: 'success',
    title: 'Player OXY: Clutch King',
    description: 'OXY has won 78% of 1v1 clutches this month. Consider giving them last-alive scenarios.',
    player_id: 'p1',
    priority: 'low',
    created_at: new Date().toISOString(),
    actionable: false,
  },
  {
    id: 'i4',
    type: 'warning',
    title: 'SMOKE Utility Usage Declining',
    description: 'Controller utility effectiveness dropped 12%. Review smoke lineups on Ascent.',
    player_id: 'p4',
    priority: 'high',
    created_at: new Date().toISOString(),
    actionable: true,
  },
  {
    id: 'i5',
    type: 'info',
    title: 'Split Map Pool Weakness',
    description: 'Team has 38% win rate on Split. Consider banning or dedicating practice time.',
    priority: 'medium',
    created_at: new Date().toISOString(),
    actionable: true,
  },
  {
    id: 'i6',
    type: 'success',
    title: 'First Blood Rate Up 8%',
    description: 'NOVA and OXY coordinated aggression is paying off. First blood secured in 62% of rounds.',
    priority: 'low',
    created_at: new Date().toISOString(),
    actionable: false,
  },
];

export const mockDashboardData: DashboardData = {
  live_matches: [],
  recent_matches: mockMatches.slice(0, 3),
  team_stats: {
    win_rate: 67,
    avg_round_time: 85,
    map_performance: [
      { map: 'Bind', wins: 12, losses: 3 },
      { map: 'Haven', wins: 8, losses: 5 },
      { map: 'Split', wins: 5, losses: 8 },
      { map: 'Ascent', wins: 10, losses: 4 },
      { map: 'Icebox', wins: 7, losses: 6 },
      { map: 'Breeze', wins: 9, losses: 4 },
    ],
  },
  insights: mockInsights,
  role_distribution: [
    { name: 'Duelist', value: 25 },
    { name: 'Initiator', value: 20 },
    { name: 'Controller', value: 20 },
    { name: 'Sentinel', value: 20 },
    { name: 'IGL', value: 15 },
  ],
  last_update: new Date().toISOString(),
};

// Performance trends for charts
export const mockPerformanceTrends = {
  weekly: [
    { date: 'Mon', wins: 3, losses: 1, winRate: 75 },
    { date: 'Tue', wins: 2, losses: 2, winRate: 50 },
    { date: 'Wed', wins: 4, losses: 0, winRate: 100 },
    { date: 'Thu', wins: 2, losses: 1, winRate: 67 },
    { date: 'Fri', wins: 3, losses: 2, winRate: 60 },
    { date: 'Sat', wins: 5, losses: 1, winRate: 83 },
    { date: 'Sun', wins: 2, losses: 2, winRate: 50 },
  ],
  monthly: [
    { week: 'Week 1', wins: 12, losses: 5, winRate: 71 },
    { week: 'Week 2', wins: 10, losses: 8, winRate: 56 },
    { week: 'Week 3', wins: 15, losses: 4, winRate: 79 },
    { week: 'Week 4', wins: 11, losses: 6, winRate: 65 },
  ],
};

// Player performance over time
export const mockPlayerTrends = mockPlayers.map(player => ({
  player,
  trends: Array.from({ length: 10 }, (_, i) => ({
    match: i + 1,
    kd: +(player.stats.kd_ratio + (Math.random() - 0.5) * 0.4).toFixed(2),
    adr: +(player.stats.adr + (Math.random() - 0.5) * 30).toFixed(1),
    rating: +(1.0 + Math.random() * 0.5).toFixed(2),
  }))
}));

// Live coaching suggestions
export const mockCoachingSuggestions = [
  {
    id: 'cs1',
    type: 'tactical',
    priority: 'high',
    title: 'Rotate Earlier on B',
    description: 'Enemy tends to hit B site late. Start rotating at 45 seconds.',
    timestamp: Date.now() - 30000,
  },
  {
    id: 'cs2',
    type: 'economy',
    priority: 'medium',
    title: 'Force Buy Recommended',
    description: 'Enemy on eco, force with Spectre to maintain pressure.',
    timestamp: Date.now() - 60000,
  },
  {
    id: 'cs3',
    type: 'utility',
    priority: 'low',
    title: 'Save Smokes for Post-Plant',
    description: 'SMOKE used all utility pre-plant. Save one for defuse denial.',
    timestamp: Date.now() - 90000,
  },
];

// Motion capture mock data
export const mockMotionData: MotionData = {
  id: 'motion_001',
  fps: 60,
  duration: 5.0,
  frames: Array.from({ length: 300 }, (_, i) => ({
    timestamp: i / 60,
    joints: [
      { name: 'head', position: [0, 1.7 + Math.sin(i / 30) * 0.02, 0], rotation: [0, 0, 0, 1] },
      { name: 'spine', position: [0, 1.2, 0], rotation: [0, 0, 0, 1] },
      { name: 'rightHand', position: [0.3 + Math.sin(i / 15) * 0.1, 1.0, 0.3], rotation: [0, 0, 0, 1] },
      { name: 'leftHand', position: [-0.2, 1.0, 0.2], rotation: [0, 0, 0, 1] },
      { name: 'rightFoot', position: [0.15, 0, 0.1 + (i % 60 < 30 ? 0.2 : 0)], rotation: [0, 0, 0, 1] },
      { name: 'leftFoot', position: [-0.15, 0, 0.1 + (i % 60 >= 30 ? 0.2 : 0)], rotation: [0, 0, 0, 1] },
    ],
  })),
  skeleton: [
    { name: 'root', parent: -1 },
    { name: 'spine', parent: 0 },
    { name: 'head', parent: 1 },
    { name: 'rightArm', parent: 1 },
    { name: 'leftArm', parent: 1 },
    { name: 'rightLeg', parent: 0 },
    { name: 'leftLeg', parent: 0 },
  ],
};
