import { GridMockData, RuneRecommendation } from './types';

export class RuneEngine {
  recommendRunes(gridData: GridMockData, position: string): RuneRecommendation {
    const { myChamp, enemyChamp } = gridData.layer1;

    if (myChamp === 'Aatrox' && enemyChamp === 'Renekton') {
      return {
        primary: 'conqueror (sustained duels vs Renekton)',
        secondary: 'resolve (survive ganks)',
        shards: 'AS/Adaptive/Health'
      };
    }

    // Default fallback
    return {
      primary: 'conqueror',
      secondary: 'resolve',
      shards: 'Adaptive/Adaptive/Health'
    };
  }
}
