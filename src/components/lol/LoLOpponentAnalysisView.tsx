import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Target, 
  Eye, 
  ShieldAlert, 
  Map as MapIcon, 
  AlertCircle,
  Clock,
  Sword,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { LoLOpponentAnalysisOutput } from '@/types/lolAgents';

interface LoLOpponentAnalysisViewProps {
  analysis: LoLOpponentAnalysisOutput;
}

export const LoLOpponentAnalysisView: React.FC<LoLOpponentAnalysisViewProps> = ({ analysis }) => {
  const { opponent_profile, game_plan, lane_behavior_read, map_tendencies, mid_game_read, mistakes_to_exploit } = analysis;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Opponent Analysis: {opponent_profile.championName}</h2>
          <p className="text-muted-foreground">10-Step Player-Friendly Framework</p>
        </div>
        <Badge variant="outline" className="text-lg py-1 px-3">
          {opponent_profile.archetype}
        </Badge>
      </div>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5" />
            Step 10: One-Line Game Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold italic">"{game_plan}"</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Step 2: Power Windows */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Step 2: Power Windows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {opponent_profile.powerWindows.map((window, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span>{window.phase} ({window.timing})</span>
                  <Badge variant={window.danger_level > 0.8 ? "destructive" : "secondary"}>
                    {Math.round(window.danger_level * 100)}% Danger
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Key Ability */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              Step 3: Key Ability to Respect
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              <div className="bg-red-500/10 p-2 rounded text-red-500 font-bold text-lg w-10 h-10 flex items-center justify-center border border-red-500/20">
                {opponent_profile.keyAbility.key}
              </div>
              <div>
                <p className="font-semibold text-sm">{opponent_profile.keyAbility.name}</p>
                <p className="text-xs text-muted-foreground">{opponent_profile.keyAbility.impact}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4: Lane Behavior */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Step 4: Lane Behavior Read
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{lane_behavior_read}</p>
          </CardContent>
        </Card>

        {/* Step 6: Item Spikes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sword className="w-4 h-4 text-purple-500" />
              Step 6: Item Spikes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {opponent_profile.itemSpikes.map((item, i) => (
                <Badge key={i} variant="outline" className="bg-purple-500/5">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Map & Roams</TabsTrigger>
          <TabsTrigger value="midgame">Mid-Game Reads</TabsTrigger>
          <TabsTrigger value="mistakes">Mistakes to Exploit</TabsTrigger>
        </TabsList>
        <TabsContent value="map" className="p-4 border rounded-md mt-2">
          <div className="flex items-start gap-3">
            <MapIcon className="w-5 h-5 text-green-500 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Step 7: Map Tendencies</h4>
              <p className="text-sm text-muted-foreground">{map_tendencies}</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="midgame" className="p-4 border rounded-md mt-2">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-5 h-5 text-indigo-500 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Step 8: Mid-Game Reads</h4>
              <p className="text-sm text-muted-foreground">{mid_game_read}</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="mistakes" className="p-4 border rounded-md mt-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-1" />
            <div>
              <h4 className="font-semibold mb-1">Step 9: Common Mistakes</h4>
              <ul className="list-disc pl-5 space-y-1">
                {mistakes_to_exploit.map((mistake, i) => (
                  <li key={i} className="text-sm text-muted-foreground">{mistake}</li>
                ))}
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Coach's Summary</span>
        </div>
        <p className="text-sm italic text-muted-foreground">
          "Don't fight them where they're strong. Respect the power spikes and exploit the vision gaps. You're not trying to out-mechanic them; you're removing their win condition."
        </p>
      </div>
    </div>
  );
};
