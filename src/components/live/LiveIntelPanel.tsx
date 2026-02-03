import React, { useState } from 'react';
import { LiveIntelOverlay } from './LiveIntelOverlay';

export const LiveIntelPanel: React.FC = () => {
  const [game, setGame] = useState<'VALORANT'|'LEAGUE'>('VALORANT');
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground">Game</label>
        <select
          className="border rounded px-2 py-1 bg-background"
          value={game}
          onChange={(e)=>setGame(e.target.value as any)}
        >
          <option value="VALORANT">VALORANT</option>
          <option value="LEAGUE">LEAGUE</option>
        </select>
      </div>
      <LiveIntelOverlay game={game} />
    </div>
  );
};
