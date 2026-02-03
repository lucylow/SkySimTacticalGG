import { LiveGameState, Vector3 } from '../../types/liveIntel';

// NOTE: These are safe, simulated readers for dev. Replace internals with native addons for real memory reading.

export class MemoryReader {
  private game: 'VALORANT' | 'LEAGUE';
  constructor(game: 'VALORANT' | 'LEAGUE') {
    this.game = game;
  }
  async hookEvents(): Promise<void> {
    // no-op for simulation
    return;
  }
  async readLiveState(): Promise<LiveGameState> {
    if (this.game === 'VALORANT') return simulateValorantState();
    return simulateLeagueState();
  }
}

function simulateValorantState(): LiveGameState {
  const enemies = Array.from({ length: 5 }).map((_, i) => ({
    id: `v_enemy_${i+1}`,
    agent: ['Jett','Sova','Breach','Omen','Killjoy'][i],
    position: randVec(),
    health: 100 - Math.floor(Math.random()*60),
    playstyle: ['rush_wq','lurker','utility_entry','anchor'][i%4],
    confidence: 0.6 + Math.random()*0.35,
    telemetry: { utilDamage: Math.random()*150, totalDamage: 200+Math.random()*300 }
  }));
  return {
    game: 'VALORANT',
    matchId: 'sim_valo_001',
    enemyPlayers: enemies,
    mapState: { currentMap: 'Bind', roundTime: Math.floor(Math.random()*110) },
    economy: { roundEconomy: ['eco','force','full'][Math.floor(Math.random()*3)] as any },
    predictions: [
      { type:'rotate', probability: 0.5+Math.random()*0.4, message:'A→B link' },
      { type:'lurk', probability: 0.6+Math.random()*0.3, message:'Heaven confirmed' }
    ]
  };
}

function simulateLeagueState(): LiveGameState {
  const enemies = Array.from({ length: 5 }).map((_, i) => ({
    id: `l_enemy_${i+1}`,
    champion: ['Aatrox','Renekton','Orianna','Jinx','Thresh'][i],
    position: randVec(),
    level: 8 + Math.floor(Math.random()*6),
    cs: 60 + Math.floor(Math.random()*120),
    items: ['Long Sword','Pickaxe','Boots'].slice(0, 1 + (i%3)),
    playstyle: ['teamfight','early_snowball','scaler','split_pusher'][i%4],
    confidence: 0.55 + Math.random()*0.35,
    telemetry: { csEarly: 60, csLate: 120, tpUsage: Math.random() }
  }));
  const gameTime = 300 + Math.floor(Math.random()*1800);
  return {
    game: 'LEAGUE',
    matchId: 'sim_league_001',
    enemyPlayers: enemies as any,
    mapState: { gameTime, dragonTimer: Math.floor(Math.random()*300), baronTimer: Math.floor(Math.random()*300) },
    predictions: [
      { type:'dragon', probability: 0.45+Math.random()*0.4, message:'Enemy setup' },
      { type:'herald', probability: 0.3+Math.random()*0.5, message:'Top side pressure' }
    ]
  };
}

function randVec(): Vector3 {
  return { x: Math.random()*100, y: 0, z: Math.random()*100 };
}
