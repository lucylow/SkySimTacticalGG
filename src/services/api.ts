import type { DashboardData, Match, Player, MotionData, Insight } from '@/types';
import type { UtilityDecision } from '@/types/utility';
import type { LoLPlayer, ValorantPlayer, EsportsTeam, EsportsMatch } from '@/types/esports';
import { 
  SampleDashboardData, 
  SamplePlayers, 
  SampleMatches, 
  SampleInsights,
  SampleMotionData,
  SamplePerformanceTrends,
  SampleCoachingSuggestions,
  SampleLoLPlayers,
  SampleValorantPlayers,
  SampleLoLTeams,
  SampleLoLMatches,
} from '@/data/SampleData';
import { ApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import { getTopPriorities } from './ObjectivePriorityEngine';
import { ValorantPlaystyleAnalyzer } from './playstyle/valorantAnalyzer';
import { LeaguePlaystyleAnalyzer } from './playstyle/leagueAnalyzer';
import { LivePlaystyleTracker } from './playstyle/liveTracker';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private apiClient: ApiClient;
  private useSampleData: boolean;

  constructor() {
    this.useSampleData = config.enableSampleData;
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
    if (this.useSampleData) {
      await delay(300); // Simulate network
      return { ...SampleDashboardData, last_update: new Date().toISOString() };
    }
    await delay(300);
    return { ...SampleDashboardData, last_update: new Date().toISOString() };
  }

  // Esports Specific Fetchers
  async fetchLoLPlayers(): Promise<LoLPlayer[]> {
    await delay(200);
    return SampleLoLPlayers;
  }

  async fetchValorantPlayers(): Promise<ValorantPlayer[]> {
    await delay(200);
    return SampleValorantPlayers;
  }

  async fetchLoLTeams(): Promise<EsportsTeam[]> {
    await delay(200);
    return SampleLoLTeams;
  }

  async fetchLoLMatches(): Promise<EsportsMatch[]> {
    await delay(200);
    return SampleLoLMatches;
  }

  // Match Analysis
  async fetchMatchAnalysis(matchId: string): Promise<Match | null> {
    await delay(200);
    return SampleMatches.find(m => m.id === matchId) || null;
  }

  async fetchMatchList(): Promise<Match[]> {
    await delay(250);
    return SampleMatches;
  }

  // Player Development
  async fetchPlayerDevelopment(playerId: string): Promise<Player | null> {
    await delay(200);
    return SamplePlayers.find(p => p.id === playerId) || null;
  }

  async fetchPlayerList(): Promise<Player[]> {
    await delay(200);
    return SamplePlayers;
  }

  // Insights
  async fetchInsights(): Promise<Insight[]> {
    await delay(150);
    return SampleInsights;
  }

  async generateInsights(_teamId: string): Promise<Insight[]> {
    await delay(500);
    return SampleInsights.filter(() => Math.random() > 0.3);
  }

  // Motion Data
  async fetchMotionData(_motionId: string): Promise<MotionData> {
    await delay(300);
    return SampleMotionData;
  }

  // Performance Trends
  async fetchPerformanceTrends(period: 'weekly' | 'monthly' = 'weekly') {
    await delay(200);
    return SamplePerformanceTrends[period];
  }

  // Live Coaching
  async fetchCoachingSuggestions() {
    await delay(100);
    return SampleCoachingSuggestions;
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
      totalMatches: SampleMatches.length,
      wins: SampleMatches.filter(m => m.winner === 'Team Alpha').length,
      losses: SampleMatches.filter(m => m.winner !== 'Team Alpha').length,
      winRate: Math.round(
        (SampleMatches.filter(m => m.winner === 'Team Alpha').length / SampleMatches.length) * 100
      ),
      avgScore: SampleMatches.reduce((acc, m) => acc + m.score[0], 0) / SampleMatches.length,
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
  async getLiveInsights(matchId: string): Promise<{
    alerts: any[];
    recommendations: string[];
    utility_recommendations?: UtilityDecision;
    tactical_overlay: any;
  }> {
    if (config.enableSampleData) {
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

    try {
      // Call improved grid-ingest Edge Function
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
      const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const supabaseUrl = envUrl || (projectId ? `https://${projectId}.supabase.co` : undefined);
      if (!supabaseUrl) throw new Error('Supabase URL not configured. Set VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID.');
      const response = await fetch(`${supabaseUrl}/functions/v1/grid-ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'get_match',
          matchId
        })
      });

      if (!response.ok) throw new Error('Failed to fetch live insights from Edge Function');
      
      const data = await response.json();
      
      // Transform Edge Function data to local format
      return {
        alerts: data.summaries?.filter((s: any) => s.performance_rating < 0.6).map((s: any) => ({
          type: 'warning',
          title: 'Low Performance Warning',
          description: `Player ${s.player_id} has a performance rating of ${Math.round(s.performance_rating * 100)}%`,
          priority: 'high'
        })) || [],
        recommendations: data.events?.length > 0 ? ['High event volume detected - review recent exchanges'] : ['Standard play patterns observed'],
        tactical_overlay: {
          current_phase: data.match?.meta?.current_phase || 'unknown',
          team_coordination: 0.7, // Placeholder or computed
          key_events: data.events || [],
          predicted_actions: []
        }
      };
    } catch (error) {
      console.error('Error fetching live insights:', error);
      throw error;
    }
  }

  async analyzeOpponents(game: 'VALORANT' | 'LEAGUE', telemetryData: any[]): Promise<any> {
    // Frontend-side Sample implementation; in production this would hit a backend route
    await delay(200);

    const analyzer = game === 'VALORANT' ? new ValorantPlaystyleAnalyzer() : new LeaguePlaystyleAnalyzer();
    const tracker = new LivePlaystyleTracker();

    const profiles = telemetryData.map((data: any, idx: number) => analyzer.classifyPlayer({ ...data, id: String(idx+1) } as any));
    const teamThreat = tracker.getEnemyTeamPlaystyle(profiles.map((p: any) => String(p.id)));

    return {
      enemyPlaystyles: profiles,
      teamCounter: teamThreat,
      wrImpact: '+3.2%',
      coachCalls: teamThreat.executePriority,
    };
  }

  async getObjectivePriorities(matchId: string, timestamp: number) {
    // For now, compute locally using the decision tree engine (Sample live state inside)
    return await getTopPriorities(matchId, timestamp);
  }

  async ingestTelemetry(matchId: string, packets: any[]) {
    if (config.enableSampleData) {
      console.log('[Sample] Ingesting telemetry packets:', packets.length);
      return { success: true };
    }

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;
      const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      const supabaseUrl = envUrl || (projectId ? `https://${projectId}.supabase.co` : undefined);
      if (!supabaseUrl) throw new Error('Supabase URL not configured. Set VITE_SUPABASE_URL or VITE_SUPABASE_PROJECT_ID.');
      const response = await fetch(`${supabaseUrl}/functions/v1/grid-ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          action: 'ingest_telemetry',
          matchId,
          packets
        })
      });

      if (!response.ok) throw new Error('Failed to ingest telemetry');
      return await response.json();
    } catch (error) {
      console.error('Telemetry ingestion error:', error);
      throw error;
    }
  }
}

export const api = new ApiService();
export default api;

