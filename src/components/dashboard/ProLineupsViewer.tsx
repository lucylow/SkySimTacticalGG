import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Map as MapIcon, 
  Sword, 
  Shield, 
  Target, 
  Users, 
  Copy, 
  ExternalLink,
  ChevronRight,
  Search,
  Zap,
  Clock
} from 'lucide-react';
import { PRO_LINEUPS } from '@/data/proLineups';
import { MapLineups, Lineup } from '@/types/utility';

const ProLineupsViewer: React.FC = () => {
  const [activeMap, setActiveMap] = useState<string>(PRO_LINEUPS[0].mapName);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const currentMap = PRO_LINEUPS.find(m => m.mapName === activeMap) || PRO_LINEUPS[0];

  const handleCopy = (lineup: Lineup) => {
    const text = `[VOICE COMM] ${lineup.name} (${lineup.type}): ${lineup.coords}`;
    navigator.clipboard.writeText(text);
    setCopyStatus(lineup.name);
    setTimeout(() => setCopyStatus(null), 2000);
  };

  const getUsageColor = (usage: string) => {
    const value = parseInt(usage);
    if (value >= 90) return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
    if (value >= 75) return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
  };

  const LineupCard = ({ lineup }: { lineup: Lineup }) => (
    <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-all group">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={getUsageColor(lineup.usage)}>
                {lineup.usage} Usage
              </Badge>
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{lineup.type}</span>
            </div>
            <h4 className="font-bold text-slate-200 group-hover:text-white transition-colors">
              {lineup.name}
            </h4>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0" 
            onClick={() => handleCopy(lineup)}
          >
            <Copy className={`h-4 w-4 ${copyStatus === lineup.name ? 'text-green-500' : 'text-slate-400'}`} />
          </Button>
        </div>
        
        <p className="text-sm text-slate-400 mb-3 line-clamp-2">
          {lineup.description}
        </p>
        
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded text-xs font-mono text-slate-300">
            <Target className="h-3 w-3" />
            {lineup.coords}
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div className="flex -space-x-1.5">
            {lineup.agents.map((agent, i) => (
              <div 
                key={i} 
                className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-400"
                title={agent}
              >
                {agent[0]}
              </div>
            ))}
          </div>
          <Button variant="link" className="h-auto p-0 text-xs text-rose-500 hover:text-rose-400">
            View Image <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-rose-500 fill-rose-500" />
            Pro Player Utility Lineups
          </h2>
          <p className="text-slate-400">Production-ready lineups from VCT 2025 Champions data</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-1 flex">
            {['F1', 'F2', 'F3', 'F4'].map(key => (
              <div key={key} className="px-2 py-1 text-[10px] font-bold text-slate-500 border-r border-slate-800 last:border-0 uppercase">
                {key}
              </div>
            ))}
          </div>
          <Badge className="bg-rose-500/20 text-rose-500 border-rose-500/30">VCT Verified</Badge>
        </div>
      </div>

      <Tabs defaultValue={PRO_LINEUPS[0].mapName} onValueChange={setActiveMap} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="bg-slate-900/60 border border-slate-800 h-12 p-1">
              {PRO_LINEUPS.map(map => (
                <TabsTrigger 
                  key={map.mapName} 
                  value={map.mapName}
                  className="px-4 py-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white transition-all"
                >
                  <MapIcon className="w-4 h-4 mr-2" />
                  {map.mapName}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <TabsContent value={activeMap} className="mt-0 space-y-6 focus-visible:outline-none">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Sword className="w-5 h-5 text-rose-500" />
                  <h3 className="text-lg font-bold text-slate-200">Attack Executions</h3>
                </div>
                <Badge variant="secondary" className="bg-slate-800">{currentMap.attack.length} Lineups</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentMap.attack.map((lineup, idx) => (
                  <LineupCard key={idx} lineup={lineup} />
                ))}
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-2 pt-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-500" />
                  <h3 className="text-lg font-bold text-slate-200">Defense Setups</h3>
                </div>
                <Badge variant="secondary" className="bg-slate-800">{currentMap.defense.length} Lineups</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentMap.defense.map((lineup, idx) => (
                  <LineupCard key={idx} lineup={lineup} />
                ))}
              </div>
            </TabsContent>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/60 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-slate-400">Map Intel: {activeMap}</CardTitle>
                <CardDescription className="text-rose-500 font-medium">{currentMap.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-400">Practice Protocol</span>
                    <Clock className="w-3 h-3 text-slate-500" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Attack Lineups</span>
                      <span className="text-white">3min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Defense One-ways</span>
                      <span className="text-white">3min</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Execute in Custom</span>
                      <span className="text-white">5min</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Priority Tiers</h5>
                  {[
                    { tier: 'Tier 1', maps: 'Ascent A, Bind A, Haven C', color: 'bg-rose-500' },
                    { tier: 'Tier 2', maps: 'Icebox A, Breeze A, Lotus A', color: 'bg-amber-500' }
                  ].map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-1 h-8 ${t.color} rounded-full`} />
                      <div>
                        <div className="text-[10px] font-bold text-slate-500">{t.tier}</div>
                        <div className="text-xs text-slate-300">{t.maps}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2">
                  Enter Practice Range
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-rose-500/5 border-rose-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-rose-500 uppercase">Pro Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Memorize 3 lineups per map for 90% pro utility coverage. Execute perfectly to reach Immortal executes. 🎯
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Tabs>
    </div>
  );
};

export default ProLineupsViewer;
