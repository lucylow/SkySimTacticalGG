import type { DashboardData, Match, Player, MotionData, Insight } from '@/types';
import type { UtilityDecision } from '@/types/utility';
import type { LoLPlayer, ValorantPlayer, EsportsTeam, EsportsMatch } from '@/types/esports';
import { 
  mockDashboardData, 
  mockPlayers, 
  mockMatches, 
  mockInsights,
  mockMotionData,
  mockPerformanceTrends,
  mockCoachingSuggestions,
  mockLoLPlayers,
  mockValorantPlayers,
  mockLoLTeams,
  mockLoLMatches,
} from '@/data/mockData';
import { ApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private apiClient: ApiClient;
  private useMockData: boolean;

  constructor() {
    this.useMockData = config.enableMockData;
    this.apiClient = new ApiClient({
      baseUrl: config.apiBaseUrl,
      getAuthToken: () => localStorage.getItem('auth_token'),
      onUnauthorized: () => {
        localStorage.removeItem('auth_token');
      },
    });
  }

  setToken(token: string) {
    this.apiClient.setAuthToken(token);
  }

  // Dashboard
  async fetchDashboardData(): Promise<DashboardData> {
    if (this.useMockData) {
      await delay(300); // Simulate network
      return { ...mockDashboardData, last_update: new Date().toISOString() };
    }
    await delay(300);
    return { ...mockDashboardData, last_update: new Date().toISOString() };
  }

  // Esports Specific Fetchers
  async fetchLoLPlayers(): Promise<LoLPlayer[]> {
    await delay(200);
    return mockLoLPlayers;
  }

  async fetchValorantPlayers(): Promise<ValorantPlayer[]> {
    await delay(200);
    return mockValorantPlayers;
  }

  async fetchLoLTeams(): Promise<EsportsTeam[]> {
    await delay(200);
    return mockLoLTeams;
  }

  async fetchLoLMatches(): Promise<EsportsMatch[]> {
    await delay(200);
    return mockLoLMatches;
  }

  // Match Analysis
  async fetchMatchAnalysis(matchId: string): Promise<Match | null> {
    await delay(200);
    return mockMatches.find(m => m.id === matchId) || null;
  }

  async fetchMatchList(): Promise<Match[]> {
    await delay(250);
    return mockMatches;
  }

  // Player Development
  async fetchPlayerDevelopment(playerId: string): Promise<Player | null> {
    await delay(200);
    return mockPlayers.find(p => p.id === playerId) || null;
  }

  async fetchPlayerList(): Promise<Player[]> {
    await delay(200);
    return mockPlayers;
  }

  // Insights
  async fetchInsights(): Promise<Insight[]> {
    await delay(150);
    return mockInsights;
  }

  async generateInsights(_teamId: string): Promise<Insight[]> {
    await delay(500);
    return mockInsights.filter(() => Math.random() > 0.3);
  }

  // Motion Data
  async fetchMotionData(_motionId: string): Promise<MotionData> {
    await delay(300);
    return mockMotionData;
  }

  // Performance Trends
  async fetchPerformanceTrends(period: 'weekly' | 'monthly' = 'weekly') {
    await delay(200);
    return mockPerformanceTrends[period];
  }

  // Live Coaching
  async fetchCoachingSuggestions() {
    await delay(100);
    return mockCoachingSuggestions;
  }

  // Coaching Feedback
  async submitCoachingFeedback(data: {
    player_id: string;
    feedback: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<{ success: boolean }> {
    await delay(300);
    console.log('Feedback submitted:', data);
    return { success: true };
  }

  // Team Stats
  async fetchTeamStats() {
    await delay(200);
    return {
      totalMatches: mockMatches.length,
      wins: mockMatches.filter(m => m.winner === 'Team Alpha').length,
      losses: mockMatches.filter(m => m.winner !== 'Team Alpha').length,
      winRate: Math.round(
        (mockMatches.filter(m => m.winner === 'Team Alpha').length / mockMatches.length) * 100
      ),
      avgScore: mockMatches.reduce((acc, m) => acc + m.score[0], 0) / mockMatches.length,
      bestMap: 'Bind',
      worstMap: 'Split',
    };
  }

  // SkySim Tactical GG - Comprehensive Analysis
  async analyzeMatchWithSkySimTacticalGG(matchId: string) {
    await delay(1000);
    return {
      analysis_id: `analysis-${matchId}`,
      summary: {
        key_findings: [
          'Predictable positioning correlates with 65% round loss rate',
          'Team coordination score: 68%',
        ],
        top_priorities: [
          'Improve utility timing on executes',
          'Reduce predictable positioning mistakes',
        ],
        overall_team_health: 0.72,
        improvement_areas: ['Utility timing', 'Trade efficiency'],
        strengths: ['A site executes (75% success)', 'Strong default patterns'],
      },
    };
  }

  // SkySim Tactical GG - Live Insights
  async getLiveInsights(_matchId: string): Promise<{
    alerts: any[];
    recommendations: string[];
    utility_recommendations?: UtilityDecision;
    tactical_overlay: any;
  }> {
    await delay(300);
    return {
      alerts: [],
      recommendations: [
        'Review utility timing and coordination',
        'Focus on trade kills in next round',
      ],
      utility_recommendations: {
        recommendations: [
          { type: 'Smoke', purpose: 'Entry smokes (0:30)', timing: '0:30', winRateImpact: '+31%', priority: 1 }
        ],
        decisionTreePath: ['0:25-0:40 → ENTRY PACKAGE'],
        counterplay: ['ENEMY SMOKES → Delay 5s → Entry'],
        proBenchmarks: ['Attack Execute: 0:38 avg']
      },
      tactical_overlay: {
        current_phase: 'mid_round',
        team_coordination: 0.72,
        key_events: [],
        predicted_actions: [],
      },
    };
  }
}

export const api = new ApiService();
export default api;
