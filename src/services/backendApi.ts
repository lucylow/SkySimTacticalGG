// Backend API Service - Emulates FastAPI backend responses for local runs
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
  WhatIfModification,
  WhatIfPrediction,
  WhatIfAnalysis,
} from '@/types/backend';
import type {
  AgentOrchestrationRequest,
  AgentOrchestrationResponse,
  AgentRole,
  AgentInput,
  AgentOutput,
  BaseAgent as BaseAgentInterface,
} from '@/types/agents';
import type { GridDataPacket } from '@/types/grid';

import {
  mockMatchMetadata,
  mockRoundData,
  mockPlayerRoundStats,
  mockStrategicPatterns,
  mockPlayerMistakes,
  mockMotionSequences,
  mockMicroMacroConnection,
  mockTeamPattern,
  mockCoachingInsights,
  mockActionItems,
  mockDevelopmentPlan,
  mockComprehensiveAnalysis,
  mockMicroAnalysis,
  mockMacroAnalysis,
  mockHealthCheck,
  mockAPIInfo,
  mockMacroReview,
} from '@/mocks/backendMocks';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Simulate varying response times for realism
const randomDelay = (min = 100, max = 500) => delay(min + Math.random() * (max - min));

class BackendApiService {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }

  // ============= Health & Info =============

  async getHealth(): Promise<HealthCheck> {
    await randomDelay(50, 150);
    return { ...mockHealthCheck, timestamp: new Date().toISOString() };
  }

  async getApiInfo(): Promise<APIInfo> {
    await randomDelay(50, 100);
    return mockAPIInfo;
  }

  // ============= Match Data (GRID Integration) =============

  async getMatches(status?: 'scheduled' | 'live' | 'completed'): Promise<MatchMetadata[]> {
    await randomDelay(150, 300);
    if (status) {
      return mockMatchMetadata.filter((m) => m.status === status);
    }
    return mockMatchMetadata;
  }

  async getMatch(matchId: string): Promise<MatchMetadata | null> {
    await randomDelay(100, 200);
    return mockMatchMetadata.find((m) => m.id === matchId) || null;
  }

  async getLiveMatch(
    matchId: string
  ): Promise<{ match: MatchMetadata; rounds: RoundData[] } | null> {
    await randomDelay(200, 400);
    const match = mockMatchMetadata.find((m) => m.id === matchId);
    if (!match) return null;
    return {
      match,
      rounds: mockRoundData.filter((r) => r.match_id === matchId),
    };
  }

  async getRounds(matchId: string): Promise<RoundData[]> {
    await randomDelay(150, 300);
    return mockRoundData.filter((r) => r.match_id === matchId);
  }

  async getRound(roundId: string): Promise<RoundData | null> {
    await randomDelay(100, 200);
    return mockRoundData.find((r) => r.id === roundId) || null;
  }

  async getPlayerRoundStats(roundId: string): Promise<PlayerRoundStat[]> {
    await randomDelay(150, 300);
    return mockPlayerRoundStats.filter((prs) => prs.round_id === roundId);
  }

  // ============= Analysis Endpoints =============

  async analyzeMatchComprehensive(matchId: string): Promise<ComprehensiveAnalysisResponse> {
    await randomDelay(800, 1500); // Longer delay to simulate complex analysis
    return {
      ...mockComprehensiveAnalysis,
      match_id: matchId,
      analysis_completed: new Date().toISOString(),
    };
  }

  async getMicroAnalysis(matchId: string): Promise<MicroAnalysis> {
    await randomDelay(300, 600);
    return { ...mockMicroAnalysis, match_id: matchId };
  }

  async getMacroAnalysis(matchId: string): Promise<MacroAnalysis> {
    await randomDelay(300, 600);
    return { ...mockMacroAnalysis, match_id: matchId };
  }

  async getPlayerMistakes(playerId: string, matchId?: string): Promise<PlayerMistake[]> {
    await randomDelay(200, 400);
    let mistakes = mockPlayerMistakes.filter((m) => m.player_id === playerId);
    if (matchId) {
      mistakes = mistakes.filter((m) => m.match_id === matchId);
    }
    return mistakes;
  }

  async getMicroMacroConnections(
    _playerId: string,
    _matchId: string,
    timeframeMinutes = 10
  ): Promise<MicroMacroConnection> {
    await randomDelay(400, 800);
    return {
      ...mockMicroMacroConnection,
      player_id: _playerId,
      timeframe_minutes: timeframeMinutes,
    };
  }

  // ============= Strategic Patterns =============

  async getStrategicPatterns(_teamId: string, mapName?: string): Promise<StrategicPattern[]> {
    await randomDelay(250, 500);
    let patterns = mockStrategicPatterns.filter((p) => p.team_id === _teamId);
    if (mapName) {
      patterns = patterns.filter((p) => p.map_name === mapName);
    }
    return patterns;
  }

  async identifyTeamPatterns(_teamId: string, _matchesLimit = 20): Promise<TeamPattern> {
    await randomDelay(600, 1200);
    return { ...mockTeamPattern, team_id: _teamId };
  }

  // ============= Coaching Insights =============

  async generateCoachingInsights(
    teamId: string,
    matchId?: string
  ): Promise<{
    generated_at: string;
    team_id: string;
    match_id?: string;
    summary: string;
    key_insights: CoachingInsight[];
    action_items: ActionItem[];
  }> {
    await randomDelay(700, 1400);
    return {
      generated_at: new Date().toISOString(),
      team_id: teamId,
      match_id: matchId,
      summary: mockComprehensiveAnalysis.coaching_insights.summary,
      key_insights: mockCoachingInsights,
      action_items: mockActionItems,
    };
  }

  async getActionItems(_teamId: string): Promise<ActionItem[]> {
    await randomDelay(200, 400);
    return mockActionItems;
  }

  // ============= Motion Data (HY-Motion) =============

  async getMotionSequence(motionId: string): Promise<MotionSequence | null> {
    await randomDelay(300, 600);
    return mockMotionSequences.find((m) => m.id === motionId) || null;
  }

  async generateMotionVisualization(
    prompt: string,
    config: {
      duration?: number;
      actionType?: string;
      playerRole?: string;
    } = {}
  ): Promise<MotionSequence> {
    try {
      // Call HY-Motion-1.0 API endpoint
      const response = await fetch(`${this.baseUrl}/motion/generate-sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          duration_seconds: config.duration || 5.0,
          metadata: {
            action_type: config.actionType,
            player_role: config.playerRole,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HY-Motion API error: ${response.statusText}`);
      }

      const motionData = await response.json();

      // Convert HY-Motion response to MotionSequence format
      return {
        id: `motion_gen_${Date.now()}`,
        prompt_used: prompt,
        motion_data: {
          smpl_params: motionData.smpl_params || Array.from({ length: 72 }, () => Math.random()),
          joint_positions: motionData.joint_positions || motionData.frames || [],
        },
        duration_frames: motionData.frames?.length || Math.floor((config.duration || 5) * 30),
        fps: motionData.fps || 30,
        action_type: (config.actionType as MotionSequence['action_type']) || 'peek',
        player_role: (config.playerRole as MotionSequence['player_role']) || 'entry',
        quality_score: 0.9,
      };
    } catch (error) {
      console.error('Error calling HY-Motion-1.0 API:', error);
      // Fallback to cached seed data for development
      await randomDelay(1000, 2000);
      return {
        id: `motion_gen_${Date.now()}`,
        prompt_used: prompt,
        motion_data: {
          smpl_params: Array.from({ length: 72 }, () => Math.random()),
          joint_positions: Array.from({ length: Math.floor((config.duration || 5) * 30) }, () =>
            Array.from({ length: 22 }, () => Math.random())
          ),
        },
        duration_frames: Math.floor((config.duration || 5) * 30),
        fps: 30,
        action_type: (config.actionType as MotionSequence['action_type']) || 'peek',
        player_role: (config.playerRole as MotionSequence['player_role']) || 'entry',
        quality_score: 0.9 + Math.random() * 0.1,
      };
    }
  }

  /**
   * Generate motion visualization from GRID data using Tactical Prompt Engine
   * This is the core "Moneyball for Esports" integration
   */
  async generateMotionFromGridData(
    playerData: PlayerRoundStat,
    roundData: RoundData,
    matchData: MatchMetadata,
    gridSnapshot: Record<string, unknown>
  ): Promise<MotionSequence> {
    // Import tactical engine dynamically to avoid circular dependencies
    const { generateMotionPrompt, buildSceneDescriptor } = await import('./tacticalPromptEngine');

    // Build game state context - map round_type to economy_state
    const economyMap: Record<string, 'full_buy' | 'force' | 'eco' | 'semi' | undefined> = {
      full: 'full_buy',
      pistol: 'eco',
      eco: 'eco',
      force: 'force',
    };
    
    const gameState = {
      map: matchData.map_name,
      round_phase: this.inferRoundPhase(roundData) as 'pre_round' | 'mid_round' | 'post_plant' | 'round_end',
      win_probability_team_a: 0.5, // Would come from GRID data
      round_number: roundData.round_number,
      time_remaining: roundData.duration_seconds,
      economy_state: economyMap[roundData.round_type] || 'full_buy',
      spike_state: 'not_planted' as const,
    };

    // Build scene descriptor
    const sceneDescriptor = buildSceneDescriptor(
      matchData,
      roundData,
      [{ playerData, gridSnapshot }],
      gameState
    );

    // Generate tactical prompt
    const motionPrompt = generateMotionPrompt(
      sceneDescriptor,
      playerData.player_id,
      {}
    );

    // Generate motion using the tactical prompt
    return this.generateMotionVisualization(motionPrompt.prompt_text, {
      duration: motionPrompt.config.duration,
      actionType: motionPrompt.config.action_type,
      playerRole: motionPrompt.config.player_role as string,
    });
  }

  /**
   * Generate predictive play visualization (next 30 seconds)
   */
  async generatePredictivePlayVisualization(
    matchId: string,
    roundNumber: number,
    teamId: string
  ): Promise<MotionSequence[]> {
    await randomDelay(1500, 2500);

    // In production, this would:
    // 1. Fetch current round state from GRID
    // 2. Use predictive model to determine likely next actions
    // 3. Generate scene descriptors for predicted state
    // 4. Generate motion prompts for each predicted action
    // 5. Return array of motion sequences

    const { generateMotionPrompt, buildSceneDescriptor } = await import('./tacticalPromptEngine');
    const roundData = mockRoundData.find(
      (r) => r.match_id === matchId && r.round_number === roundNumber
    );
    const matchData = mockMatchMetadata.find((m) => m.id === matchId);

    if (!roundData || !matchData) {
      return [];
    }

    // Simulate predictive motions
    const motions: MotionSequence[] = [];
    const players = mockPlayerRoundStats
      .filter((prs) => prs.round_id === roundData.id && prs.team_id === teamId)
      .slice(0, 3);

    for (const playerData of players) {
      const gridSnapshot: Record<string, unknown> = {
        role: 'entry',
        agent: 'Jett',
        health: 100,
        is_moving: true,
        is_crouching: false,
        utility: ['flash', 'smoke'],
        utility_count: { flash: 1, smoke: 1 },
      };

      const gameState = {
        map: matchData.map_name,
        round_phase: this.inferRoundPhase(roundData) as 'pre_round' | 'mid_round' | 'post_plant' | 'round_end',
        round_number: roundData.round_number,
        time_remaining: 30,
        economy_state: roundData.round_type,
        spike_state: 'planted' as const,
      };

      const sceneDescriptor = buildSceneDescriptor(
        matchData,
        roundData,
        [{ playerData, gridSnapshot }],
        gameState
      );

      const motionPrompt = generateMotionPrompt(
        sceneDescriptor,
        playerData.player_id,
        {}
      );
      const motion = await this.generateMotionVisualization(motionPrompt.prompt_text, {
        duration: motionPrompt.config.duration,
        actionType: motionPrompt.config.action_type,
        playerRole: motionPrompt.config.player_role as string,
      });
      motions.push(motion);
    }

    return motions;
  }

  /**
   * Helper: Infer round phase from round data
   */
  private inferRoundPhase(roundData: RoundData): string {
    const duration = roundData.duration_seconds;
    const phaseStats = roundData.round_phase_stats;

    if (phaseStats.post_plant_time !== undefined) return 'post_plant';
    if (phaseStats.execute_time !== undefined) return 'mid_round';
    if (duration < 5) return 'pre_round';
    if (duration > 100) return 'round_end';
    return 'mid_round';
  }

  async getMistakeMotionComparison(mistakeId: string): Promise<{
    mistake: MotionSequence | null;
    correct: MotionSequence | null;
  }> {
    await randomDelay(400, 800);
    const mistake = mockPlayerMistakes.find((m) => m.id === mistakeId);
    return {
      mistake: mistake?.motion_sequence_id
        ? mockMotionSequences.find((m) => m.id === mistake.motion_sequence_id) || null
        : null,
      correct: mistake?.corrected_motion_id
        ? mockMotionSequences.find((m) => m.id === mistake.corrected_motion_id) || null
        : null,
    };
  }

  // ============= Player Development =============

  async generateDevelopmentPlan(
    playerId: string,
    timeframeDays = 30
  ): Promise<{
    player_id: string;
    timeframe_days: number;
    generated_at: string;
    development_plan: DevelopmentPlan;
    progress_metrics: Record<string, number>;
  }> {
    await randomDelay(800, 1500);
    return {
      player_id: playerId,
      timeframe_days: timeframeDays,
      generated_at: new Date().toISOString(),
      development_plan: {
        ...mockDevelopmentPlan,
        player_id: playerId,
        timeframe_days: timeframeDays,
      },
      progress_metrics: {
        coordination: 0.65,
        positioning: 0.58,
        clutch: 0.78,
        utility: 0.7,
        communication: 0.72,
      },
    };
  }

  async getPlayerProgressMetrics(_playerId: string): Promise<Record<string, number>> {
    await randomDelay(150, 300);
    return {
      coordination: 0.65 + Math.random() * 0.1,
      positioning: 0.58 + Math.random() * 0.1,
      clutch: 0.78 + Math.random() * 0.1,
      utility: 0.7 + Math.random() * 0.1,
      communication: 0.72 + Math.random() * 0.1,
    };
  }

  // ============= Real-time Insights (WebSocket simulation) =============

  subscribeToTeamInsights(
    _teamId: string,
    onInsight: (insight: CoachingInsight) => void
  ): () => void {
    // Simulate real-time insights arriving
    const interval = setInterval(
      () => {
        const randomInsight =
          mockCoachingInsights[Math.floor(Math.random() * mockCoachingInsights.length)];
        onInsight({
          ...randomInsight,
          id: `realtime_${Date.now()}`,
        });
      },
      15000 + Math.random() * 30000
    ); // Every 15-45 seconds

    return () => clearInterval(interval);
  }

  subscribeToLiveMatch(
    _matchId: string,
    onEvent: (event: { type: string; data: unknown }) => void
  ): () => void {
    const events: Array<{ type: string; data: Record<string, unknown> }> = [
      { type: 'round_start', data: { round_number: 1, timestamp: Date.now() } },
      { type: 'kill', data: { player: 'OXY', weapon: 'Vandal', timestamp: Date.now() } },
      { type: 'ability_used', data: { player: 'SMOKE', ability: 'smoke', timestamp: Date.now() } },
      { type: 'round_end', data: { winner: 't1', timestamp: Date.now() } },
    ];

    let eventIndex = 0;
    const interval = setInterval(
      () => {
        const event = events[eventIndex % events.length];
        onEvent({
          type: event.type,
          data: {
            ...event.data,
            timestamp: Date.now(),
          },
        });
        eventIndex++;
      },
      5000 + Math.random() * 10000
    );

    return () => clearInterval(interval);
  }

  // ============= Macro Review =============

  async generateMacroReview(matchId: string): Promise<MacroReview> {
    await randomDelay(1000, 2000); // Simulate analysis time
    return {
      ...mockMacroReview,
      match_id: matchId,
      generated_at: new Date().toISOString(),
    };
  }

  async getMacroReview(matchId: string): Promise<MacroReview | null> {
    await randomDelay(300, 600);
    return {
      ...mockMacroReview,
      match_id: matchId,
    };
  }

  /**
   * Generate automated macro review agenda using agenda generator
   */
  async generateReviewAgenda(
    matchId: string
  ): Promise<import('@/services/agendaGenerator').ReviewAgenda> {
    await randomDelay(1500, 2500); // Simulate analysis time

    // Import agenda generator
    const { agendaGenerator } = await import('./agendaGenerator');

    // Fetch match data
    const match = await this.getMatch(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Fetch rounds
    const rounds = await this.getRounds(matchId);

    // Generate agenda
    const agenda = await agendaGenerator.generateReviewAgenda(match, rounds, match.team_a_id);

    return agenda;
  }

  async getReviewHistory(_teamId: string, limit = 10): Promise<MacroReview[]> {
    await randomDelay(400, 800);
    return Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
      ...mockMacroReview,
      match_id: `grid_match_00${i + 1}`,
      generated_at: new Date(Date.now() - i * 86400000).toISOString(),
    }));
  }

  // ============= What-If Predictions =============

  /**
   * Predict hypothetical scenario outcome
   */
  async predictHypothetical(
    matchId: string,
    modification: WhatIfModification,
    reviewId?: string
  ): Promise<WhatIfPrediction> {
    await randomDelay(1500, 3000); // Simulate complex computation

    // Import prediction engine
    const { predictionEngine } = await import('./predictionEngine');

    // Fetch match data
    const match = await this.getMatch(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Fetch rounds
    const rounds = await this.getRounds(matchId);

    // Fetch macro review if reviewId provided
    let macroReview: MacroReview | null = null;
    let reviewEvents = undefined;
    if (reviewId) {
      macroReview = await this.getMacroReview(matchId);
      reviewEvents = macroReview?.review_agenda.flatMap((phase) => phase.items);
    }

    // Run prediction
    const prediction = await predictionEngine.predictScenario(
      matchId,
      modification,
      rounds,
      match,
      reviewEvents
    );

    return prediction;
  }

  /**
   * Create what-if scenario linked to macro review
   */
  async createWhatIfScenario(
    matchId: string,
    reviewId: string,
    scenario: WhatIfModification
  ): Promise<WhatIfAnalysis> {
    await randomDelay(1500, 3000);

    // Generate prediction
    const prediction = await this.predictHypothetical(matchId, scenario, reviewId);

    // Get review
    const review = await this.getMacroReview(matchId);
    if (!review) {
      throw new Error(`Review ${reviewId} not found`);
    }

    // Create analysis object
    const analysis: WhatIfAnalysis = {
      scenario: {
        round_number: scenario.round_number,
        change_type: scenario.change_type,
        original_action: scenario.original_action,
        hypothetical_action: scenario.hypothetical_action,
        player_affected: scenario.player_affected,
        context: typeof scenario.context === 'string' ? scenario.context : JSON.stringify(scenario.context || ''),
      },
      prediction,
      generated_at: new Date().toISOString(),
      review_section_id: reviewId,
    };

    // In production, this would save to database and link to review
    // For now, just return the analysis

    return analysis;
  }

  /**
   * Get all what-if analyses for a match/review
   */
  async getWhatIfAnalyses(_matchId: string, _reviewId?: string): Promise<WhatIfAnalysis[]> {
    await randomDelay(300, 600);
    // In production, would fetch from database
    // For now, return empty array
    return [];
  }

  /**
   * Analyze "what if" query using natural language
   * Uses the enhanced Prediction Agent with specialized analyzers
   */
  async analyzeWhatIfQuery(
    matchId: string,
    query: string,
    gridPackets?: GridDataPacket[]
  ): Promise<{
    query: string;
    parsed_query: unknown;
    actual_scenario: {
      success_probability: number;
      outcome: string;
      key_factors: string[];
    };
    hypothetical_scenario: {
      success_probability: number;
      outcome: string;
      key_factors: string[];
    };
    strategic_recommendation: string;
    confidence_score: number;
    supporting_data: Record<string, unknown>;
    visualization_prompt?: string;
    specialized_analysis?: unknown;
  }> {
    await randomDelay(1500, 3000); // Simulate complex analysis

    // Import prediction agent
    const { predictionAgent } = await import('./predictionAgent');

    // Fetch match data
    const match = await this.getMatch(matchId);
    if (!match) {
      throw new Error(`Match ${matchId} not found`);
    }

    // Fetch rounds
    const rounds = await this.getRounds(matchId);

    // Fetch macro review for context
    const macroReview = await this.getMacroReview(matchId);
    const reviewEvents = macroReview?.review_agenda.flatMap((phase) => phase.items);

    // Analyze using prediction agent
    const result = await predictionAgent.analyzeWhatIf(
      matchId,
      query,
      rounds,
      match,
      gridPackets,
      reviewEvents
    );

    return result;
  }

  /**
   * Simplified text-based scenario prediction (for UI)
   */
  async predictScenario(
    _matchId: string,
    scenario: string,
    _roundNumber?: number
  ): Promise<{
    scenario: string;
    original_outcome: string;
    predicted_outcome: string;
    win_probability_change: number;
    reasoning: string;
    key_factors: string[];
    confidence: number;
    historical_similarity: number;
  }> {
    await randomDelay(1000, 2000); // Simulate ML model inference time

    // Parse scenario text to extract key information
    const scenarioLower = scenario.toLowerCase();
    const isPositive =
      scenarioLower.includes('rotate') ||
      scenarioLower.includes('smoke') ||
      scenarioLower.includes('flash') ||
      scenarioLower.includes('better') ||
      scenarioLower.includes('earlier') ||
      scenarioLower.includes('instead');

    const winProbChange = isPositive ? 0.25 + Math.random() * 0.2 : -(0.15 + Math.random() * 0.1);

    return {
      scenario,
      original_outcome: 'Loss (11-13)',
      predicted_outcome:
        winProbChange > 0.2 ? 'Win (13-11)' : winProbChange > 0 ? 'Win (13-12)' : 'Loss (10-14)',
      win_probability_change: winProbChange,
      reasoning: `Based on analysis of ${Math.floor(500 + Math.random() * 300)} similar historical scenarios from GRID match data, ${
        isPositive
          ? 'the alternative decision would improve team positioning and reduce exposure. Historical patterns show a 68-75% success rate with similar strategic choices on this map and side.'
          : 'the alternative decision would increase risk exposure. Analysis of similar scenarios shows lower success rates (45-52%) due to timing and positioning constraints.'
      }`,
      key_factors: [
        isPositive
          ? 'Team positioning would improve by 18-25%'
          : 'Positioning risk increases by 15-22%',
        isPositive
          ? 'Enemy utility efficiency would decrease by 12-18%'
          : 'Utility timing becomes more predictable for opponents',
        isPositive ? 'Trade potential increases by 15-20%' : 'Isolation risk increases by 20-28%',
        isPositive
          ? 'Map control advantage improves by 10-15%'
          : 'Map control becomes more contested',
      ],
      confidence: 0.75 + Math.random() * 0.15,
      historical_similarity: 0.65 + Math.random() * 0.25,
    };
  }

  // ============= AI Agents API =============

  /**
   * Orchestrate multiple agents for comprehensive analysis
   * POST /api/v1/agents/orchestrate
   */
  async orchestrateAgents(request: AgentOrchestrationRequest): Promise<AgentOrchestrationResponse> {
    await randomDelay(1000, 2000);

    // Import agent orchestrator
    const { agentOrchestrator } = await import('./agents');

    // Execute orchestration
    return await agentOrchestrator.orchestrate(request);
  }

  /**
   * Execute a single agent
   * POST /api/v1/agents/{agentRole}/execute
   */
  async executeAgent(agentRole: AgentRole, input: AgentInput): Promise<AgentOutput> {
    await randomDelay(500, 1500);

    const { agentOrchestrator } = await import('./agents');
    const agent = agentOrchestrator.getAgent(agentRole);

    if (!agent) {
      throw new Error(`Agent ${agentRole} not found`);
    }

    return await (agent as BaseAgentInterface).execute(input);
  }

  /**
   * Analyze round with Micro-Mistake Detector
   * POST /api/v1/agents/analyze-round
   */
  async analyzeRoundWithAgents(
    gridData: unknown[],
    roundData?: unknown
  ): Promise<AgentOrchestrationResponse> {
    await randomDelay(1500, 3000);

    const request: AgentOrchestrationRequest = {
      agents: ['micro_mistake_detector', 'macro_strategy_analyst'],
      input: {
        grid_data: gridData as GridDataPacket[],
        round_data: roundData as AgentInput['round_data'],
      },
      coordination_strategy: 'sequential',
      context_sharing: true,
    };

    return await this.orchestrateAgents(request);
  }

  /**
   * Get opponent scouting report
   * GET /api/v1/agents/scout/{opponentTeam}
   */
  async getOpponentScouting(opponentTeam: string, matchContext?: unknown): Promise<AgentOutput> {
    await randomDelay(1000, 2000);

    return await this.executeAgent('opponent_scouting', {
      opponent_data: {
        team_name: opponentTeam,
        historical_matches: [],
        preferred_compositions: [],
        map_tendencies: [],
        clutch_performance: {
          one_v_one: 0.5,
          one_v_two: 0.35,
          one_v_three: 0.2,
          one_v_four: 0.1,
          one_v_five: 0.05,
        },
      },
      match_context: matchContext as AgentInput['match_context'],
    });
  }

  /**
   * Get predictive playbook recommendations
   * POST /api/v1/agents/predictive-playbook
   */
  async getPredictivePlaybook(matchContext: unknown, opponentData?: unknown): Promise<AgentOutput> {
    await randomDelay(2000, 4000);

    return await this.executeAgent('predictive_playbook', {
      match_context: matchContext as AgentInput['match_context'],
      opponent_data: opponentData as AgentInput['opponent_data'],
    });
  }

  /**
   * Get real-time coaching suggestions
   * POST /api/v1/agents/live-coach
   */
  async getLiveCoaching(gridData: unknown[], previousAnalysis?: unknown): Promise<AgentOutput> {
    await randomDelay(300, 800); // Fast response for real-time

    return await this.executeAgent('prosthetic_coach', {
      grid_data: gridData as GridDataPacket[],
      previous_analysis: previousAnalysis,
      live_feed: true,
    });
  }

  /**
   * Get all available agents
   * GET /api/v1/agents
   */
  async getAvailableAgents(): Promise<{
    agents: Array<{
      role: AgentRole;
      name: string;
      description: string;
    }>;
  }> {
    await randomDelay(50, 100);

    const { agentOrchestrator } = await import('./agents');
    const roles = agentOrchestrator.getAllAgents();

    const agentInfo = roles.map((role) => {
      const agent = agentOrchestrator.getAgent(role);
      return {
        role,
        name: agent?.name || role,
        description: agent?.description || '',
      };
    });

    return { agents: agentInfo };
  }
}

export const backendApi = new BackendApiService();
export default backendApi;
