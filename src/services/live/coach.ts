import { CoachCall, LiveGameState } from '../../types/liveIntel';

export class LiveCoach {
  generateCalls(state: LiveGameState): CoachCall[] {
    const calls: CoachCall[] = [];

    if (state.game === 'VALORANT') {
      const rushers = state.enemyPlayers.filter((p) => p.playstyle === 'rush_wq');
      if (rushers.length >= 2 && (state.mapState.roundTime ?? 999) < 40) {
        calls.push({ priority: 'HIGH', message: 'STACK A 5V3 → B PLANT', color: 'red' });
      }
    }

    if (state.game === 'LEAGUE' && (state.mapState.gameTime ?? 0) > 720) {
      const scalers = state.enemyPlayers.filter((p) => p.playstyle === 'scaler');
      if (scalers.length >= 2 && (state.mapState.dragonTimer ?? 999) < 60) {
        calls.push({ priority: 'MEDIUM', message: 'HERALD → BOT T1 CRASH', color: 'yellow' });
      }
    }

    return calls;
  }
}
