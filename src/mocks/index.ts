// src/mocks/index.ts - Central export for all mock data

// Core generators and data
export { DEMO, generateProducts, generateUsers, generateAgentSession, generateDemoPayload } from './generator';
export type { Product, UserProfile, ConversationTurn, AgentSession } from './generator';

// SSE replay events
export { sseReplayEvents, extendedReplayEvents } from './sseReplayEvents';

// Tool responses
export { 
  searchTool, 
  analyzeCatalogTool, 
  calculatorTool, 
  generateReportTool, 
  comparePlayersTool,
  toolRegistry 
} from './toolResponses';

// Sample prompts
export { samplePrompts, getPromptsByCategory, getRandomPrompt } from './samplePrompts';
export type { SamplePrompt } from './samplePrompts';

// Analytics fixtures
export { analyticsSnapshot, performanceMetrics, agentUsageMetrics } from './analyticsFixtures';

// Replay utilities
export { playReplay, replaySession, createControllableReplay } from './replaySessionPlayer';
export type { ReplayOptions } from './replaySessionPlayer';

// UI fixtures
export { 
  microcopySuggestions, 
  heroVariants, 
  ctaVariants, 
  errorMessages, 
  loadingStates,
  accessibilityLabels,
  demoScenarios,
  keyboardShortcuts 
} from './uiFixtures';

// Demo session helpers
export {
  getAllSessions,
  getSessionById,
  getSessionsByUser,
  getSessionsByStatus,
  sampleSession,
  getAllProducts,
  getAllUsers,
  getDemoMeta,
  searchProducts,
  getProductsByCategory,
  getTopProducts,
  getRecentSessions,
} from './demoSessions';

// Backend API mocks (GRID, HY-Motion, Micro-Macro Analytics)
export {
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
} from './backendMocks';
