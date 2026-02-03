import { ValorantMinimapExtractor } from './ValorantMinimapExtractor';
import { TimeSformerWorstCaseSimulator } from './TimeSformerWorstCaseSimulator';
import { ValorantRole } from './types';

export async function runLiveWorstCaseAnalysis(matchId: string, role: ValorantRole) {
  const extractor = new ValorantMinimapExtractor();
  const simulator = new TimeSformerWorstCaseSimulator();
  
  const minimapFrames = await extractor.extractFromGridMatch(matchId);
  const analysis = await simulator.simulateValorantRound(role, minimapFrames);
  
  console.log('🧠 TIMEFORMER MINIMAP ANALYSIS');
  console.log(`Enemy Rotate: ${(analysis.minimapPrediction.enemyRotateProbability*100).toFixed(0)}%`);
  console.log(`Lurk Risk: ${(analysis.minimapPrediction.ambushRisk*100).toFixed(0)}%`);
  console.log(`ALERT: ${analysis.minimapPrediction.worstCaseAlert}`);
  console.log('\n📋 RECOVERY SCRIPT:');
  analysis.yourRecoveryScript.forEach(line => console.log(`→ ${line}`));

  return analysis;
}
