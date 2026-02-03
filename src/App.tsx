import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from 'react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { MainLayout } from "./components/layout/MainLayout";
import { Dashboard } from "./pages/Dashboard";
import { MatchAnalysis } from "./pages/MatchAnalysis";
import { PlayerDevelopment } from "./pages/PlayerDevelopment";
import { LiveCoach } from "./pages/LiveCoach";
import { MotionStudio } from "./pages/MotionStudio";
import { Insights } from "./pages/Insights";
import { MacroReviewPage as MacroReview } from "./pages/MacroReview";
import AIPlayground from "./pages/AIPlayground";
import { SkySimTacticalGG } from "./pages/SkySimTacticalGG.tsx";
import { HumanReview } from "./pages/HumanReview";
import { GridDashboard } from "./pages/GridDashboard";
import { Predictions } from "./pages/Predictions";
import { CoachingInsights } from "./pages/CoachingInsights";
import ValorantMatches from "./pages/ValorantMatches";
import LolMatches from "./pages/LolMatches";

import ResponsiveLayout from './components/ResponsiveLayout';
import LoadingOverlay from './components/LoadingOverlay';
import EnhancedErrorBoundary from './components/EnhancedErrorBoundary';
import NotificationSystem from './components/NotificationSystem';

const NewDashboard = lazy(() => import('./pages/new/Dashboard').then(m => ({ default: m.Dashboard })));
const NewMatchAnalysis = lazy(() => import('./pages/new/MatchAnalysis').then(m => ({ default: m.MatchAnalysis })));
const NewPlayerDevelopment = lazy(() => import('./pages/new/PlayerDevelopment').then(m => ({ default: m.PlayerDevelopment })));
const AgentConsole = lazy(() => import('./pages/new/AgentConsole').then(m => ({ default: m.AgentConsole })));

const queryClient = new QueryClient();

const App = () => {
  const location = useLocation();
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <EnhancedErrorBoundary key={location.pathname} fallback={<div>Something went wrong. Try reload.</div>}>
        <Routes>
          <Route path="/" element={<Index />} />
          
          {/* New Modern Routes */}
          <Route path="/new" element={<ResponsiveLayout><Suspense fallback={<LoadingOverlay />}><NewDashboard /></Suspense></ResponsiveLayout>} />
          <Route path="/agent" element={<ResponsiveLayout><Suspense fallback={<LoadingOverlay />}><AgentConsole /></Suspense></ResponsiveLayout>} />
          <Route path="/new/match/:matchId" element={<ResponsiveLayout><Suspense fallback={<LoadingOverlay />}><NewMatchAnalysis /></Suspense></ResponsiveLayout>} />
          <Route path="/new/player/:playerId" element={<ResponsiveLayout><Suspense fallback={<LoadingOverlay />}><NewPlayerDevelopment /></Suspense></ResponsiveLayout>} />

          {/* App routes with MainLayout */}
          <Route path="/app" element={<MainLayout><Dashboard /></MainLayout>} />
          <Route path="/app/match" element={<MainLayout><MatchAnalysis /></MainLayout>} />
          <Route path="/app/match/:matchId" element={<MainLayout><MatchAnalysis /></MainLayout>} />
          <Route path="/app/player" element={<MainLayout><PlayerDevelopment /></MainLayout>} />
          <Route path="/app/player/:playerId" element={<MainLayout><PlayerDevelopment /></MainLayout>} />
          <Route path="/app/live" element={<MainLayout><LiveCoach /></MainLayout>} />
          <Route path="/app/motion" element={<MainLayout><MotionStudio /></MainLayout>} />
          <Route path="/app/insights" element={<MainLayout><Insights /></MainLayout>} />
          <Route path="/app/review" element={<MainLayout><MacroReview /></MainLayout>} />
          <Route path="/app/review/:matchId" element={<MainLayout><MacroReview /></MainLayout>} />
          <Route path="/app/ai-playground" element={<MainLayout><AIPlayground /></MainLayout>} />
          <Route path="/app/assistant-coach" element={<MainLayout><SkySimTacticalGG /></MainLayout>} />
          <Route path="/app/assistant-coach/:matchId" element={<MainLayout><SkySimTacticalGG /></MainLayout>} />
          <Route path="/app/human-review" element={<MainLayout><HumanReview /></MainLayout>} />
          <Route path="/app/grid" element={<MainLayout><GridDashboard /></MainLayout>} />
          <Route path="/app/predictions" element={<MainLayout><Predictions /></MainLayout>} />
          <Route path="/app/coaching-insights" element={<MainLayout><CoachingInsights /></MainLayout>} />
          <Route path="/app/valorant" element={<MainLayout><ValorantMatches /></MainLayout>} />
          <Route path="/app/lol" element={<MainLayout><LolMatches /></MainLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <NotificationSystem />
      </EnhancedErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);
}

export default App;
