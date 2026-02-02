import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';
import { Play, Pause, SkipBack, SkipForward, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PredictedAction, MotionKeyframe } from '@/types/grid';

interface TacticalMotionViewerProps {
  predictedAction?: PredictedAction | null;
  motionKeyframes?: MotionKeyframe[];
}

// Character model component with animation support
const AnimatedCharacter: React.FC<{
  motionKeyframes: MotionKeyframe[];
  currentFrame: number;
  color: string;
  label: string;
}> = ({ motionKeyframes, currentFrame, color, label }) => {
  const groupRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);

  // Apply motion data to character
  useFrame(() => {
    if (!motionKeyframes || motionKeyframes.length === 0 || !groupRef.current) return;

    const frame = Math.floor(currentFrame) % motionKeyframes.length;
    const keyframe = motionKeyframes[frame];

    if (keyframe) {
      // Apply root position
      groupRef.current.position.set(
        keyframe.root_position[0],
        keyframe.root_position[1] + 1, // Offset for character height
        keyframe.root_position[2]
      );

      // Apply root rotation
      if (keyframe.joints.length > 0) {
        const rootQuat = keyframe.joints[0];
        if (rootQuat) {
          groupRef.current.rotation.setFromQuaternion(
            new THREE.Quaternion(rootQuat.x, rootQuat.y, rootQuat.z, rootQuat.w)
          );
        }
      }

      // Apply arm rotation for throwing motions
      if (keyframe.joints.length > 3 && rightArmRef.current) {
        const armQuat = keyframe.joints[3];
        if (armQuat) {
          rightArmRef.current.rotation.setFromQuaternion(
            new THREE.Quaternion(armQuat.x, armQuat.y, armQuat.z, armQuat.w)
          );
        }
      }
    }
  });

  // Render character as capsules
  return (
    <group ref={groupRef}>
      {/* Visual representation */}
      <group>
        {/* Body */}
        <mesh position={[0, 0, 0]}>
          <capsuleGeometry args={[0.15, 0.8, 8, 16]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
        </mesh>
        
        {/* Head */}
        <mesh position={[0, 0.6, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Left Arm */}
        <mesh position={[-0.25, 0.2, 0]} rotation={[0, 0, Math.PI / 6]}>
          <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Right Arm (animated) */}
        <mesh ref={rightArmRef} position={[0.25, 0.2, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <capsuleGeometry args={[0.08, 0.5, 8, 16]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
        </mesh>

        {/* Legs */}
        <mesh position={[-0.1, -0.4, 0]}>
          <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
        </mesh>
        <mesh position={[0.1, -0.4, 0]}>
          <capsuleGeometry args={[0.1, 0.6, 8, 16]} />
          <meshStandardMaterial color={color} metalness={0.2} roughness={0.8} />
        </mesh>
      </group>

      {/* Label */}
      <Html position={[0, 2.2, 0]} center>
        <div className="rounded bg-black/70 px-2 py-1 text-xs text-white backdrop-blur-sm">
          {label}
        </div>
      </Html>
    </group>
  );
};

// Tactical environment with bomb site
const TacticalEnvironment: React.FC = () => {
  return (
    <group>
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1a1a2e" roughness={0.8} />
      </mesh>

      {/* Grid */}
      <Grid
        args={[30, 30]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2d2d44"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4a4a6a"
        fadeDistance={30}
        infiniteGrid
      />

      {/* Bomb Site (Orange) */}
      <mesh position={[0, 0.1, -5]} receiveShadow>
        <boxGeometry args={[4, 0.2, 4]} />
        <meshStandardMaterial color="#ffaa33" emissive="#ffaa33" emissiveIntensity={0.2} />
      </mesh>

      {/* Cover/Walls */}
      <mesh position={[-5, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 3, 8]} />
        <meshStandardMaterial color="#2d2d44" roughness={0.9} />
      </mesh>
      <mesh position={[5, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[1, 3, 8]} />
        <meshStandardMaterial color="#2d2d44" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.5, -8]} castShadow receiveShadow>
        <boxGeometry args={[8, 3, 1]} />
        <meshStandardMaterial color="#2d2d44" roughness={0.9} />
      </mesh>
    </group>
  );
};

// Scene with animated character
const AnimatedScene: React.FC<{
  motionKeyframes: MotionKeyframe[];
  currentFrame: number;
  predictedAction: PredictedAction | null;
}> = ({ motionKeyframes, currentFrame, predictedAction }) => {
  const characterColor = predictedAction?.motion_type === 'disengage' ? '#ef4444' : '#8b5cf6';

  return (
    <>
      <TacticalEnvironment />
      
      {motionKeyframes && motionKeyframes.length > 0 && (
        <AnimatedCharacter
          motionKeyframes={motionKeyframes}
          currentFrame={currentFrame}
          color={characterColor}
          label={predictedAction?.action || 'Player'}
        />
      )}

      {/* Action label in 3D space */}
      {predictedAction && (
        <Html position={[0, 3, 0]} center>
          <div className="rounded-lg bg-black/80 px-4 py-2 text-sm text-white backdrop-blur-md">
            <div className="font-semibold">{predictedAction.action.replace(/_/g, ' ')}</div>
            <div className="text-xs text-gray-300">Confidence: {(predictedAction.confidence * 100).toFixed(0)}%</div>
          </div>
        </Html>
      )}
    </>
  );
};

export const TacticalMotionViewer: React.FC<TacticalMotionViewerProps> = ({
  predictedAction,
  motionKeyframes = [],
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const maxFrames = motionKeyframes.length || 90; // Default 3 seconds at 30fps

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPlaying && motionKeyframes.length > 0) {
      interval = setInterval(() => {
        setCurrentFrame((prev) => {
          const next = prev + 1;
          if (next >= maxFrames) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }, (1000 / 30) / playbackSpeed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, maxFrames, playbackSpeed, motionKeyframes.length]);

  const handleFrameChange = (value: number[]) => {
    const newFrame = value[0];
    if (newFrame !== undefined) {
      setCurrentFrame(newFrame);
    }
  };

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Tactical Motion Viewer
          </CardTitle>
          {predictedAction && (
            <Badge variant="outline" className="font-mono text-xs">
              {predictedAction.motion_type}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* 3D Canvas */}
        <div className="relative h-[500px] w-full bg-background">
          <Canvas
            camera={{ position: [8, 6, 10], fov: 50 }}
            shadows
          >
            <Suspense fallback={null}>
              <ambientLight intensity={0.4} />
              <directionalLight
                position={[10, 20, 5]}
                intensity={1}
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
              />
              <pointLight position={[-10, 10, -5]} intensity={0.5} color="#8b5cf6" />

              <AnimatedScene
                motionKeyframes={motionKeyframes}
                currentFrame={currentFrame}
                predictedAction={predictedAction || null}
              />

              <OrbitControls
                enablePan
                enableZoom
                enableRotate
                maxPolarAngle={Math.PI / 2}
                minDistance={5}
                maxDistance={30}
              />
              <Environment preset="night" />
            </Suspense>
          </Canvas>

          {/* Frame counter overlay */}
          <div className="absolute left-4 top-4 rounded-lg bg-card/80 px-3 py-1.5 text-sm backdrop-blur-sm">
            Frame: {currentFrame + 1} / {maxFrames}
          </div>

          {/* Prompt overlay */}
          {predictedAction?.full_prompt && (
            <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-card/90 p-3 text-xs backdrop-blur-sm">
              <div className="font-semibold text-primary">Motion Prompt:</div>
              <div className="mt-1 text-muted-foreground">{predictedAction.full_prompt}</div>
            </div>
          )}
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
                disabled={motionKeyframes.length === 0}
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