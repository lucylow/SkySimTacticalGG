import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, Target, Coins, TrendingUp, Map as MapIcon, Users, AlertTriangle, CheckCircle2, XCircle, Clock, BarChart3, ChevronRight } from 'lucide-react';
import type { UtilityDashboardData } from '@/types/utility';
import ProLineupsViewer from '@/components/dashboard/ProLineupsViewer';

const SampleData: UtilityDashboardData = {
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
    mistakes: {
      topMistakes: [
        {
          id: 1,
          title: "FLASHING YOUR TEAM",
          frequency: "62%",
          wrong: "Look at ally → Flash",
          right: "Flash YOURSELF into position",
          impact: "-28% first blood chance",
          fix: "Crosshair on enemy angle → Flash → Entry",
          category: "CRITICAL",
        },
        {
          id: 2,
          title: "SMOKING YOUR OWN ENTRY",
          frequency: "47%",
          wrong: "Smoke A main → Can't see entry",
          right: "Smoke ENEMY vision (default holds)",
          impact: "-34% site take rate",
          rule: "Smoke blocks enemy crosshair, not yours",
          category: "CRITICAL",
        },
        {
          id: 3,
          title: "SPAMMING UTILITY EARLY",
          frequency: "53%",
          wrong: "0:15 all utility gone",
          right: "Save 50% util for post-plant",
          impact: "-41% post-plant hold",
          pattern: "0:30 entry package → 1:10 post-plant",
          category: "CRITICAL",
        },
        {
          id: 4,
          title: "ONE-WAY FLASHES ONLY",
          frequency: "39%",
          wrong: "Flash over wall (team blind)",
          right: "Double flash OR line-of-sight",
          impact: "-22% entry success",
          pattern: "Flash that hits enemies AND reveals angle",
          category: "MID-ROUND",
        },
        {
          id: 5,
          title: "DEFENSIVE SMOKES MID-ROUND",
          frequency: "44%",
          wrong: "Smoke A main when enemies inside",
          right: "Smoke rotates/post-plant only",
          impact: "-29% retake success",
          rule: "Only after enemy commitment",
          category: "MID-ROUND",
        },
        {
          id: 6,
          title: "MOLLY YOUR OWN PLANT",
          frequency: "31%",
          wrong: "Molly default plant after plant",
          right: "Molly DEFUSE path (link/choke)",
          impact: "-37% post-plant hold",
          priority: "Enemy escape → Default plant → Default defuse",
          category: "MID-ROUND",
        },
        {
          id: 7,
          title: "UTILITY WITHOUT CROSSFIRE",
          frequency: "58%",
          wrong: "Flash A main → No backup angle",
          right: "Flash → Entry → Crossfire kill",
          impact: "-26% kill conversion",
          rule: "Utility creates 2v1 advantage minimum",
          category: "POSITIONAL",
        },
        {
          id: 8,
          title: "LINEAR UTILITY USAGE",
          frequency: "49%",
          wrong: "All util same site same way",
          right: "Rotate util patterns",
          impact: "-19% prediction avoidance",
          pattern: "3 entry patterns per map minimum",
          category: "POSITIONAL",
        },
        {
          id: 9,
          title: "NO TRADE UTILITY",
          frequency: "36%",
          wrong: "Solo flash → Entry → Dead",
          right: "2-man flash → Entry → Trade",
          impact: "-33% numbers advantage",
          rule: "Never lose 2v1 fight",
          category: "POSITIONAL",
        },
        {
          id: 10,
          title: "FULL UTIL ECO ROUNDS",
          frequency: "27%",
          wrong: "Eco round → All utility",
          right: "Save pistol util for next round",
          impact: "-24% pistol round win rate",
          rule: "1 util/agent → Forcebuy next",
          category: "ECONOMY",
        },
      ],
      roleTraps: [
        { role: "DUELIST", trap: "\"Flash for me\"" },
        { role: "SENTINEL", trap: "\"Smoke everything\"" },
        { role: "CONTROLLER", trap: "\"One smoke per site\"" },
        { role: "INITIATOR", trap: "\"Recon after entry\"" },
      ],
      checklist: [
        "Flash SELF first",
        "Smoke ENEMY vision",
        "Save 50% post-plant",
        "Crossfire EVERY util",
        "Trade EVERY entry",
        "0:30 entry timing",
        "Molly defuse path",
        "No eco full util",
      ],
      drills: [
        { time: "1min", task: "Spike Rush flashes (self-flash only)" },
        { time: "1min", task: "Custom smokes (enemy vision only)" },
        { time: "1min", task: "Deathmatch mollies (defuse path)" },
        { time: "1min", task: "Range lineups (3 patterns/map)" },
        { time: "1min", task: "Review last 5 deaths (util cause?)" },
      ],
      stats: {
        platWR: "47.2%",
        immortalWR: "62.8%",
        gapCauses: [
          { label: "Self/team flash", value: "68%" },
          { label: "Early spam", value: "53%" },
          { label: "No crossfire", value: "41%" },
          { label: "Wrong molly", value: "29%" },
        ],
      },
    },
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
    timingComparison: [
      { utility: 'Flash', soloQueue: 'Defensive (70%)', teamPlay: 'Offensive (65%)', reason: 'Solo: Survive / Team: Engage' },
      { utility: 'Teleport', soloQueue: 'Split push (82%)', teamPlay: 'Objective siege (91%)', reason: 'Solo: Pressure / Team: Fights' },
      { utility: 'Ignite', soloQueue: 'Scaling matchups', teamPlay: 'Dive comps', reason: 'Solo: 1v1 / Team: Secures' },
      { utility: 'Exhaust', soloQueue: 'Burst assassins', teamPlay: 'Enemy carries', reason: 'Solo: Survival / Team: Peel' },
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
        <TabsList className="grid w-full grid-cols-5 lg:w-[750px]">
          <TabsTrigger value="valorant">VALORANT</TabsTrigger>
          <TabsTrigger value="fixes">Tactical Fixes</TabsTrigger>
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
                  {SampleData.valorant.coreKpis.map((m) => (
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
            {SampleData.valorant.roleBenchmarks.map((role) => (
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
            {SampleData.valorant.mapDashboards.map((map) => (
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

          <ProLineupsViewer />
        </TabsContent>

        <TabsContent value="fixes" className="space-y-6 mt-4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Top 10 Common Utility Mistakes (Avoid These)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Ranked-killing utility errors ranked by frequency and round impact
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {SampleData.valorant.mistakes?.topMistakes.map((mistake) => (
                      <div key={mistake.id} className="space-y-3 pb-6 border-b border-white/5 last:border-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant={mistake.category === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-[10px]">
                              {mistake.category}
                            </Badge>
                            <h4 className="font-bold text-lg">{mistake.id}. {mistake.title}</h4>
                          </div>
                          <Badge variant="outline" className="text-xs">{mistake.frequency} frequency</Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                            <div className="flex items-center gap-2 text-destructive mb-1">
                              <XCircle className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase">Wrong</span>
                            </div>
                            <p className="text-sm font-medium">{mistake.wrong}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                            <div className="flex items-center gap-2 text-primary mb-1">
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="text-xs font-bold uppercase">Right</span>
                            </div>
                            <p className="text-sm font-medium">{mistake.right}</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <BarChart3 className="h-3 w-3" />
                            <span className="font-bold">IMPACT:</span>
                            <span className="text-destructive font-bold">{mistake.impact}</span>
                          </div>
                          {mistake.fix && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Target className="h-3 w-3" />
                              <span className="font-bold">FIX:</span>
                              <span className="text-primary">{mistake.fix}</span>
                            </div>
                          )}
                          {mistake.rule && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Shield className="h-3 w-3" />
                              <span className="font-bold">RULE:</span>
                              <span className="italic">{mistake.rule}</span>
                            </div>
                          )}
                          {mistake.pattern && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <TrendingUp className="h-3 w-3" />
                              <span className="font-bold">PRO PATTERN:</span>
                              <span>{mistake.pattern}</span>
                            </div>
                          )}
                          {mistake.priority && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <ChevronRight className="h-3 w-3" />
                              <span className="font-bold">PRIORITY:</span>
                              <span>{mistake.priority}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="w-full md:w-80 space-y-6">
              <Card className="glass-card border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    IMMEDIATE FIX CHECKLIST
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {SampleData.valorant.mistakes?.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded bg-secondary/10 hover:bg-secondary/20 transition-colors">
                      <div className="h-4 w-4 rounded-sm border border-primary/50 flex-shrink-0" />
                      <span className="text-xs font-medium">{item}</span>
                    </div>
                  ))}
                  <div className="pt-4 text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Status</p>
                    <p className="text-xl font-black text-primary italic">8/8 = Immortal Utility</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-l-4 border-l-accent">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    5-MINUTE DAILY DRILL
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {SampleData.valorant.mistakes?.drills.map((drill, i) => (
                    <div key={i} className="flex gap-3">
                      <span className="text-[10px] font-bold text-accent min-w-[32px]">{drill.time}</span>
                      <span className="text-xs">{drill.task}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="text-sm font-bold">PRO vs PLAT STATS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-end border-b border-white/5 pb-2">
                    <div>
                      <p className="text-[10px] text-muted-foreground">Plat WR</p>
                      <p className="text-lg font-bold">47.2%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-primary">Immortal WR</p>
                      <p className="text-lg font-bold text-primary">62.8%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Gap Causes:</p>
                    {SampleData.valorant.mistakes?.stats.gapCauses.map((cause) => (
                      <div key={cause.label} className="flex justify-between text-xs">
                        <span>{cause.label}</span>
                        <span className="font-bold text-destructive">{cause.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-xs font-bold uppercase">Role-Specific Traps</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {SampleData.valorant.mistakes?.roleTraps.map((trap) => (
                    <div key={trap.role} className="text-[11px]">
                      <span className="font-bold text-primary">{trap.role}:</span>{' '}
                      <span className="text-destructive italic">{trap.trap}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="p-6 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-white/10 text-center space-y-2">
            <h3 className="text-xl font-bold italic">"Utility doesn't kill. Utility creates 2v1s. 2v1s win rounds."</h3>
            <div className="flex justify-center gap-8 pt-2">
              <p className="text-sm"><span className="font-bold text-destructive">Plat:</span> 1v1 utility → Lose</p>
              <p className="text-sm"><span className="font-bold text-primary">Pro:</span> 2v1 utility → Win</p>
            </div>
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
                  {SampleData.lol.summonerSpellEfficiency.map((m) => (
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
            {SampleData.lol.objectiveSuccess.map((obj) => (
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

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Solo Queue vs Team Play Timing Differences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utility</TableHead>
                    <TableHead>Solo Queue</TableHead>
                    <TableHead>Team Play</TableHead>
                    <TableHead>Primary Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {SampleData.lol.timingComparison?.map((m) => (
                    <TableRow key={m.utility}>
                      <TableCell className="font-medium">{m.utility}</TableCell>
                      <TableCell className="text-destructive font-semibold">{m.soloQueue}</TableCell>
                      <TableCell className="text-primary font-semibold">{m.teamPlay}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.reason}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
                <p className="text-xs italic text-center text-muted-foreground">
                  "Solo queue utility focuses on individual survival to carry, while team play prioritizes macro synchronization and teamfight wins."
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {SampleData.lol.roleBenchmarks.map((role) => (
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
                {SampleData.economy.valorant.map((e) => (
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
                {SampleData.economy.lol.map((e) => (
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
                {SampleData.gapAnalysis.map((gap) => (
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
              {SampleData.trainingTargets.map((target) => (
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

