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
      className="space-y-6"
    >
      <EsportsDataDisplay />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Esports AI Coach Dashboard</h1>
          <p className="text-muted-foreground">
            {dashboardData?.last_update
              ? `Last updated: ${new Date(dashboardData.last_update).toLocaleTimeString()}`
              : 'Real-time multi-game analytics'}
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
          subtitle="All games"
          icon={Target}
          color="secondary"
        />
        <StatsCard
          title="Total Players"
          value={lolPlayers.length + valorantPlayers.length}
          subtitle="Across games"
          icon={Users}
          color="accent"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EsportsPerformanceChart 
            lolData={combinedLolPool} 
            valorantData={combinedValPool} 
          />
        </div>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Featured Players</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
          
          <TacticalScoutingReport 
            playerData={selectedScoutPlayer} 
            game={selectedScoutPlayer?.game || 'lol'} 
          />
        </div>
      </div>

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
                Connecting micro-mistakes to macro outcomes in LoL and VALORANT
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
