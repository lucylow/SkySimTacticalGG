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
    try {
      if (this.useSampleData) {
        await delay(300); // Simulate network
        return { ...SampleDashboardData, last_update: new Date().toISOString() };
      }
      return await this.apiClient.get<DashboardData>('/dashboard');
    } catch (error) {
      console.error('ApiService: Error fetching dashboard data:', error);
      // Fallback to sample data on error if in development/sample mode
      if (this.useSampleData) return { ...SampleDashboardData, last_update: new Date().toISOString() };
      throw error;
    }
  }

  // Esports Specific Fetchers
  async fetchLoLPlayers(): Promise<LoLPlayer[]> {
    try {
      if (this.useSampleData) {
        await delay(200);
        return SampleLoLPlayers;
      }
      return await this.apiClient.get<LoLPlayer[]>('/lol/players');
    } catch (error) {
      console.error('ApiService: Error fetching LoL players:', error);
      if (this.useSampleData) return SampleLoLPlayers;
      throw error;
    }
  }

  async fetchValorantPlayers(): Promise<ValorantPlayer[]> {
    try {
      if (this.useSampleData) {
        await delay(200);
        return SampleValorantPlayers;
      }
      return await this.apiClient.get<ValorantPlayer[]>('/valorant/players');
    } catch (error) {
      console.error('ApiService: Error fetching Valorant players:', error);
      if (this.useSampleData) return SampleValorantPlayers;
      throw error;
    }
  }

  async fetchLoLTeams(): Promise<EsportsTeam[]> {
    try {
      if (this.useSampleData) {
        await delay(200);
        return SampleLoLTeams;
      }
      return await this.apiClient.get<EsportsTeam[]>('/lol/teams');
    } catch (error) {
      console.error('ApiService: Error fetching LoL teams:', error);
      if (this.useSampleData) return SampleLoLTeams;
      throw error;
    }
  }

  async fetchLoLMatches(): Promise<EsportsMatch[]> {
    try {
      if (this.useSampleData) {
        await delay(200);
        return SampleLoLMatches;
      }
      return await this.apiClient.get<EsportsMatch[]>('/lol/matches');
    } catch (error) {
      console.error('ApiService: Error fetching LoL matches:', error);
      if (this.useSampleData) return SampleLoLMatches;
      throw error;
    }
  }

  // Match Analysis
  async fetchMatchAnalysis(matchId: string): Promise<Match | null> {
    try {
      if (this.useSampleData) {
        await delay(200);
        return SampleMatches.find(m => m.id === matchId) || null;
      }
      return await this.apiClient.get<Match>(`/match/${matchId}`);
    } catch (error) {
      console.error(`ApiService: Error fetching match analysis for ${matchId}:`, error);
      if (this.useSampleData) return SampleMatches.find(m => m.id === matchId) || null;
      throw error;
    }
  }

  async fetchMatchList(): Promise<Match[]> {
    try {
      if (this.useSampleData) {
        await delay(250);
        return SampleMatches;
      }
      return await this.apiClient.get<Match[]>('/matches');
    } catch (error) {
      console.error('ApiService: Error fetching match list:', error);
      if (this.useSampleData) return SampleMatches;
      throw error;
    }
  }

  // Player Development
  async fetchPlayerDevelopment(playerId: string): Promise<Player | null> {
    try {
      if (this.useSampleData) {
        await delay(200);
        return SamplePlayers.find(p => p.id === playerId) || null;
      }
      return await this.apiClient.get<Player>(`/player/${playerId}/development`);
    } catch (error) {
      console.error(`ApiService: Error fetching player development for ${playerId}:`, error);
      if (this.useSampleData) return SamplePlayers.find(p => p.id === playerId) || null;
      throw error;
    }
  }

  async fetchPlayerList(): Promise<Player[]> {
    try {
      if (this.useSampleData) {
        await delay(200);
        return SamplePlayers;
      }
      return await this.apiClient.get<Player[]>('/players');
    } catch (error) {
      console.error('ApiService: Error fetching player list:', error);
      if (this.useSampleData) return SamplePlayers;
      throw error;
    }
  }

  // Insights
  async fetchInsights(): Promise<Insight[]> {
    try {
      if (this.useSampleData) {
        await delay(150);
        return SampleInsights;
      }
      return await this.apiClient.get<Insight[]>('/insights');
    } catch (error) {
      console.error('ApiService: Error fetching insights:', error);
      if (this.useSampleData) return SampleInsights;
      throw error;
    }
  }

  async generateInsights(_teamId: string): Promise<Insight[]> {
    try {
      if (this.useSampleData) {
        await delay(500);
        return SampleInsights.filter(() => Math.random() > 0.3);
      }
      return await this.apiClient.post<Insight[]>(`/teams/${_teamId}/insights`, {});
    } catch (error) {
      console.error(`ApiService: Error generating insights for ${_teamId}:`, error);
      if (this.useSampleData) return SampleInsights.filter(() => Math.random() > 0.3);
      throw error;
    }
  }

  // Motion Data
  async fetchMotionData(_motionId: string): Promise<MotionData> {
    try {
      if (this.useSampleData) {
        await delay(300);
        return SampleMotionData;
      }
      return await this.apiClient.get<MotionData>(`/motion/${_motionId}`);
    } catch (error) {
      console.error(`ApiService: Error fetching motion data for ${_motionId}:`, error);
      if (this.useSampleData) return SampleMotionData;
      throw error;
    }
  }

  // Performance Trends
  async fetchPerformanceTrends(period: 'weekly' | 'monthly' = 'weekly') {
    try {
      if (this.useSampleData) {
        await delay(200);
        return SamplePerformanceTrends[period];
      }
      return await this.apiClient.get(`/performance/trends?period=${period}`);
    } catch (error) {
      console.error(`ApiService: Error fetching performance trends (${period}):`, error);
      if (this.useSampleData) return SamplePerformanceTrends[period];
      throw error;
    }
  }

  // Live Coaching
  async fetchCoachingSuggestions() {
    try {
      if (this.useSampleData) {
        await delay(100);
        return SampleCoachingSuggestions;
      }
      return await this.apiClient.get('/coaching/suggestions');
    } catch (error) {
      console.error('ApiService: Error fetching coaching suggestions:', error);
      if (this.useSampleData) return SampleCoachingSuggestions;
      throw error;
    }
  }

  // Coaching Feedback
  async submitCoachingFeedback(data: {
    player_id: string;
    feedback: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<{ success: boolean }> {
    try {
      if (this.useSampleData) {
        await delay(300);
        console.log('Feedback submitted:', data);
        return { success: true };
      }
      return await this.apiClient.post('/coaching/feedback', data);
    } catch (error) {
      console.error('ApiService: Error submitting coaching feedback:', error);
      throw error;
    }
  }

  // Team Stats
  async fetchTeamStats() {
    try {
      if (this.useSampleData) {
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
      return await this.apiClient.get('/teams/stats');
    } catch (error) {
      console.error('ApiService: Error fetching team stats:', error);
      if (this.useSampleData) {
        return {
          totalMatches: SampleMatches.length,
          wins: 0,
          losses: 0,
          winRate: 0,
          avgScore: 0,
          bestMap: 'N/A',
          worstMap: 'N/A',
        };
      }
      throw error;
    }
  }

  // SkySim Tactical GG - Comprehensive Analysis
  async analyzeMatchWithSkySimTacticalGG(matchId: string) {
    try {
      if (this.useSampleData) {
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
      return await this.apiClient.get(`/skysim/analysis/${matchId}`);
    } catch (error) {
      console.error(`ApiService: Error in analyzeMatchWithSkySimTacticalGG for ${matchId}:`, error);
      if (this.useSampleData) {
         return {
          analysis_id: `analysis-${matchId}-fallback`,
          summary: {
            key_findings: ['Error loading analysis, showing defaults'],
            top_priorities: [],
            overall_team_health: 0,
            improvement_areas: [],
            strengths: [],
          },
        };
      }
      throw error;
    }
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
    try {
      // Frontend-side Sample implementation; in production this would hit a backend route
      await delay(200);

      if (!telemetryData || !Array.isArray(telemetryData)) {
        throw new Error('Invalid telemetry data provided');
      }

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
    } catch (error) {
      console.error(`ApiService: Error in analyzeOpponents for ${game}:`, error);
      throw error;
    }
  }

  async getObjectivePriorities(matchId: string, timestamp: number) {
    try {
      // For now, compute locally using the decision tree engine (Sample live state inside)
      if (!matchId) throw new Error('Match ID is required');
      return await getTopPriorities(matchId, timestamp);
    } catch (error) {
      console.error(`ApiService: Error fetching objective priorities for ${matchId}:`, error);
      throw error;
    }
  }

  async ingestTelemetry(matchId: string, packets: any[]) {
    if (this.useSampleData) {
      console.log('[Sample] Ingesting telemetry packets:', packets?.length || 0);
      return { success: true };
    }

    try {
      if (!matchId) throw new Error('Match ID is required');
      if (!packets || !Array.isArray(packets)) throw new Error('Invalid telemetry packets');

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
      console.error(`ApiService: Error ingesting telemetry for ${matchId}:`, error);
      throw error;
    }
  }
}

export const api = new ApiService();
export default api;

