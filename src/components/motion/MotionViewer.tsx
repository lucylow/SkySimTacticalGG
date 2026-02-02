import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import type { MotionData } from '@/types';

// Player model component
const PlayerModel: React.FC<{ position: [number, number, number]; color: string }> = ({
  position,
  color,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <group position={position}>
      {/* Body */}
      <mesh ref={meshRef} position={[0, 1, 0]}>
        <capsuleGeometry args={[0.3, 1, 8, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 2, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
};

// Map environment
const MapEnvironment: React.FC = () => {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1a2e" />
      </mesh>

      {/* Grid */}
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2d2d44"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4a4a6a"
        fadeDistance={50}
        infiniteGrid
      />

      {/* Example obstacles/walls */}
      <mesh position={[-5, 1.5, 0]}>
        <boxGeometry args={[1, 3, 8]} />
        <meshStandardMaterial color="#2d2d44" />
      </mesh>
      <mesh position={[5, 1.5, 0]}>
        <boxGeometry args={[1, 3, 8]} />
        <meshStandardMaterial color="#2d2d44" />
      </mesh>
    </group>
  );
};

// Animated scene with players
const AnimatedScene: React.FC<{
  frame: number;
}> = ({ frame }) => {
  const groupRef = useRef<THREE.Group>(null);

  // Demo player positions (would come from motion data in production)
  const playerPositions: [number, number, number][] = [
    [Math.sin(frame * 0.05) * 3, 0, Math.cos(frame * 0.05) * 3],
    [Math.sin(frame * 0.05 + 1) * 4, 0, Math.cos(frame * 0.05 + 1) * 4],
    [Math.sin(frame * 0.05 + 2) * 2, 0, Math.cos(frame * 0.05 + 2) * 5],
    [Math.sin(frame * 0.05 + 3) * 5, 0, Math.cos(frame * 0.05 + 3) * 2],
    [Math.sin(frame * 0.05 + 4) * 3, 0, Math.cos(frame * 0.05 + 4) * 4],
  ];

  const teamColors = ['#8b5cf6', '#8b5cf6', '#8b5cf6', '#10b981', '#10b981'];

  return (
    <group ref={groupRef}>
      {playerPositions.map((pos, i) => (
        <PlayerModel
          key={i}
          position={pos}
          color={teamColors[i] ?? '#8b5cf6'}
        />
      ))}
    </group>
  );
};

interface MotionViewerProps {
  motionData?: MotionData | null;
  onFrameChange?: (frame: number) => void;
}

export const MotionViewer: React.FC<MotionViewerProps> = ({
  motionData,
  onFrameChange,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const maxFrames = motionData?.frames.length || 300;

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => {
          const next = prev + 1;
          if (next >= maxFrames) {
            setIsPlaying(false);
            return 0;
          }
          onFrameChange?.(next);
          return next;
        });
      }, (1000 / 30) / playbackSpeed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, maxFrames, playbackSpeed, onFrameChange]);

  const handleFrameChange = (value: number[]) => {
    const newFrame = value[0];
    if (newFrame !== undefined) {
      setCurrentFrame(newFrame);
      onFrameChange?.(newFrame);
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-0">
        {/* 3D Canvas */}
        <div className="relative h-[400px] w-full bg-background">
          <Canvas
            camera={{ position: [15, 15, 15], fov: 50 }}
            shadows
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 10, 5]}
                intensity={1}
                castShadow
              />
              <pointLight position={[-10, 10, -5]} intensity={0.5} color="#8b5cf6" />

              <MapEnvironment />
              <AnimatedScene frame={currentFrame} />

              <OrbitControls
                enablePan
                enableZoom
                enableRotate
                maxPolarAngle={Math.PI / 2}
              />
              <Environment preset="night" />
            </Suspense>
          </Canvas>

          {/* Frame counter overlay */}
          <div className="absolute left-4 top-4 rounded-lg bg-card/80 px-3 py-1.5 text-sm backdrop-blur-sm">
            Frame: {currentFrame + 1} / {maxFrames}
          </div>
        </div>

        {/* Controls */}
        <div className="border-t border-border bg-card/50 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentFrame(0)}
              >
                <SkipBack className="h-4 w-4" />
              </Button>

              <Button
                variant="default"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentFrame(maxFrames - 1)}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1">
              <Slider
                value={[currentFrame]}
                onValueChange={handleFrameChange}
                min={0}
                max={maxFrames - 1}
                step={1}
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Speed:</span>
              <Slider
                value={[playbackSpeed]}
                onValueChange={(v) => {
                  const speed = v[0];
                  if (speed !== undefined) {
                    setPlaybackSpeed(speed);
                  }
                }}
                min={0.25}
                max={2}
                step={0.25}
                className="w-20"
              />
              <span className="w-10 text-sm">{playbackSpeed}x</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};