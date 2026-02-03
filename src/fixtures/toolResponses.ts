// src/mocks/toolResponses.ts - Mock tool outputs for agent demos
import type { Product } from './generator';

let toolCounter = 0;
const genToolId = () => `tool-${++toolCounter}-${Date.now().toString(36)}`;

export const searchTool = (q: string) => ({
  id: genToolId(),
  query: q,
  hits: [
    { id: "doc1", title: "Improving product previews", snippet: "Use short videos and lazy load for better UX..." },
    { id: "doc2", title: "Hero microcopy best practices", snippet: "Short, benefit-centered headline with clear CTA..." },
    { id: "doc3", title: "Conversion optimization guide", snippet: "A/B test your checkout flow for maximum impact..." },
  ],
  totalResults: 127,
  ts: new Date().toISOString(),
});

export const analyzeCatalogTool = (products: Product[], args: { top?: number } = {}) => {
  const categories = ["Electronics", "Home", "Gaming", "Accessories"];
  const topCategories = categories.slice(0, Math.min(args.top || 3, categories.length));
  const prices = products.map(p => p.price);
  const avgPrice = prices.length > 0 ? +(prices.reduce((s, p) => s + p, 0) / prices.length).toFixed(2) : 0;
  
  return {
    id: genToolId(),
    topCategories,
    avgPrice,
    stats: {
      totalProducts: products.length,
      minPrice: Math.min(...prices, 0),
      maxPrice: Math.max(...prices, 0),
      stdDev: +(Math.random() * 120).toFixed(2),
      inStockRate: +(products.filter(p => p.inStock).length / Math.max(1, products.length) * 100).toFixed(1),
    },
    categoryBreakdown: categories.map(cat => ({
      name: cat,
      count: products.filter(p => p.category === cat).length,
      avgRating: +(Math.random() * 2 + 3).toFixed(1),
    })),
    ts: new Date().toISOString(),
  };
};

export const calculatorTool = (expr: string) => {
  try {
    // Simple safe evaluation for demo
    const sanitized = expr.replace(/[^0-9+\-*/().%\s]/g, '');
    const value = Function(`"use strict"; return (${sanitized})`)();
    return { id: genToolId(), expr, value, ok: true, ts: new Date().toISOString() };
  } catch (err) {
    return { id: genToolId(), expr, ok: false, error: String(err), ts: new Date().toISOString() };
  }
};

export const generateReportTool = (type: string) => ({
  id: genToolId(),
  type,
  sections: [
    { title: "Executive Summary", content: "Key metrics improved by 15% this quarter..." },
    { title: "Performance Analysis", content: "Team synergy scores at all-time high..." },
    { title: "Recommendations", content: "Focus on rotation drills and communication..." },
  ],
  charts: ["performance_trend", "category_breakdown", "user_engagement"],
  generatedAt: new Date().toISOString(),
});

export const comparePlayersTool = (playerIds: string[]) => ({
  id: genToolId(),
  players: playerIds.map((id, i) => ({
    id,
    name: `Player ${i + 1}`,
    stats: {
      kd: +(1 + Math.random()).toFixed(2),
      winRate: +(45 + Math.random() * 25).toFixed(1),
      accuracy: +(55 + Math.random() * 20).toFixed(1),
      gamesPlayed: Math.floor(100 + Math.random() * 400),
    },
    rank: i + 1,
  })),
  comparison: {
    bestKD: playerIds[0],
    bestWinRate: playerIds[Math.floor(Math.random() * playerIds.length)],
    mostExperienced: playerIds[playerIds.length - 1],
  },
  ts: new Date().toISOString(),
});

// Tool registry for the Toolbox component
export const toolRegistry = {
  search_database: { fn: searchTool, description: "Search player and match data", icon: "🔍" },
  analyze_catalog: { fn: analyzeCatalogTool, description: "Deep catalog analysis", icon: "📊" },
  calculate_metrics: { fn: calculatorTool, description: "Calculate expressions", icon: "🧮" },
  generate_report: { fn: generateReportTool, description: "Generate detailed reports", icon: "📄" },
  compare_players: { fn: comparePlayersTool, description: "Compare player statistics", icon: "⚖️" },
};
