import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Target, Coins, TrendingUp, Map as MapIcon, Users } from 'lucide-react';
import type { UtilityDashboardData } from '@/types/utility';

const mockData: UtilityDashboardData = {
  valorant: {
    coreKpis: [
      { name: 'Util Hit Rate', immortalPlus: '68%', radiant: '74%', pro: '82%', soloQueue: '47%' },
      { name: 'Util/Kill Conversion', immortalPlus: '42%', radiant: '51%', pro: '63%', soloQueue: '29%' },
      { name: 'Entry Success Post-Util', immortalPlus: '58%', radiant: '67%', pro: '78%', soloQueue: '41%' },
      { name: 'Smoke Coverage Efficiency', immortalPlus: '76%', radiant: '84%', pro: '91%', soloQueue: '53%' },
      { name: 'Flash Trade Rate', immortalPlus: '62%', radiant: '71%', pro: '85%', soloQueue: '38%' },
    ],
    roleBenchmarks: [
      {
        role: 'CONTROLLER',
        metrics: [
          { label: 'Smoke Timing Accuracy', value: '84%', subtext: '(0:28-0:32 window)' },
          { label: 'Vision Denial Minutes', value: '2.8/round', subtext: '(Pro: 3.9)' },
          { label: 'Post-Plant Smoke Success', value: '71%' },
        ],
      },
      {
        role: 'DUELIST',
        metrics: [
          { label: 'Self-Flash Usage', value: '78%', subtext: '(Pro: 94%)' },
          { label: 'Entry Frag After Flash', value: '49%', subtext: '(Pro: 67%)' },
          { label: 'Damage Util Efficiency', value: '61%' },
        ],
      },
      {
        role: 'SENTINEL',
        metrics: [
          { label: 'One-Way Success', value: '88%', subtext: '(Pro: 96%)' },
          { label: 'Retake Utility Impact', value: '+24%', subtext: 'win probability' },
        ],
      },
      {
        role: 'INITIATOR',
        metrics: [
          { label: 'Sova Dart → Kill', value: '61%', subtext: 'Entry kill conversion' },
          { label: 'KAY/O Flash Trade', value: '81%', subtext: 'Traded rate' },
        ],
      },
    ],
    mapDashboards: [
      {
        mapName: 'ASCENT',
        metrics: [
          { label: 'Attack Util Success', value: '78%' },
          { label: 'Defense One-Way Rate', value: '94%' },
          { label: 'Avg Util/Round', value: '8.2' },
        ],
      },
      {
        mapName: 'BIND',
        metrics: [
          { label: 'Smoke Coverage', value: '91%' },
          { label: 'Recon → Kill', value: '67%' },
          { label: 'Rotate Block', value: '84%' },
        ],
      },
    ],
  },
  lol: {
    summonerSpellEfficiency: [
      { name: 'Flash Survival', soloQueue: '71%', lckPro: '84%', diamondPlus: '78%', challenger: '82%' },
      { name: 'TP Tower Trade', soloQueue: '43%', lckPro: '78%', diamondPlus: '61%', challenger: '73%' },
      { name: 'Ignite Kill Rate', soloQueue: '52%', lckPro: '71%', diamondPlus: '59%', challenger: '67%' },
      { name: 'Smite Steal Rate', soloQueue: '29%', lckPro: '56%', diamondPlus: '41%', challenger: '52%' },
    ],
    objectiveSuccess: [
      { name: 'DRAGON SECURE RATE', soloQueue: '48% (Individual smite)', lckPro: '82% (Team vision + CC chain)' },
      { name: 'HERALD TOWER TRADE', soloQueue: '39% (Split TP)', lckPro: '76% (5v4 siege setup)' },
      { name: 'BARON STEAL SUCCESS', soloQueue: '22% (Hero smite)', lckPro: '48% (Vision trap + pick)' },
    ],
    roleBenchmarks: [
      {
        role: 'JUNGLE',
        metrics: [
          { label: 'Smite Timing Precision (Dragon)', value: '89%', subtext: '(LCK)' },
          { label: 'Gank CC Chain Kill Rate (Lv 6-11)', value: '91%' },
        ],
      },
      {
        role: 'SUPPORT',
        metrics: [
          { label: 'Engage Success (5-10min)', value: '84%', subtext: '(Herald setup)' },
          { label: 'Peel Priority (Exhaust)', value: '92%', subtext: 'DPS reduction' },
        ],
      },
    ],
  },
  economy: {
    valorant: [
      { label: 'Pistol Round (1 util/agent)', value: '+19% Win Rate' },
      { label: 'Full Buy (Full util)', value: '+28% Win Rate' },
      { label: 'Controller Eco Saved Util', value: '+24% next round win' },
    ],
    lol: [
      { label: '5:00 Boots Rush', value: '+0.8 CS/min' },
      { label: '8:00 Herald TP', value: '+1.2 towers/game' },
      { label: '12:00 Spike Back', value: '+18% kill participation' },
    ],
  },
  gapAnalysis: [
    { metric: 'Timing Precision', soloQueue: '68%', pro: '91%', gap: '+23%' },
    { metric: 'Trade Conversion', soloQueue: '41%', pro: '78%', gap: '+37%' },
    { metric: 'Economic Utility', soloQueue: '53%', pro: '87%', gap: '+34%' },
  ],
  trainingTargets: [
    {
      metric: 'Util Hit Rate',
      current: '47%',
      target: '82%',
      weeklyGains: ['Week 1: +12% hit rate', 'Week 2: +18% trade rate', 'Week 3: +22% entry success'],
    },
  ],
};

export const UtilityDashboard: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Utility Performance Dashboard</h2>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Pro-Level Analytics (VCT & LCK 2025)
        </Badge>
      </div>

      <Tabs defaultValue="valorant" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="valorant">VALORANT</TabsTrigger>
          <TabsTrigger value="lol">League of Legends</TabsTrigger>
          <TabsTrigger value="economy">Utility Economy</TabsTrigger>
          <TabsTrigger value="analysis">Gap Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="valorant" className="space-y-6 mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                VALORANT Utility KPIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead>Solo Queue Avg</TableHead>
                    <TableHead>Immortal+</TableHead>
                    <TableHead>Radiant</TableHead>
                    <TableHead className="text-primary font-bold">Pro (VCT)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockData.valorant.coreKpis.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.soloQueue}</TableCell>
                      <TableCell>{m.immortalPlus}</TableCell>
                      <TableCell>{m.radiant}</TableCell>
                      <TableCell className="text-primary font-bold">{m.pro}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {mockData.valorant.roleBenchmarks.map((role) => (
              <Card key={role.role} className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    {role.role} DASHBOARD
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {role.metrics.map((m) => (
                    <div key={m.label} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">{m.label}:</span>
                        <span className="font-bold text-primary">{m.value}</span>
                      </div>
                      {m.subtext && <p className="text-[10px] text-muted-foreground">{m.subtext}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {mockData.valorant.mapDashboards.map((map) => (
              <Card key={map.mapName} className="glass-card border-l-4 border-l-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2">
                    <MapIcon className="h-4 w-4" />
                    {map.mapName} Utility Data
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  {map.metrics.map((m) => (
                    <div key={m.label} className="text-center">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-lg font-bold">{m.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lol" className="space-y-6 mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                LoL Summoner Spell Efficiency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Spell</TableHead>
                    <TableHead>Solo Queue</TableHead>
                    <TableHead>Diamond+</TableHead>
                    <TableHead>Challenger</TableHead>
                    <TableHead className="text-accent font-bold">LCK Pro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockData.lol.summonerSpellEfficiency.map((m) => (
                    <TableRow key={m.name}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-muted-foreground">{m.soloQueue}</TableCell>
                      <TableCell>{m.diamondPlus}</TableCell>
                      <TableCell>{m.challenger}</TableCell>
                      <TableCell className="text-accent font-bold">{m.lckPro}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {mockData.lol.objectiveSuccess.map((obj) => (
              <Card key={obj.name} className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold uppercase text-muted-foreground">
                    {obj.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Solo Queue</p>
                    <p className="font-semibold">{obj.soloQueue}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-accent uppercase font-bold">LCK Pro</p>
                    <p className="font-bold text-accent">{obj.lckPro}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {mockData.lol.roleBenchmarks.map((role) => (
              <Card key={role.role} className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold uppercase">{role.role} MASTERY</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  {role.metrics.map((m) => (
                    <div key={m.label} className="space-y-1">
                      <p className="text-xs text-muted-foreground">{m.label}</p>
                      <p className="text-2xl font-bold text-accent">{m.value}</p>
                      {m.subtext && <p className="text-[10px] text-muted-foreground">{m.subtext}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="economy" className="space-y-6 mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="glass-card border-t-4 border-t-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  VALORANT Credit Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockData.economy.valorant.map((e) => (
                  <div key={e.label} className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                    <span className="text-sm font-medium">{e.label}</span>
                    <span className="text-lg font-bold text-primary">{e.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="glass-card border-t-4 border-t-accent">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-accent" />
                  League Gold Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mockData.economy.lol.map((e) => (
                  <div key={e.label} className="flex justify-between items-center p-3 bg-accent/5 rounded-lg">
                    <span className="text-sm font-medium">{e.label}</span>
                    <span className="text-lg font-bold text-accent">{e.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6 mt-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Pro vs Solo Queue Gap Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {mockData.gapAnalysis.map((gap) => (
                  <div key={gap.metric} className="p-4 rounded-xl bg-secondary/20 space-y-3">
                    <h4 className="font-bold text-sm text-muted-foreground uppercase">{gap.metric}</h4>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Solo Queue</p>
                        <p className="text-xl font-bold">{gap.soloQueue}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-primary">Pro Play</p>
                        <p className="text-xl font-bold text-primary">{gap.pro}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <p className="text-center text-xs font-bold text-accent">GAP: {gap.gap}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-2 border-primary/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Target className="h-5 w-5" />
                Live Training Dashboard Targets
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mockData.trainingTargets.map((target) => (
                <div key={target.metric} className="space-y-6">
                  <div className="flex items-center justify-center gap-12 py-4">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground uppercase">Current</p>
                      <p className="text-4xl font-bold opacity-50">{target.current}</p>
                    </div>
                    <div className="h-12 w-[2px] bg-white/10 rotate-12" />
                    <div className="text-center">
                      <p className="text-xs text-primary uppercase font-bold">Immortal+ Target</p>
                      <p className="text-5xl font-extrabold text-primary">{target.target}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {target.weeklyGains.map((gain, i) => (
                      <div key={i} className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-center font-bold text-primary">
                        {gain}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
        <p className="text-sm font-medium">
          <span className="text-primary font-bold">Dashboard Reality:</span> Utility = 28% of pro win conditions. Track these metrics → Execute pro patterns → Close 15% WR gap. 🎯
        </p>
      </div>
    </div>
  );
};
