import { runLiveWorstCaseAnalysis } from './src/services/valorant/timesformer/integration';

async function testAnalysis() {
  console.log('Starting TimeSformer Analysis Test...');
  try {
    const analysis = await runLiveWorstCaseAnalysis('match-123', 'DUELIST');
    console.log('\nTest Successful!');
    console.log('Analysis Result:', JSON.stringify(analysis, null, 2));
  } catch (error) {
    console.error('Test Failed:', error);
  }
}

testAnalysis();
