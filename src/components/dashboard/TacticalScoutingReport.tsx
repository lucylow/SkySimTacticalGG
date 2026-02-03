import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Target, Zap, TrendingUp, AlertTriangle } from 'lucide-react';

interface ScoutingReportProps {
  playerData: any;
  game: 'lol' | 'valorant';
}

export const TacticalScoutingReport: React.FC<ScoutingReportProps> = ({ playerData, game }) => {
  if (!playerData) return null;

  return (
    <Card className="glass-card h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Tactical Scouting: {playerData.name}
          </CardTitle>
          <Badge variant="secondary" className="uppercase">{game}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="patterns">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
            <TabsTrigger value="tendencies">Tendencies</TabsTrigger>
            <TabsTrigger value="counters">Counters</TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-4">
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <h5 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-accent" />
                Aggression Curve
              </h5>
              <p className="text-xs text-muted-foreground">
                {game === 'lol' 
                  ? "High early game pressure. Tends to roam after first item spike (8-12 min window)."
                  : "Explosive entry style. 65% success rate on first contact during pistol rounds."}
              </p>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg border border-border">
              <h5 className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Reaction Timing
              </h5>
              <p className="text-xs text-muted-foreground">
                Average reaction to fog-of-war events: <span className="text-foreground font-mono">185ms</span>. 
                Exceptional at dodging skillshots/utility.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="tendencies" className="space-y-3">
            <div className="flex items-center justify-between p-2 border-b border-border">
              <span className="text-sm">Risk Tolerance</span>
              <Badge variant="outline" className="text-red-400">High</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border-b border-border">
              <span className="text-sm">Objective Focus</span>
              <Badge variant="outline" className="text-blue-400">Moderate</Badge>
            </div>
            <div className="flex items-center justify-between p-2 border-b border-border">
              <span className="text-sm">Team Synergy</span>
              <Badge variant="outline" className="text-green-400">Elite</Badge>
            </div>
          </TabsContent>

          <TabsContent value="counters" className="space-y-4">
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <h5 className="text-sm font-semibold flex items-center gap-2 text-destructive mb-1">
                <AlertTriangle className="h-4 w-4" />
                Critical Weakness
              </h5>
              <p className="text-xs">
                {game === 'lol'
                  ? "Vulnerable to deep jungle invades when lane state is neutral."
                  : "Over-rotates when site A utility is depleted early."}
              </p>
            </div>
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <h5 className="text-sm font-semibold flex items-center gap-2 text-primary mb-1">
                <Shield className="h-4 w-4" />
                Optimal Counter-Play
              </h5>
              <p className="text-xs">
                Force long-range engagements and avoid 1v1 isolated duels in narrow corridors.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
