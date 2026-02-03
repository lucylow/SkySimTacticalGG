// GRID Dashboard - Main page for GRID integration demo

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventTimeline } from '@/components/grid/EventTimeline';
import { AgentInsights } from '@/components/grid/AgentInsights';
import { ReviewQueue } from '@/components/grid/ReviewQueue';
import { MatchStateDisplay } from '@/components/grid/MatchStateDisplay';
import { ingestionService } from '@/services/grid';
import { reviewService } from '@/services/grid';
import { Play, Square, User } from 'lucide-react';
import { toast } from 'sonner';

export function GridDashboard() {
  const [matchId, setMatchId] = useState('match-123');
  const [isIngesting, setIsIngesting] = useState(false);
  const [currentMatchId, setCurrentMatchId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'viewer' | 'reviewer' | 'admin'>('viewer');

  useEffect(() => {
    setCurrentMatchId(ingestionService.getCurrentMatchId());
    setIsIngesting(ingestionService.isActive());
  }, []);

  const handleStartIngestion = async () => {
    if (!matchId.trim()) {
      toast.error('Please enter a match ID');
      return;
    }

    try {
      setIsIngesting(true);
      setCurrentMatchId(matchId);
      
      // Start ingestion in background
      ingestionService.ingestMatch(matchId).catch((error) => {
        console.error('Ingestion error:', error);
        toast.error('Ingestion failed');
        setIsIngesting(false);
        setCurrentMatchId(null);
      });
      
      toast.success('Ingestion started');
    } catch (error) {
      console.error('Failed to start ingestion:', error);
      toast.error('Failed to start ingestion');
      setIsIngesting(false);
    }
  };

  const handleStopIngestion = () => {
    ingestionService.stop();
    setIsIngesting(false);
    setCurrentMatchId(null);
    toast.info('Ingestion stopped');
  };

  const handleSetUserRole = (role: 'viewer' | 'reviewer' | 'admin') => {
    setUserRole(role);
    reviewService.setUser(`user-${Date.now()}`, role);
    toast.success(`Role set to ${role}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">GRID Esports Data Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Real-time esports data powered by GRID
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="match-id">Match ID</Label>
              <Input
                id="match-id"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="Enter match ID"
                disabled={isIngesting}
              />
            </div>
            <div className="flex items-end gap-2">
              {!isIngesting ? (
                <Button onClick={handleStartIngestion} disabled={isIngesting}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Ingestion
                </Button>
              ) : (
                <Button onClick={handleStopIngestion} variant="destructive">
                  <Square className="w-4 h-4 mr-2" />
                  Stop Ingestion
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Label>User Role:</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={userRole === 'viewer' ? 'default' : 'outline'}
                onClick={() => handleSetUserRole('viewer')}
              >
                <User className="w-4 h-4 mr-2" />
                Viewer
              </Button>
              <Button
                size="sm"
                variant={userRole === 'reviewer' ? 'default' : 'outline'}
                onClick={() => handleSetUserRole('reviewer')}
              >
                Reviewer
              </Button>
              <Button
                size="sm"
                variant={userRole === 'admin' ? 'default' : 'outline'}
                onClick={() => handleSetUserRole('admin')}
              >
                Admin
              </Button>
            </div>
          </div>

          {currentMatchId && (
            <div className="text-sm text-muted-foreground">
              Currently ingesting: <span className="font-mono">{currentMatchId}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="state">Match State</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="review">Review Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <EventTimeline matchId={currentMatchId || undefined} />
          </div>
        </TabsContent>

        <TabsContent value="state" className="space-y-4">
          {currentMatchId ? (
            <MatchStateDisplay matchId={currentMatchId} />
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Start ingestion to see match state
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <AgentInsights matchId={currentMatchId || undefined} />
        </TabsContent>

        <TabsContent value="review" className="space-y-4">
          <ReviewQueue />
        </TabsContent>
      </Tabs>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">About GRID Integration</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            This dashboard demonstrates a complete GRID esports data integration:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Raw GRID event ingestion (Sample for demo)</li>
            <li>Canonical event normalization</li>
            <li>Match state reconstruction</li>
            <li>AI agent reasoning (momentum, star players, economy)</li>
            <li>Human-in-the-loop review workflow</li>
            <li>Real-time event visualization</li>
          </ul>
          <p className="mt-4">
            <strong>Note:</strong> This is a frontend-only implementation using in-memory event bus.
            In production, this would connect to a real GRID API and use Redis/Kafka for event streaming.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}



