/**
 * MotionPanel Component
 * Integrates with FastAPI backend to generate and display motion sequences.
 * 
 * Flow:
 * 1. User clicks "Generate Opponent Ghost"
 * 2. POST to /api/v1/agents/analyze-round
 * 3. Open WebSocket to /ws/agents for real-time updates
 * 4. When motion is ready, fetch and render in MotionViewer
 */
import { useState } from "react";
import { ApiClient } from "@/lib/apiClient";
import { config } from "@/lib/config";
import { useWebSocket } from "@/hooks/useWebSocket";
import { unifiedApi } from "@/services/unifiedApi";
import { MotionViewer } from "./MotionViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface MotionPanelProps {
  matchId: string;
  round: number;
  gridSnapshot?: {
    players: Array<{
      id: string;
      agent?: string;
      role?: string;
      health?: number;
      position?: { x: number; y: number; z: number };
      is_crouching?: boolean;
      is_moving?: boolean;
      peek_events?: Array<{ time: number }>;
      utility?: string[];
    }>;
    round_time_remaining?: number;
  };
  roundMeta?: {
    round_phase?: string;
    spike_state?: string;
    map?: string;
  };
}

interface JobStatus {
  job_id: string | null;
  status: "idle" | "submitting" | "queued" | "processing" | "completed" | "error";
  stage?: string;
  error?: string;
  motion_url?: string;
  confidence?: number;
}

interface MotionData {
  frames: Array<{
    timestamp: number;
    joints: Array<{ x: number; y: number; z: number; w: number }>;
    root_position: [number, number, number];
  }>;
  duration_s: number;
  fps: number;
  predictedActionLabel?: string;
}

// Create API client instance for motion endpoints
const motionApiClient = new ApiClient({
  baseUrl: config.apiBaseUrl,
  getAuthToken: () => localStorage.getItem('auth_token'),
});

export function MotionPanel({ matchId, round, gridSnapshot, roundMeta }: MotionPanelProps) {
  const [jobStatus, setJobStatus] = useState<JobStatus>({
    job_id: null,
    status: "idle",
  });
  const [motionData, setMotionData] = useState<MotionData | null>(null);

  // Use improved WebSocket hook
  const { sendMessage: _sendMessage, lastMessage: _lastMessage } = useWebSocket(unifiedApi.getWebSocketUrl(), {
    onMessage: (message) => {
      // Handle WebSocket messages for job updates
      const payload = message.data as any;
      
      // Handle connection confirmation
      if (payload.type === "connected") {
        console.log("WebSocket subscribed to agent updates");
        return;
      }

      // Handle keepalive
      if (payload.type === "keepalive") {
        return;
      }

      // Handle job updates (filter by our job_id)
      if (payload.task_id === jobStatus.job_id || payload.job_id === jobStatus.job_id) {
        setJobStatus((prev) => ({
          ...prev,
          status: payload.status || prev.status,
          stage: payload.stage || prev.stage,
          error: payload.error,
          motion_url: payload.motion_url || prev.motion_url,
          confidence: payload.confidence || prev.confidence,
        }));

        // If motion is generated, fetch it
        if (payload.stage === "motion_generated" && payload.motion_url) {
          fetchMotionData(payload.motion_url);
        }

        // If completed, fetch motion if URL is available
        if (payload.status === "completed" && payload.motion_url) {
          fetchMotionData(payload.motion_url);
        }
      }
    },
    onConnect: () => {
      console.log("WebSocket connected for motion panel");
    },
    onError: (error) => {
      console.error("WebSocket error:", error);
    },
  });

  // Fetch motion data from storage URL

  // Fetch motion data from storage URL
  const fetchMotionData = async (motionUrl: string) => {
    try {
      // In production, this would fetch from S3 or storage service
      // For now, if it's a Sample URL, we'll generate Sample data
      if (motionUrl.startsWith("Sample://")) {
        // Generate Sample motion data
        const fps = 30;
        const duration_s = 6;
        const numFrames = duration_s * fps;
        
        const frames = Array.from({ length: numFrames }, (_, i) => ({
          timestamp: i / fps,
          joints: Array.from({ length: 24 }, () => ({
            x: 0,
            y: 0,
            z: 0,
            w: 1,
          })),
          root_position: [
            Math.sin(i * 0.1) * 2,
            0,
            Math.cos(i * 0.1) * 2,
          ] as [number, number, number],
        }));

        setMotionData({
          frames,
          duration_s,
          fps,
          predictedActionLabel: "peek",
        });
        return;
      }

      // For real URLs, fetch from API
      const data = await motionApiClient.get<MotionData>(`/motion/${motionUrl}`);
      setMotionData(data);
    } catch (error) {
      console.error("Error fetching motion data:", error);
      // Fallback to Sample data on error
      fetchMotionData("Sample://fallback");
    }
  };

  // Start analysis workflow
  const startAnalysis = async () => {
    if (!gridSnapshot) {
      alert("Grid snapshot is required");
      return;
    }

    setJobStatus({ job_id: null, status: "submitting" });

    try {
      const response = await motionApiClient.post<{ job_id: string }>(
        '/agents/analyze-round',
        {
          match_id: matchId,
          round: round,
          grid_snapshot: gridSnapshot,
          round_meta: roundMeta || {},
          duration_s: 6,
        }
      );

      const { job_id } = response;
      setJobStatus({
        job_id,
        status: "queued",
      });

      // WebSocket is already connected via hook, no need to open manually
    } catch (error: any) {
      console.error("Error starting analysis:", error);
      setJobStatus({
        job_id: null,
        status: "error",
        error: error.response?.data?.detail || error.message || "Failed to start analysis",
      });
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    switch (jobStatus.status) {
      case "idle":
        return <Badge variant="outline">Ready</Badge>;
      case "submitting":
      case "queued":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Queued
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {jobStatus.stage || "Processing"}
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Opponent Ghost Generator</CardTitle>
            <CardDescription>
              Generate 3D motion visualization from match analysis
            </CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        {jobStatus.status !== "idle" && (
          <div className="space-y-2">
            {jobStatus.job_id && (
              <p className="text-sm text-muted-foreground">
                Job ID: <code className="text-xs">{jobStatus.job_id}</code>
              </p>
            )}
            {jobStatus.stage && (
              <p className="text-sm">
                Stage: <span className="font-medium">{jobStatus.stage}</span>
              </p>
            )}
            {jobStatus.confidence !== undefined && (
              <p className="text-sm">
                Confidence: <span className="font-medium">{(jobStatus.confidence * 100).toFixed(1)}%</span>
              </p>
            )}
          </div>
        )}

        {/* Error Display */}
        {jobStatus.status === "error" && jobStatus.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{jobStatus.error}</AlertDescription>
          </Alert>
        )}

        {/* Action Button */}
        {jobStatus.status === "idle" && (
          <Button
            onClick={startAnalysis}
            disabled={!gridSnapshot}
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            Generate Opponent Ghost
          </Button>
        )}

        {/* Motion Viewer */}
        {motionData && (
          <div className="mt-4">
            <MotionViewer
              motionData={{
                id: jobStatus.job_id || "motion",
                frames: motionData.frames.map((f) => ({
                  timestamp: f.timestamp,
                  joints: f.joints.map((j, idx) => ({
                    name: `joint_${idx}`,
                    position: [0, 0, 0] as [number, number, number],
                    rotation: [j.x, j.y, j.z, j.w] as [number, number, number, number],
                  })),
                })),
                skeleton: [],
                fps: motionData.fps,
                duration: motionData.duration_s,
              }}
            />
          </div>
        )}

        {/* Processing Indicator */}
        {jobStatus.status === "processing" && !motionData && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                {jobStatus.stage === "micro_analysis" && "Analyzing player patterns..."}
                {jobStatus.stage === "prompt_generation" && "Generating motion prompt..."}
                {jobStatus.stage === "motion_generation" && "Generating motion sequence..."}
                {jobStatus.stage === "validation" && "Validating motion quality..."}
                {!jobStatus.stage && "Processing..."}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


