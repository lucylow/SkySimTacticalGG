import type { DashboardData, Match, Player, MotionData, Insight } from '@/types';
import { 
  mockDashboardData, 
  mockPlayers, 
  mockMatches, 
  mockInsights,
  mockMotionData,
  mockPerformanceTrends,
  mockCoachingSuggestions,
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
    
    // In production, call real backend endpoint
    // return this.apiClient.get<DashboardData>('/dashboard');
    await delay(300);
    return { ...mockDashboardData, last_update: new Date().toISOString() };
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

  async generateInsights(teamId: string): Promise<Insight[]> {
    await delay(500);
    return mockInsights.filter(() => Math.random() > 0.3);
  }

  // Motion Data
  async fetchMotionData(motionId: string): Promise<MotionData> {
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

  // Assistant Coach - Comprehensive Analysis
  async analyzeMatchWithAssistantCoach(matchId: string) {
    await delay(1000);
    // In production, this would call the assistantCoach service with real GRID data
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

  // Assistant Coach - Live Insights
  async getLiveInsights(matchId: string) {
    await delay(300);
    return {
      alerts: [],
      recommendations: [
        'Review utility timing and coordination',
        'Focus on trade kills in next round',
      ],
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
