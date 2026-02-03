import { TacticalUtilityEngine } from '../src/services/TacticalUtilityEngine';
import { TacticalUtilityState } from '../src/types/utility';

function testValorant() {
  console.log('--- Testing VALORANT Utility ---');
  const engine = new TacticalUtilityEngine();
  
  const state: TacticalUtilityState = {
    game: 'VALORANT',
    matchTime: 30, // 0:30
    phase: 'mid_round',
    role: 'Controller',
    economy: 3000
  };

  const decision = engine.getRecommendations(state);
  console.log('Decision Tree Path:', decision.decisionTreePath);
  console.log('Recommendations:', JSON.stringify(decision.recommendations, null, 2));
  console.log('Economy Advice:', decision.economyAdvice);
  
  if (decision.decisionTreePath.includes('0:25-0:40 → ENTRY PACKAGE (smoke+flash+damage)')) {
    console.log('✅ VALORANT Timing Check Passed');
  } else {
    console.log('❌ VALORANT Timing Check Failed');
  }

  if (decision.recommendations.some(r => r.type === 'Smoke' && r.priority === 1)) {
    console.log('✅ VALORANT Role Priority Check Passed');
  } else {
    console.log('❌ VALORANT Role Priority Check Failed');
  }
}

function testLol() {
  console.log('\n--- Testing LoL Utility ---');
  const engine = new TacticalUtilityEngine();

  const state: TacticalUtilityState = {
    game: 'LOL',
    matchTime: 12, // 12 minutes
    phase: 'mid-game',
    role: 'Jungle',
    economy: 1500
  };

  const decision = engine.getRecommendations(state);
  console.log('Decision Tree Path:', decision.decisionTreePath);
  console.log('Recommendations:', JSON.stringify(decision.recommendations, null, 2));

  if (decision.decisionTreePath.includes('10-15min → OBJECTIVE SETUP (Smite window)')) {
    console.log('✅ LoL Timing Check Passed');
  } else {
    console.log('❌ LoL Timing Check Failed');
  }

  if (decision.recommendations.some(r => r.type === 'Smite')) {
    console.log('✅ LoL Role Priority Check Passed');
  } else {
    console.log('❌ LoL Role Priority Check Failed');
  }
}

testValorant();
testLol();
