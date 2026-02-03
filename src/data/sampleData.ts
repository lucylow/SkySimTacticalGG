// Comprehensive Sample Data for SkySim Tactical GG
import type { Player, Match, Team, Round, Insight, DashboardData, MotionData } from '@/types';
import type { LoLPlayer, ValorantPlayer, EsportsTeam, EsportsMatch } from '@/types/esports';

// Player Avatars (placeholder gradients)
const avatarColors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'] as const;

// --- VALORANT DATA ---
export const SampleValorantPlayers: ValorantPlayer[] = [
  { 
    id: 'vp1', 
    name: 'OXY', 
    team_id: 'vt1', 
    role: 'duelist',
    game: 'valorant',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=OXY&backgroundColor=${avatarColors[0].slice(1)}`,
    stats: { 
      kd_ratio: 1.32, adr: 165.4, hs_percentage: 28, first_bloods: 45, clutches_won: 12, kast: 78, win_rate: 65,
      agent_pool: [{ agent: 'Jett', games: 20, win_rate: 70, kd: 1.4 }, { agent: 'Raze', games: 15, win_rate: 60, kd: 1.2 }]
    }
  },
  { 
    id: 'vp2', 
    name: 'NOVA', 
    team_id: 'vt1', 
    role: 'initiator',
    game: 'valorant',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=NOVA&backgroundColor=${avatarColors[1].slice(1)}`,
    stats: { 
      kd_ratio: 1.15, adr: 142.8, hs_percentage: 24, first_bloods: 22, clutches_won: 8, kast: 82, win_rate: 58,
      agent_pool: [{ agent: 'Sova', games: 25, win_rate: 60, kd: 1.1 }, { agent: 'Skye', games: 10, win_rate: 50, kd: 1.0 }]
    }
  }
];

// --- LEAGUE OF LEGENDS DATA ---
export const SampleLoLPlayers: LoLPlayer[] = [
  {
    id: 'lp1',
    name: 'Faker',
    team_id: 'lt1',
    role: 'MID',
    game: 'lol',
    region: 'KR',
    puuid: 'faker-puuid-123',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Faker&backgroundColor=${avatarColors[0].slice(1)}`,
    stats: {
      kills: 4.5, deaths: 2.1, assists: 6.8, kda: 5.38,
      cs_at_10: 95, cs_at_15: 150, gold_at_10: 3800, gold_at_15: 6200,
      vision_score: 25, win_rate: 72,
      champion_pool: [
        { champion: 'Azir', games: 45, win_rate: 75, kda: 6.2 },
        { champion: 'Orianna', games: 38, win_rate: 68, kda: 5.1 }
      ]
    }
  },
  {
    id: 'lp2',
    name: 'Gumayusi',
    team_id: 'lt1',
    role: 'ADC',
    game: 'lol',
    region: 'KR',
    avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=Gumayusi&backgroundColor=${avatarColors[1].slice(1)}`,
    stats: {
      kills: 5.2, deaths: 1.8, assists: 5.5, kda: 5.94,
      cs_at_10: 102, cs_at_15: 165, gold_at_10: 4100, gold_at_15: 6800,
      vision_score: 18, win_rate: 70,
      champion_pool: [
        { champion: 'Varus', games: 30, win_rate: 80, kda: 7.1 },
        { champion: 'Lucian', games: 25, win_rate: 64, kda: 4.8 }
      ]
    }
  }
];

export const SampleLoLTeams: EsportsTeam[] = [
  { id: 'lt1', name: 'T1', logo: '🔴', game: 'lol', players: SampleLoLPlayers },
  { id: 'lt2', name: 'Gen.G', logo: '🟡', game: 'lol', players: [] }
];

export const SampleLoLMatches: EsportsMatch[] = [
  {
    id: 'lm1',
    game: 'lol',
    team_a: SampleLoLTeams[0]!,
    team_b: SampleLoLTeams[1]!,
    score: [2, 1],
    winner: 'T1',
    patch: '14.2',
    created_at: new Date().toISOString()
  }
];

// Keeping existing Sample data for backward compatibility
export const SamplePlayers: Player[] = SampleValorantPlayers.map(p => ({
  id: p.id,
  name: p.name,
  team_id: p.team_id,
  role: p.role as Player['role'],
  avatar: p.avatar,
  stats: {
    kd_ratio: p.stats.kd_ratio,
    adr: p.stats.adr,
    hs_percentage: p.stats.hs_percentage,
    first_bloods: p.stats.first_bloods,
    clutches_won: p.stats.clutches_won,
    kast: p.stats.kast
  }
}));

export const SampleTeams: Team[] = [
  { id: 't1', name: 'Team Alpha', logo: '🔷', players: SamplePlayers },
  { id: 't2', name: 'Team Beta', logo: '🔶', players: [] },
];

const generateRounds = (count: number, teamAWins: number): Round[] => {
  const rounds: Round[] = [];
  let teamACurrentWins = 0;
  for (let i = 1; i <= count; i++) {
    const isTeamAWin = teamACurrentWins < teamAWins && (Math.random() > 0.4 || count - i < teamAWins - teamACurrentWins);
    if (isTeamAWin) teamACurrentWins++;
    rounds.push({
      round_number: i,
      winner: isTeamAWin ? 'Team Alpha' : 'Enemy',
      win_type: 'elimination',
      events: []
    });
  }
  return rounds;
};

export const SampleMatches: Match[] = [
  {
    id: 'match_001',
    team_a: SampleTeams[0]!,
    team_b: SampleTeams[1]!,
    map: 'Bind',
    score: [13, 9],
    duration: 42,
    winner: 'Team Alpha',
    rounds: generateRounds(22, 13),
    created_at: new Date().toISOString(),
  }
];

export const SampleInsights: Insight[] = [
  {
    id: 'i1',
    type: 'warning',
    title: 'Eco Round Win Rate Low',
    description: 'Team wins only 23% of eco rounds. Consider adjusting eco strategies or forcing more.',
    priority: 'high',
    created_at: new Date().toISOString(),
    actionable: true,
  }
];

export const SampleDashboardData: DashboardData = {
  live_matches: [],
  recent_matches: SampleMatches,
  team_stats: {
    win_rate: 67,
    avg_round_time: 85,
    map_performance: [{ map: 'Bind', wins: 12, losses: 3 }],
  },
  insights: SampleInsights,
  role_distribution: [{ name: 'Duelist', value: 25 }],
  last_update: new Date().toISOString(),
};

// Motion Data for 3D visualization
export const SampleMotionData: MotionData = {
  id: 'motion_001',
  frames: [
    { timestamp: 0, joints: [{ name: 'root', position: [0, 0, 0], rotation: [0, 0, 0, 1] }] },
    { timestamp: 1000, joints: [{ name: 'root', position: [1, 0, 0], rotation: [0, 0, 0, 1] }] },
  ],
  skeleton: [{ name: 'root', parent: -1 }],
  fps: 30,
  duration: 120,
};

// Performance Trends
export const SamplePerformanceTrends = {
  weekly: [
    { date: 'Mon', kd: 1.2, adr: 145, winRate: 60 },
    { date: 'Tue', kd: 1.35, adr: 158, winRate: 70 },
    { date: 'Wed', kd: 1.1, adr: 138, winRate: 50 },
    { date: 'Thu', kd: 1.4, adr: 162, winRate: 75 },
    { date: 'Fri', kd: 1.25, adr: 150, winRate: 65 },
    { date: 'Sat', kd: 1.5, adr: 170, winRate: 80 },
    { date: 'Sun', kd: 1.3, adr: 155, winRate: 68 },
  ],
  monthly: [
    { date: 'Week 1', kd: 1.2, adr: 145, winRate: 58 },
    { date: 'Week 2', kd: 1.3, adr: 152, winRate: 65 },
    { date: 'Week 3', kd: 1.35, adr: 158, winRate: 70 },
    { date: 'Week 4', kd: 1.4, adr: 165, winRate: 72 },
  ],
};

// Coaching Suggestions for Live Coach
export const SampleCoachingSuggestions = [
  {
    id: 'cs1',
    type: 'tactical',
    priority: 'high',
    title: 'Adjust A-Site Execute Timing',
    description: 'Enemy team is stacking A early. Delay execute by 15 seconds to catch rotations.',
    confidence: 0.85,
  },
  {
    id: 'cs2',
    type: 'economy',
    priority: 'medium',
    title: 'Force Buy Opportunity',
    description: 'Enemy team is on eco. Consider aggressive positioning to capitalize.',
    confidence: 0.78,
  },
  {
    id: 'cs3',
    type: 'positioning',
    priority: 'low',
    title: 'Rotate Faster on B Retakes',
    description: 'Team is arriving 3-5 seconds late on B retakes. Pre-position closer to site.',
    confidence: 0.72,
  },
];

