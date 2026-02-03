import React, { useEffect, useRef, useState } from 'react';
import { LiveIntelligenceEngine } from '@/services/live/engine';
import type { CoachCall, LiveGameState } from '@/types/liveIntel';

interface OverlayState extends LiveGameState {
  coachCalls: CoachCall[];
}

export const LiveIntelOverlay: React.FC<{ game: 'VALORANT' | 'LEAGUE' }> = ({ game }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [engine] = useState(() => new LiveIntelligenceEngine());
  const [last, setLast] = useState<OverlayState | null>(null);

  useEffect(() => {
    let mounted = true;
    engine.startLiveAnalysis(game, (state) => {
      if (!mounted) return;
      setLast(state);
      render(state);
    });
    return () => {
      mounted = false;
      engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game]);

  const render = (state: OverlayState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0,0,w,h);

    // Panel BG
    ctx.fillStyle = 'rgba(26,26,26,0.85)';
    ctx.fillRect(20, 20, 360, 200);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`LIVE ENEMY PROFILES (${state.game})`, 30, 40);

    ctx.font = '12px sans-serif';
    state.enemyPlayers.slice(0,5).forEach((p, i) => {
      ctx.fillStyle = i === 0 ? '#ff4444' : '#cfcfcf';
      const label = `${p.playstyle?.toUpperCase?.() || 'N/A'} (${Math.round((p.confidence||0)*100)}%)`;
      const sub = (state.game === 'VALORANT' ? (p.agent || '') : (p.champion || ''));
      ctx.fillText(`${label}  ${sub}`, 30, 65 + i*22);
    });

    // Coach calls (top-right)
    ctx.fillStyle = 'rgba(26,26,26,0.85)';
    ctx.fillRect(w - 320, 20, 300, 140);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('COACH CALLS', w - 310, 40);

    state.coachCalls.slice(0,3).forEach((c, i) => {
      const color = c.color === 'red' ? '#ff5555' : c.color === 'yellow' ? '#ffdd55' : '#55ff99';
      ctx.fillStyle = color;
      ctx.fillText(`${c.priority}: "${c.message}"`, w - 310, 65 + i*22);
    });

    // Predictions (bottom)
    ctx.fillStyle = 'rgba(26,26,26,0.85)';
    ctx.fillRect(20, h - 120, w - 40, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('PREDICTIONS', 30, h - 95);
    ctx.font = '12px sans-serif';
    state.predictions.slice(0,3).forEach((p, i) => {
      ctx.fillStyle = '#cfcfcf';
      ctx.fillText(`${p.type}: ${Math.round(p.probability*100)}% (${p.message})`, 30, h - 70 + i*22);
    });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 420 }}>
      <canvas ref={canvasRef} width={960} height={420} style={{ width: '100%', height: '100%', background: 'transparent' }} />
      <div style={{ position:'absolute', right: 16, bottom: 16, color:'#9aa0a6', fontSize: 12 }}>
        {last?.matchId ? `Match: ${last.matchId}` : 'Waiting for live state...'}
      </div>
    </div>
  );
};
