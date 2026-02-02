import { create } from 'zustand';
import type { DashboardData, Player, Match, Insight } from '@/types';

interface AppState {
  // Dashboard
  dashboardData: DashboardData | null;
  setDashboardData: (data: DashboardData) => void;

  // Players
  players: Player[];
  selectedPlayer: Player | null;
  setPlayers: (players: Player[]) => void;
  setSelectedPlayer: (player: Player | null) => void;

  // Matches
  matches: Match[];
  selectedMatch: Match | null;
  setMatches: (matches: Match[]) => void;
  setSelectedMatch: (match: Match | null) => void;

  // Live
  isLive: boolean;
  setIsLive: (isLive: boolean) => void;

  // Insights
  insights: Insight[];
  addInsight: (insight: Insight) => void;
  clearInsights: () => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Dashboard
  dashboardData: null,
  setDashboardData: (data) => set({ dashboardData: data }),

  // Players
  players: [],
  selectedPlayer: null,
  setPlayers: (players) => set({ players }),
  setSelectedPlayer: (player) => set({ selectedPlayer: player }),

  // Matches
  matches: [],
  selectedMatch: null,
  setMatches: (matches) => set({ matches }),
  setSelectedMatch: (match) => set({ selectedMatch: match }),

  // Live
  isLive: false,
  setIsLive: (isLive) => set({ isLive }),

  // Insights
  insights: [],
  addInsight: (insight) =>
    set((state) => ({ insights: [insight, ...state.insights].slice(0, 50) })),
  clearInsights: () => set({ insights: [] }),

  // UI State
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Loading
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
