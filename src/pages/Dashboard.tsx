import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Clock,
  Users,
  RefreshCw,
  Radio,
  ChevronRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { PerformanceChart } from '@/components/dashboard/PerformanceChart';
import { PlayerCard } from '@/components/dashboard/PlayerCard';
import { TacticalOverlay } from '@/components/dashboard/TacticalOverlay';
import { StrategySimulator } from '@/components/dashboard/StrategySimulator';
import { InteractivePlaybook } from '@/components/dashboard/InteractivePlaybook';
import { DashboardSkeleton } from '@/components/ui/shimmer-skeleton';
import { useDashboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { api } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import type { DashboardData, Player } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [tacticalData, setTacticalData] = useState<any>(null);
  const { setDashboardData: storeSetDashboard } = useAppStore();
  const navigate = useNavigate();

  // Keyboard shortcuts for navigation
  useDashboardShortcuts(navigate);

  useEffect(() => {
    loadData();
    loadTacticalData();
  }, []);

  const loadTacticalData = async () => {
    // Load real-time tactical overlay data
    // In production, this would come from live match data
    const mockTacticalData = {
      current_phase: 'mid_round',
      team_coordination: 0.72,
      key_events: [
        {
          timestamp: Date.now() - 5000,
          type: 'ability',
          description: 'Smoke deployed on A site',
          impact: 'high' as const,
        },
        {
          timestamp: Date.now() - 3000,
          type: 'kill',
          description: 'Entry frag successful',
          impact: 'high' as const,
        },
      ],
      predicted_actions: [
        { action: 'Execute on A site', confidence: 0.8, player_id: 'p1' },
        { action: 'Flash support', confidence: 0.7, player_id: 'p2' },
      ],
      alerts: [],
    };
    setTacticalData(mockTacticalData);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboard, playerList] = await Promise.all([
        api.fetchDashboardData(),
        api.fetchPlayerList(),
      ]);
      setDashboardData(dashboard);
      setPlayers(playerList);
      storeSetDashboard(dashboard);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, Coach</h1>
          <p className="text-muted-foreground">
            {dashboardData?.last_update
              ? `Last updated: ${new Date(dashboardData.last_update).toLocaleTimeString()}`
              : 'Real-time analytics dashboard'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button asChild>
            <Link to="/app/live">
              <Radio className="mr-2 h-4 w-4" />
              Go Live
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Win Rate"
          value={`${dashboardData?.team_stats.win_rate || 0}%`}
          icon={Trophy}
          trend="up"
          trendValue="+5.2%"
          color="accent"
        />
        <StatsCard
          title="Avg Round Time"
          value={`${dashboardData?.team_stats.avg_round_time || 0}s`}
          icon={Clock}
          trend="down"
          trendValue="-3s"
          color="secondary"
        />
        <StatsCard
          title="Total Matches"
          value="47"
          subtitle="This month"
          icon={Target}
          color="primary"
        />
        <StatsCard
          title="Active Players"
          value={players.length}
          subtitle="In roster"
          icon={Users}
          color="accent"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Performance Chart */}
        <div className="lg:col-span-2">
          <PerformanceChart
            data={dashboardData?.team_stats.map_performance || []}
            title="Win Rate by Map"
          />
        </div>

        {/* Team Roster */}
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Team Roster</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/app/player">
                View All
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {players.slice(0, 3).map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analysis Section */}
      <Tabs defaultValue="insights" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="tactical">Tactical Overlay</TabsTrigger>
          <TabsTrigger value="simulator">Strategy Simulator</TabsTrigger>
          <TabsTrigger value="playbook">Playbook</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="gradient-text">AI Insights & Recommendations</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Powered by GRID data analysis - Connecting micro-mistakes to macro outcomes
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {dashboardData?.insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onAction={insight.actionable ? () => {} : undefined}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tactical" className="mt-4">
          {tacticalData && (
            <TacticalOverlay data={tacticalData} isLive={false} />
          )}
        </TabsContent>

        <TabsContent value="simulator" className="mt-4">
          <StrategySimulator />
        </TabsContent>

        <TabsContent value="playbook" className="mt-4">
          <InteractivePlaybook />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};
