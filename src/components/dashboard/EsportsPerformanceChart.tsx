import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EsportsPerformanceChartProps {
  lolData: any[];
  valorantData: any[];
}

export const EsportsPerformanceChart: React.FC<EsportsPerformanceChartProps> = ({
  lolData,
  valorantData,
}) => {
  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg">Esports Performance Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="lol">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="lol">League of Legends</TabsTrigger>
            <TabsTrigger value="valorant">VALORANT</TabsTrigger>
          </TabsList>
          
          <TabsContent value="lol">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lolData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="champion" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="win_rate" name="Win Rate %" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="kda" name="KDA" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          
          <TabsContent value="valorant">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valorantData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="agent" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="win_rate" name="Win Rate %" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="kd" name="K/D Ratio" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
