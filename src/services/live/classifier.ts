import { PlaystyleType, LeaguePlaystyle } from '../../types/liveIntel';

export class LivePlaystyleClassifier {
  classifyValorant(player: any): PlaystyleType {
    const recentActions = player.last30sActions || [];
    
    // Live FDPR calculation (rolling 5 rounds)
    const fdpr = recentActions.filter((a: any) => a.type === 'death' && a.time < 35).length / 5;
    
    if (fdpr > 0.7) return 'rush_wq';
    if (player.utilDamage > player.totalDamage * 0.6) return 'utility_entry';
    if (player.deathTimeAvg > 90) return 'anchor';
    
    return 'lurker';
  }
  
  classifyLeague(player: any, gameTime: number): LeaguePlaystyle {
    const earlyCsRate = player.cs / (gameTime / 60 / 10 || 1); // CS/10min
    
    if (earlyCsRate > 9.5) return 'early_snowball';
    if (player.csLate > player.csEarly * 1.3) return 'scaler';
    if (player.tpUsage > 0.8) return 'split_pusher';
    
    return 'teamfight';
  }
}
