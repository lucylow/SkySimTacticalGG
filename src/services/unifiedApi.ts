// Unified Backend API Service - Connects to real FastAPI backend
import { ApiClient } from '@/lib/apiClient';
import { config } from '@/lib/config';
import type { HealthCheckResponse } from '@/types/backend';
import type {
  AgentOrchestrationRequest,
  AgentOrchestrationResponse,
  AgentRole,
  AgentInput,
  AgentOutput,
  BaseAgent,
} from '@/types/agents';

// Create API client instance
const apiClient = new ApiClient({
  baseUrl: config.apiBaseUrl,
  getAuthToken: () => localStorage.getItem('auth_token'),
  onUnauthorized: () => {
    localStorage.removeItem('auth_token');
    // Redirect to login if needed
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
  onError: (error) => {
    console.error('API Error:', error);
    // Could integrate with error tracking service here
  },
});

class UnifiedBackendApi {
  // ============= Health & Info =============

  async getHealth(): Promise<HealthCheckResponse> {
    return apiClient.get<HealthCheckResponse>('/health');
  }

  // ============= Agent Data Endpoints =============

  /**
   * Create agent run
   * POST /api/v1/data/runs
   */
  async createAgentRun(payload: {
    run_id: string;
    agent_name: string;
    input_payload?: Record<string, unknown>;
    provenance?: Record<string, unknown>;
  }) {
    return apiClient.post('/data/runs', payload);
  }

  /**
   * Get agent run by ID
   * GET /api/v1/data/runs/{run_id}
   */
  async getAgentRun(runId: string) {
    return apiClient.get(`/data/runs/${runId}`);
  }

  /**
   * List agent runs
   * GET /api/v1/data/runs
   */
  async listAgentRuns(params?: { agent_name?: string; status?: string; limit?: number }) {
    const queryParams = new URLSearchParams();
    if (params?.agent_name) queryParams.append('agent_name', params.agent_name);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return apiClient.get(`/data/runs${query ? `?${query}` : ''}`);
  }

  /**
   * Get artifact by ID
   * GET /api/v1/data/artifacts/{artifact_id}
   */
  async getArtifact(artifactId: number) {
    return apiClient.get(`/data/artifacts/${artifactId}`);
  }

  // ============= Human Review Endpoints =============

  /**
   * Create review
   * POST /api/v1/reviews/create
   */
  async createReview(payload: {
    review_id: string;
    run_id: string;
    agent_name: string;
    reason: string;
    metadata?: Record<string, unknown>;
  }) {
    return apiClient.post('/reviews/create', payload);
  }

  /**
   * List pending reviews
   * GET /api/v1/reviews/pending
   */
  async listPendingReviews(limit = 50) {
    return apiClient.get(`/reviews/pending?limit=${limit}`);
  }

  /**
   * Get review by ID
   * GET /api/v1/reviews/{review_id}
   */
  async getReview(reviewId: string) {
    return apiClient.get(`/reviews/${reviewId}`);
  }

  /**
   * Add comment to review
   * POST /api/v1/reviews/{review_id}/comment
   */
  async addReviewComment(reviewId: string, body: string) {
    return apiClient.post(`/reviews/${reviewId}/comment`, { body });
  }

  /**
   * Take action on review (approve/reject/etc)
   * POST /api/v1/reviews/{review_id}/action
   */
  async reviewAction(
    reviewId: string,
    action: 'approve' | 'reject' | 'request_edit' | 'escalate',
    payload?: Record<string, unknown>
  ) {
    return apiClient.post(`/reviews/${reviewId}/action`, { action, payload });
  }

  // ============= Agent Orchestration =============

  /**
   * Start orchestration
   * POST /api/v1/orchestrate
   */
  async startOrchestration(payload: {
    match_id: string;
    round?: number;
    grid_snapshot?: Record<string, unknown>;
    [key: string]: unknown;
  }): Promise<{ job_id: string }> {
    return apiClient.post('/orchestrate', payload);
  }

  /**
   * Orchestrate multiple agents
   * Uses frontend agent orchestrator (for now, can be migrated to backend)
   */
  async orchestrateAgents(request: AgentOrchestrationRequest): Promise<AgentOrchestrationResponse> {
    // For now, use frontend orchestrator
    // In production, this would call backend endpoint
    const { agentOrchestrator } = await import('./agents');
    return agentOrchestrator.orchestrate(request);
  }

  /**
   * Execute single agent
   */
  async executeAgent(agentRole: AgentRole, input: AgentInput): Promise<AgentOutput> {
    const { agentOrchestrator } = await import('./agents');
    const agent = agentOrchestrator.getAgent(agentRole);
    if (!agent) {
      throw new Error(`Agent ${agentRole} not found`);
    }
    return (agent as BaseAgent).execute(input);
  }

  // ============= Predictions Endpoints =============

  /**
   * Get user's virtual wallet
   * GET /predictions/wallet
   */
  async getWallet() {
    return apiClient.get('/predictions/wallet');
  }

  /**
   * Top up virtual wallet
   * POST /predictions/wallet/topup
   */
  async topUpWallet(topup: { amount: number; reason: string }) {
    return apiClient.post('/predictions/wallet/topup', topup);
  }

  /**
   * Get wallet transactions
   * GET /predictions/wallet/transactions
   */
  async getWalletTransactions(limit = 50) {
    return apiClient.get(`/predictions/wallet/transactions?limit=${limit}`);
  }

  /**
   * List prediction markets
   * GET /predictions/markets
   */
  async listMarkets(params?: { match_id?: string; status?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.match_id) queryParams.append('match_id', params.match_id);
    if (params?.status) queryParams.append('status', params.status);
    const query = queryParams.toString();
    return apiClient.get(`/predictions/markets${query ? `?${query}` : ''}`);
  }

  /**
   * Get prediction market by ID
   * GET /predictions/markets/{marketId}
   */
  async getMarket(marketId: number) {
    return apiClient.get(`/predictions/markets/${marketId}`);
  }

  /**
   * Create a prediction
   * POST /predictions/predictions
   */
  async createPrediction(prediction: { market_id: number; selection: string; stake: number }) {
    return apiClient.post('/predictions/predictions', prediction);
  }

  /**
   * List user predictions
   * GET /predictions/predictions
   */
  async listPredictions(status?: string) {
    const query = status ? `?status=${status}` : '';
    return apiClient.get(`/predictions/predictions${query}`);
  }

  /**
   * Get prediction by ID
   * GET /predictions/predictions/{predictionId}
   */
  async getPrediction(predictionId: string) {
    return apiClient.get(`/predictions/predictions/${predictionId}`);
  }

  /**
   * Cancel a prediction
   * POST /predictions/predictions/{predictionId}/cancel
   */
  async cancelPrediction(predictionId: string) {
    return apiClient.post(`/predictions/predictions/${predictionId}/cancel`, {});
  }

  /**
   * Get prediction statistics
   * GET /predictions/stats
   */
  async getPredictionStats() {
    return apiClient.get('/predictions/stats');
  }

  /**
   * Get user dashboard data
   * GET /predictions/dashboard
   */
  async getPredictionDashboard() {
    return apiClient.get('/predictions/dashboard');
  }

  /**
   * Get leaderboard
   * GET /predictions/leaderboard
   */
  async getLeaderboard(competitionType = 'overall', limit = 100) {
    return apiClient.get(
      `/predictions/leaderboard?competition_type=${competitionType}&limit=${limit}`
    );
  }

  /**
   * Settle a market (admin)
   * POST /predictions/markets/{marketId}/settle
   */
  async settleMarket(
    marketId: number,
    settlement: { winning_selection: string; settle_all?: boolean }
  ) {
    return apiClient.post(`/predictions/markets/${marketId}/settle`, settlement);
  }

  // ============= Analytics Endpoints =============

  /**
   * Get top correlations
   * GET /api/v1/analytics/top-correlations
   */
  async getTopCorrelations(params?: {
    limit?: number;
    significant_only?: boolean;
    metric_name?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.significant_only !== undefined)
      queryParams.append('significant_only', params.significant_only.toString());
    if (params?.metric_name) queryParams.append('metric_name', params.metric_name);
    const query = queryParams.toString();
    return apiClient.get(`/analytics/top-correlations${query ? `?${query}` : ''}`);
  }

  /**
   * Get correlations by feature
   * GET /api/v1/analytics/correlations/by-feature/{featureName}
   */
  async getCorrelationsByFeature(featureName: string) {
    return apiClient.get(`/analytics/correlations/by-feature/${featureName}`);
  }

  /**
   * Run analysis job
   * POST /api/v1/analytics/run-analysis
   */
  async runAnalysis() {
    return apiClient.post('/analytics/run-analysis', {});
  }

  /**
   * Get analytics stats summary
   * GET /api/v1/analytics/stats/summary
   */
  async getAnalyticsStatsSummary() {
    return apiClient.get('/analytics/stats/summary');
  }

  /**
   * Analytics health check
   * GET /api/v1/analytics/health
   */
  async getAnalyticsHealth() {
    return apiClient.get('/analytics/health');
  }

  // ============= WebSocket Connection Helpers =============

  /**
   * Get WebSocket URL for agents
   */
  getWebSocketUrl(): string {
    return `${config.wsBaseUrl}/ws/agents`;
  }

  /**
   * Get WebSocket URL for replay
   */
  getReplayWebSocketUrl(): string {
    return `${config.wsBaseUrl}/ws/replay`;
  }
}

export const unifiedApi = new UnifiedBackendApi();
export default unifiedApi;
