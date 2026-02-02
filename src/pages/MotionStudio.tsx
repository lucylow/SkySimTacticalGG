import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Upload,
  FileVideo,
  Layers,
  Download,
  Sparkles,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TacticalMotionViewer } from '@/components/motion/TacticalMotionViewer';
import { 
  predictActionFromGrid, 
  generateMotionKeyframes, 
  createSampleGridPacket 
} from '@/services/actionPredictor';
import type { PredictedAction, MotionKeyframe, GridDataPacket } from '@/types/grid';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const MotionStudio: React.FC = () => {
  const [selectedMotion, setSelectedMotion] = useState<string | null>('demo');
  const [predictedAction, setPredictedAction] = useState<PredictedAction | null>(null);
  const [motionKeyframes, setMotionKeyframes] = useState<MotionKeyframe[]>([]);
  const [_currentGridData, setCurrentGridData] = useState<GridDataPacket | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const mockMotions = [
    { id: 'demo', name: 'Round 5 - A Execute', duration: '12s', type: 'Execute' },
    { id: 'motion2', name: 'Round 8 - Retake B', duration: '8s', type: 'Retake' },
    { id: 'motion3', name: 'Round 12 - Eco Push', duration: '15s', type: 'Economy' },
  ];

  const handleGenerateGhost = () => {
    setIsGenerating(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Create sample GRID data packet
      const gridPacket = createSampleGridPacket();
      setCurrentGridData(gridPacket);

      // Predict action using heuristic rules
      const action = predictActionFromGrid(gridPacket);
      setPredictedAction(action);

      // Generate motion keyframes
      const keyframes = generateMotionKeyframes(action, 3.0, 30);
      setMotionKeyframes(keyframes);

      setIsGenerating(false);
    }, 500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/app">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Motion Studio</h1>
            <p className="text-muted-foreground">
              3D player movement analysis powered by HY-Motion 1.0
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleGenerateGhost} disabled={isGenerating}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? 'Generating...' : 'Generate Opponent Ghost'}
          </Button>
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import GRID Data
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Motion List */}
        <Card className="glass-card lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Layers className="h-5 w-5" />
              Motion Library
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockMotions.map((motion) => (
              <div
                key={motion.id}
                onClick={() => setSelectedMotion(motion.id)}
                className={`cursor-pointer rounded-lg border p-3 transition-all hover:bg-muted/50 ${
                  selectedMotion === motion.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileVideo className="h-8 w-8 text-primary" />
                  <div className="flex-1">
                    <p className="font-medium">{motion.name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{motion.duration}</span>
                      <span>•</span>
                      <span>{motion.type}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 3D Viewer */}
        <div className="lg:col-span-3 space-y-4">
        {/* Tactical Motion Viewer */}
          {predictedAction && motionKeyframes.length > 0 ? (
            <TacticalMotionViewer
              predictedAction={predictedAction}
              motionKeyframes={motionKeyframes}
            />
          ) : (
            <Card className="glass-card">
              <CardContent className="flex h-[500px] flex-col items-center justify-center p-8">
                <Sparkles className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No Motion Data</h3>
                <p className="mb-6 text-center text-sm text-muted-foreground">
                  Generate an opponent ghost from GRID data to visualize predicted player actions
                </p>
                <Button onClick={handleGenerateGhost} disabled={isGenerating}>
                  <Play className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Generate Ghost'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Details Panel */}
          {predictedAction && (
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Predicted Action Details</CardTitle>
                <CardDescription>
                  Action predicted from GRID data using heuristic rules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Action Type</div>
                    <Badge variant="outline" className="mt-1">
                      {predictedAction.action.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Confidence</div>
                    <div className="mt-1 text-lg font-semibold">
                      {(predictedAction.confidence * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Motion Type</div>
                    <Badge className="mt-1">{predictedAction.motion_type}</Badge>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Keyframes</div>
                    <div className="mt-1 text-lg font-semibold">{motionKeyframes.length}</div>
                  </div>
                </div>
                <Separator />
                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Full Motion Prompt</div>
                  <p className="rounded-md bg-muted/50 p-3 text-sm leading-relaxed">
                    {predictedAction.full_prompt}
                  </p>
                </div>
                {_currentGridData && (
                  <>
                    <Separator />
                    <div>
                      <div className="mb-2 text-sm font-medium text-muted-foreground">GRID Data Context</div>
                      <div className="rounded-md bg-muted/50 p-3 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="font-medium">Agent:</span> {_currentGridData.player.agent}
                          </div>
                          <div>
                            <span className="font-medium">Team:</span> {_currentGridData.player.team}
                          </div>
                          <div>
                            <span className="font-medium">Health:</span> {_currentGridData.player.health}
                          </div>
                          <div>
                            <span className="font-medium">Weapon:</span> {_currentGridData.inventory.primary_weapon}
                          </div>
                          <div>
                            <span className="font-medium">Spike:</span> {_currentGridData.match_context.spike_status}
                          </div>
                          <div>
                            <span className="font-medium">Phase:</span> {_currentGridData.match_context.round_phase}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" disabled={!predictedAction}>
              <Download className="mr-2 h-4 w-4" />
              Export Analysis
            </Button>
            <Button variant="outline" disabled={!predictedAction}>
              Share with Team
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
