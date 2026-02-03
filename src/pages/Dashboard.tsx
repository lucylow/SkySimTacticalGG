import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Target,
  Users,
  RefreshCw,
  Radio,
  Sword,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { InsightCard } from '@/components/dashboard/InsightCard';
import { PlayerCard } from '@/components/dashboard/PlayerCard';
import { TacticalOverlay } from '@/components/dashboard/TacticalOverlay';
import { StrategySimulator } from '@/components/dashboard/StrategySimulator';
import { InteractivePlaybook } from '@/components/dashboard/InteractivePlaybook';
import { EsportsDataDisplay } from '@/components/dashboard/EsportsDataDisplay';
import { EsportsPerformanceChart } from '@/components/dashboard/EsportsPerformanceChart';
import { TacticalScoutingReport } from '@/components/dashboard/TacticalScoutingReport';
import { UtilityDashboard } from '@/components/dashboard/UtilityDashboard';
import { DashboardSkeleton } from '@/components/ui/shimmer-skeleton';
import { useDashboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { api } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import type { DashboardData } from '@/types';
import type { LoLPlayer, ValorantPlayer } from '@/types/esports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Dashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [lolPlayers, setLolPlayers] = useState<LoLPlayer[]>([]);
  const [valorantPlayers, setValorantPlayers] = useState<ValorantPlayer[]>([]);
  const [selectedScoutPlayer, setSelectedScoutPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tacticalData, setTacticalData] = useState<any>(null);
  const { setDashboardData: storeSetDashboard } = useAppStore();
  const navigate = useNavigate();

  useDashboardShortcuts(navigate);

  useEffect(() => {
    loadData();
    loadTacticalData();
  }, []);

  const loadTacticalData = async () => {
    const SampleTacticalData = {
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
    setTacticalData(SampleTacticalData);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboard, lPlayers, vPlayers] = await Promise.all([
        api.fetchDashboardData(),
        api.fetchLoLPlayers(),
        api.fetchValorantPlayers(),
      ]);
      setDashboardData(dashboard);
      setLolPlayers(lPlayers);
      setValorantPlayers(vPlayers);
      if (lPlayers.length > 0) setSelectedScoutPlayer(lPlayers[0]);
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

  const combinedLolPool = lolPlayers.flatMap(p => p.stats.champion_pool);
  const combinedValPool = valorantPlayers.flatMap(p => p.stats.agent_pool);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto max-w-7xl p-4 lg:p-8 space-y-8"
    >
      <EsportsDataDisplay />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {dashboardData?.last_update
              ? `Last updated: ${new Date(dashboardData.last_update).toLocaleTimeString()}`
              : 'Real-time multi-game analytics'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="lg" onClick={loadData} className="shadow-sm hover:shadow-md transition-all">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="lg" asChild className="bg-gradient-primary shadow-lg hover:shadow-xl transition-all">
            <Link to="/app/live">
              <Radio className="mr-2 h-4 w-4 animate-pulse" />
              Go Live
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary Metrics Section */}
      <section>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="LoL Win Rate"
            value="72%"
            icon={Sword}
            trend="up"
            trendValue="+3.1%"
            color="primary"
          />
          <StatsCard
            title="VALORANT Win Rate"
            value="65%"
            icon={Trophy}
            trend="up"
            trendValue="+5.2%"
            color="accent"
          />
          <StatsCard
            title="Total Matches"
            value={47}
            subtitle="All games combined"
            icon={Target}
            color="secondary"
          />
          <StatsCard
            title="Active Players"
            value={lolPlayers.length + valorantPlayers.length}
            subtitle="Across all rosters"
            icon={Users}
            color="accent"
          />
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Analytics Area */}
        <div className="lg:col-span-8 space-y-8">
          <div className="rounded-xl border bg-card/50 shadow-sm overflow-hidden">
            <EsportsPerformanceChart 
              lolData={combinedLolPool} 
              valorantData={combinedValPool} 
            />
          </div>

          <Tabs defaultValue="utility" className="w-full">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <TabsList className="bg-muted/50 p-1">
                <TabsTrigger value="utility" className="px-4 py-2">Utility Analytics</TabsTrigger>
                <TabsTrigger value="insights" className="px-4 py-2">AI Insights</TabsTrigger>
                <TabsTrigger value="tactical" className="px-4 py-2">Tactical</TabsTrigger>
                <TabsTrigger value="simulator" className="px-4 py-2">Simulator</TabsTrigger>
                <TabsTrigger value="playbook" className="px-4 py-2">Playbook</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="utility" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <UtilityDashboard />
            </TabsContent>

            <TabsContent value="insights" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <div className="grid gap-4 md:grid-cols-2">
                {dashboardData?.insights.map((insight) => (
                  <InsightCard
                    key={insight.id}
                    insight={insight}
                    onAction={insight.actionable ? () => {} : undefined}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tactical" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              {tacticalData && (
                <TacticalOverlay data={tacticalData} isLive={false} />
              )}
            </TabsContent>

            <TabsContent value="simulator" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <StrategySimulator />
            </TabsContent>

            <TabsContent value="playbook" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
              <InteractivePlaybook />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar Area */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="glass-card shadow-sm border-muted/50">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
              <div>
                <CardTitle className="text-xl font-bold">Featured Players</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Recently scouted talent</p>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {lolPlayers.slice(0, 1).map(p => (
                <PlayerCard 
                  key={p.id} 
                  player={p} 
                  selected={selectedScoutPlayer?.id === p.id}
                  onClick={() => setSelectedScoutPlayer(p)} 
                />
              ))}
              {valorantPlayers.slice(0, 1).map(p => (
                <PlayerCard 
                  key={p.id} 
                  player={p} 
                  selected={selectedScoutPlayer?.id === p.id}
                  onClick={() => setSelectedScoutPlayer(p)} 
                />
              ))}
            </CardContent>
          </Card>
          
          <div className="sticky top-24">
            <TacticalScoutingReport 
              playerData={selectedScoutPlayer} 
              game={selectedScoutPlayer?.game || 'lol'} 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

