import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LoLQueueAnalysisOutput } from '@/types/lolQueueStats';

interface Props {
  analysis: LoLQueueAnalysisOutput;
}

export const LoLQueueComparisonView: React.FC<Props> = ({ analysis }) => {
  const { comparisonData } = analysis;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Solo vs Flex Queue Comparison</CardTitle>
          <Badge variant="outline">Recommendation: {comparisonData.recommendation}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="metrics">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="metrics">Key Metrics</TabsTrigger>
            <TabsTrigger value="roles">Role Impact</TabsTrigger>
            <TabsTrigger value="strategy">Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {comparisonData.metrics.map((m) => (
                <Card key={m.metric} className="border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">{m.metric}</div>
                        <div className="text-xs mt-1">Impact: {m.impact}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">Solo</div>
                        <div className="font-semibold">{m.solo}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs">Flex</div>
                        <div className="font-semibold">{m.flex}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {Object.entries(comparisonData.roleImpacts).map(([role, impact]) => (
                <Card key={role}>
                  <CardContent className="p-4">
                    <div className="text-sm font-medium mb-1">{role}</div>
                    <div className="text-xs text-muted-foreground">Carry Potential</div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-muted-foreground">Solo</span>
                      <Badge variant="secondary">{Math.round(impact.solo * 100)}%</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-sm">
                      <span className="text-muted-foreground">Flex</span>
                      <Badge variant="outline">{Math.round(impact.flex * 100)}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="strategy" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Solo Queue Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {comparisonData.soloStrategy.priorities.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <div className="text-xs uppercase text-muted-foreground mb-1">Key Stats</div>
                    <div className="flex flex-wrap gap-2">
                      {comparisonData.soloStrategy.keyStats.map((s, i) => (
                        <Badge key={i} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Flex Queue Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {comparisonData.flexStrategy.priorities.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    <div className="text-xs uppercase text-muted-foreground mb-1">Key Stats</div>
                    <div className="flex flex-wrap gap-2">
                      {comparisonData.flexStrategy.keyStats.map((s, i) => (
                        <Badge key={i} variant="outline">{s}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
