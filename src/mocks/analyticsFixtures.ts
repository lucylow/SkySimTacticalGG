// src/mocks/analyticsFixtures.ts - Precomputed metrics for dashboard demos

export const analyticsSnapshot = {
  daily: [
    { date: "2026-01-01", visitors: 1200, conversions: 22, avgOrderValue: 72.12 },
    { date: "2026-01-02", visitors: 980, conversions: 18, avgOrderValue: 64.33 },
    { date: "2026-01-03", visitors: 1410, conversions: 28, avgOrderValue: 82.44 },
    { date: "2026-01-04", visitors: 1150, conversions: 25, avgOrderValue: 76.89 },
    { date: "2026-01-05", visitors: 1320, conversions: 31, avgOrderValue: 91.23 },
    { date: "2026-01-06", visitors: 1480, conversions: 35, avgOrderValue: 88.45 },
    { date: "2026-01-07", visitors: 1560, conversions: 42, avgOrderValue: 95.67 },
    { date: "2026-01-08", visitors: 1380, conversions: 38, avgOrderValue: 84.12 },
    { date: "2026-01-09", visitors: 1290, conversions: 29, avgOrderValue: 78.34 },
    { date: "2026-01-10", visitors: 1440, conversions: 36, avgOrderValue: 86.78 },
    { date: "2026-01-11", visitors: 1520, conversions: 41, avgOrderValue: 92.45 },
    { date: "2026-01-12", visitors: 1680, conversions: 48, avgOrderValue: 98.23 },
  ],
  funnel: {
    visited: 12000,
    productViewed: 6200,
    addToCart: 1020,
    checkout: 410,
    purchase: 365,
  },
  retentionCohorts: [
    { cohort: "2025-12-01", day1: 0.28, day7: 0.12, day30: 0.06 },
    { cohort: "2025-12-08", day1: 0.31, day7: 0.14, day30: 0.07 },
    { cohort: "2025-12-15", day1: 0.29, day7: 0.13, day30: 0.065 },
    { cohort: "2025-12-22", day1: 0.33, day7: 0.16, day30: 0.08 },
    { cohort: "2025-12-29", day1: 0.35, day7: 0.18, day30: null },
    { cohort: "2026-01-05", day1: 0.37, day7: null, day30: null },
  ],
  topCategories: [
    { name: "Electronics", revenue: 45230, orders: 312, avgValue: 145.00 },
    { name: "Home", revenue: 32100, orders: 428, avgValue: 75.00 },
    { name: "Gaming", revenue: 28450, orders: 189, avgValue: 150.53 },
    { name: "Accessories", revenue: 18900, orders: 567, avgValue: 33.33 },
    { name: "Outdoor", revenue: 15200, orders: 145, avgValue: 104.83 },
  ],
};

export const performanceMetrics = {
  team: {
    winRate: 58.3,
    avgKD: 1.23,
    clutchRate: 42.1,
    firstBloodRate: 51.2,
    roundsPlayed: 1247,
    matchesPlayed: 89,
    currentStreak: 3,
    streakType: "win" as const,
  },
  players: [
    { id: "p1", name: "StarPlayer", role: "Entry", kd: 1.45, adr: 156.2, hs: 42.1, rating: 1.28 },
    { id: "p2", name: "SupportKing", role: "Support", kd: 1.12, adr: 128.4, hs: 38.5, rating: 1.15 },
    { id: "p3", name: "AWPer", role: "Sniper", kd: 1.38, adr: 142.7, hs: 28.3, rating: 1.22 },
    { id: "p4", name: "Lurker", role: "Lurk", kd: 1.21, adr: 134.1, hs: 44.2, rating: 1.18 },
    { id: "p5", name: "IGL", role: "Leader", kd: 0.98, adr: 118.9, hs: 35.8, rating: 1.05 },
  ],
  mapPool: [
    { map: "Ascent", winRate: 72.4, played: 29 },
    { map: "Bind", winRate: 61.2, played: 18 },
    { map: "Haven", winRate: 54.8, played: 21 },
    { map: "Split", winRate: 48.3, played: 12 },
    { map: "Icebox", winRate: 44.1, played: 9 },
  ],
  trends: {
    weekly: [
      { week: "W1", winRate: 52, avgKD: 1.18 },
      { week: "W2", winRate: 55, avgKD: 1.20 },
      { week: "W3", winRate: 58, avgKD: 1.22 },
      { week: "W4", winRate: 61, avgKD: 1.25 },
    ],
  },
};

export const agentUsageMetrics = {
  totalSessions: 1247,
  avgSessionDuration: 4.2, // minutes
  tokensGenerated: 892340,
  toolCalls: 3891,
  successRate: 97.3,
  topTools: [
    { name: "analyze_catalog", calls: 1245, avgLatency: 0.8 },
    { name: "search_database", calls: 1102, avgLatency: 0.4 },
    { name: "calculate_metrics", calls: 892, avgLatency: 0.2 },
    { name: "generate_report", calls: 412, avgLatency: 1.2 },
    { name: "compare_players", calls: 240, avgLatency: 0.6 },
  ],
  dailyUsage: [
    { date: "2026-01-06", sessions: 145, tokens: 98234 },
    { date: "2026-01-07", sessions: 167, tokens: 112456 },
    { date: "2026-01-08", sessions: 152, tokens: 104321 },
    { date: "2026-01-09", sessions: 189, tokens: 134567 },
    { date: "2026-01-10", sessions: 201, tokens: 145678 },
    { date: "2026-01-11", sessions: 178, tokens: 123456 },
    { date: "2026-01-12", sessions: 215, tokens: 156789 },
  ],
};
