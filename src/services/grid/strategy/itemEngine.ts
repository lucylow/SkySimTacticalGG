import { GridMockData, BuildRecommendation } from './types';

export class ItemEngine {
  recommendBuild(gridData: GridMockData, champion: string): BuildRecommendation {
    const { enemyChamp } = gridData.layer1;

    if (champion === 'Aatrox' && enemyChamp === 'Renekton') {
      return {
        mythic: 'Divine Sunderer (vs tanky Renekton)',
        core1: 'Steraks',
        core2: 'Deadmans (teamfight setup)',
        situational: 'Force of Nature (enemy AP threats)'
      };
    }

    return {
      mythic: 'Goredrinker',
      core1: 'Black Cleaver',
      core2: 'Steraks Gage',
      situational: 'Guardian Angel'
    };
  }
}
