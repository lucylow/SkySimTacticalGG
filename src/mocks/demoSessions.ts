// src/mocks/demoSessions.ts - Demo session helpers
import { DEMO, type AgentSession } from './generator';

/**
 * Get all demo sessions
 */
export const getAllSessions = (): AgentSession[] => DEMO.sessions;

/**
 * Get a session by ID
 */
export const getSessionById = (id: string): AgentSession | undefined => 
  DEMO.sessions.find(s => s.id === id);

/**
 * Get sessions by user ID
 */
export const getSessionsByUser = (userId: string): AgentSession[] => 
  DEMO.sessions.filter(s => s.userId === userId);

/**
 * Get sessions by status
 */
export const getSessionsByStatus = (status: AgentSession["status"]): AgentSession[] => 
  DEMO.sessions.filter(s => s.status === status);

/**
 * Get the first sample session for quick demos
 */
export const sampleSession = DEMO.sessions[0];

/**
 * Get all products from demo data
 */
export const getAllProducts = () => DEMO.products;

/**
 * Get all users from demo data
 */
export const getAllUsers = () => DEMO.users;

/**
 * Get demo metadata
 */
export const getDemoMeta = () => ({
  seed: DEMO.seed,
  generatedAt: DEMO.generatedAt,
  counts: {
    products: DEMO.products.length,
    users: DEMO.users.length,
    sessions: DEMO.sessions.length,
  },
});

/**
 * Search products by name or category
 */
export const searchProducts = (query: string) => {
  const q = query.toLowerCase();
  return DEMO.products.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.category.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
};

/**
 * Get products by category
 */
export const getProductsByCategory = (category: string) => 
  DEMO.products.filter(p => p.category.toLowerCase() === category.toLowerCase());

/**
 * Get top products by rating
 */
export const getTopProducts = (limit = 10) => 
  [...DEMO.products].sort((a, b) => b.rating - a.rating).slice(0, limit);

/**
 * Get recent sessions (last 24 hours simulated)
 */
export const getRecentSessions = (limit = 5) => 
  [...DEMO.sessions]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
