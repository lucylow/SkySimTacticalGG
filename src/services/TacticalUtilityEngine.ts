import { 
  TacticalUtilityState, 
  UtilityDecision, 
  UtilityUsageRecommendation,
  ValorantUtilityGuide,
  LolSummonerSpellGuide
} from '../types/utility';

export class TacticalUtilityEngine {
  private readonly VALORANT_GUIDES: ValorantUtilityGuide[] = [
    { category: 'Recon', purpose: 'Enemy positions', timing: '0:25-0:35 pre-entry', agents: ['Sova', 'Skye', 'Fade'], winRateImpact: '+18% entry success' },
    { category: 'Flash', purpose: 'Entry denial', timing: '0:38-0:45 execute', agents: ['Breach', 'KAY/O', 'Phoenix'], winRateImpact: '+24% first kill' },
    { category: 'Smoke', purpose: 'Vision control', timing: '0:30 entries, 1:10 retakes', agents: ['Controllers'], winRateImpact: '+31% map control' },
    { category: 'Molly', purpose: 'Area denial', timing: 'Post-plant, choke defense', agents: ['Raze', 'Brimstone'], winRateImpact: '+16% defuse prevention' },
    { category: 'Grenade', purpose: 'Stack clear', timing: '0:50 site hits', agents: ['Initiators'], winRateImpact: '+19% site takes' }
  ];

  private readonly LOL_SUMMONER_GUIDES: LolSummonerSpellGuide[] = [
    { spell: 'Flash', phase: '0-10min', trigger: '70% enemy kill threat', successRate: '82% survival' },
    { spell: 'Ignite', phase: 'Early', trigger: 'Scaling enemy laner', successRate: '+14% kill rate' },
    { spell: 'Teleport', phase: 'Mid', trigger: 'Enemy sidelane T2', successRate: '67% tower trades' },
    { spell: 'Exhaust', phase: 'Late', trigger: 'Enemy carry 2+ items', successRate: '-28% enemy DPS' },
    { spell: 'Cleanse', phase: 'All', trigger: 'CC chain comps', successRate: '+41% trade win' }
  ];

  public getRecommendations(state: TacticalUtilityState): UtilityDecision {
    if (state.game === 'VALORANT') {
      return this.getValorantRecommendations(state);
    } else {
      return this.getLolRecommendations(state);
    }
  }

  private getValorantRecommendations(state: TacticalUtilityState): UtilityDecision {
    const recommendations: UtilityUsageRecommendation[] = [];
    const decisionTreePath: string[] = [];
    const counterplay: string[] = [];
    const proBenchmarks: string[] = [
      'Attack Execute: 0:38 avg (VCT data)',
      'Defense Retake: 1:12 avg',
      'Post-plant hold: 1:28 molotov default'
    ];

    // Timing-based recommendations
    if (state.matchTime <= 25) {
      decisionTreePath.push('0:00-0:25 → RECON only (Sova dart)');
      recommendations.push({
        type: 'Recon',
        purpose: 'Identify enemy positions early',
        timing: '0:25-0:35 pre-entry',
        winRateImpact: '+18% entry success',
        priority: 1
      });
    } else if (state.matchTime <= 40) {
      decisionTreePath.push('0:25-0:40 → ENTRY PACKAGE (smoke+flash+damage)');
      recommendations.push({
        type: 'Entry Package',
        purpose: 'Execute onto site',
        timing: '0:38-0:45 execute',
        winRateImpact: '+24% first kill',
        priority: 1
      });
    } else if (state.matchTime <= 60) {
      decisionTreePath.push('0:40-1:00 → POST-PLANT (molotov default)');
      recommendations.push({
        type: 'Molly',
        purpose: 'Deny defuse/hold site',
        timing: 'Post-plant',
        winRateImpact: '+16% defuse prevention',
        priority: 1
      });
    } else if (state.matchTime <= 90) {
      decisionTreePath.push('1:00-1:30 → RETAKE UTILITY (flash+molotov)');
      recommendations.push({
        type: 'Retake',
        purpose: 'Re-take site control',
        timing: '1:10 retakes',
        winRateImpact: '+31% map control',
        priority: 1
      });
    } else {
      decisionTreePath.push('1:30+ → ECONOMY DENIAL (smoke spike paths)');
    }

    // Role-specific priority
    const role = state.role.toUpperCase();
    if (role === 'DUELIST') {
      recommendations.push({ type: 'Flash', purpose: 'SELF (not team)', timing: 'Entry', winRateImpact: 'High', priority: 1 });
      recommendations.push({ type: 'Damage', purpose: 'Post-kill pressure', timing: 'Mid-round', winRateImpact: 'Medium', priority: 2 });
    } else if (role === 'CONTROLLER') {
      recommendations.push({ type: 'Smoke', purpose: 'Entry smokes (0:30)', timing: '0:30', winRateImpact: '+31%', priority: 1 });
      recommendations.push({ type: 'Smoke', purpose: 'Mid-round rotates (1:00)', timing: '1:00', winRateImpact: 'High', priority: 2 });
    } else if (role === 'INITIATOR') {
      recommendations.push({ type: 'Recon', purpose: 'Info → Execute', timing: 'Pre-entry', winRateImpact: '+18%', priority: 1 });
      recommendations.push({ type: 'Flash', purpose: 'Flash trades (never solo)', timing: 'Execute', winRateImpact: '+24%', priority: 1 });
    } else if (role === 'SENTINEL') {
      recommendations.push({ type: 'Utility', purpose: 'Choke one-ways', timing: 'Early/Mid', winRateImpact: 'High', priority: 1 });
      recommendations.push({ type: 'Utility', purpose: 'Solo anchor denial', timing: 'Hold', winRateImpact: 'High', priority: 2 });
    }

    // Counterplay
    counterplay.push('ENEMY SMOKES → Delay 5s → Entry');
    counterplay.push('ENEMY FLASH → Reposition → Counter-flash');
    counterplay.push('ENEMY MOLLY → Off-angle → Wait 3s');

    // Economy
    let economyAdvice = '';
    if (state.economy !== undefined) {
      if (state.economy < 2000) economyAdvice = 'FORCE BUY: 1 util/agent max';
      else if (state.economy < 3400) economyAdvice = 'HALF BUY: 2 util/agent';
      else economyAdvice = 'FULL BUY: All utility';
    }

    return {
      recommendations,
      decisionTreePath,
      counterplay,
      economyAdvice,
      proBenchmarks
    };
  }

  private getLolRecommendations(state: TacticalUtilityState): UtilityDecision {
    const recommendations: UtilityUsageRecommendation[] = [];
    const decisionTreePath: string[] = [];
    const counterplay: string[] = [];
    const proBenchmarks: string[] = [
      '2.1 summoner spells/10min',
      '76% Flash survival rate',
      '59% objective secure rate',
      '3:45 → Level 2 | 8:00 → Objectives | 14:30 → Baron'
    ];

    // Game time based decision tree
    if (state.matchTime < 5) {
      decisionTreePath.push('0-5min → SURVIVAL (Flash/Heal)');
    } else if (state.matchTime < 10) {
      decisionTreePath.push('5-10min → LANE PRIORITY (CC → Gank call)');
    } else if (state.matchTime < 15) {
      decisionTreePath.push('10-15min → OBJECTIVE SETUP (Smite window)');
    } else if (state.matchTime < 20) {
      decisionTreePath.push('15-20min → TEAMFIGHT INITIATE (Engage chain)');
    } else {
      decisionTreePath.push('20+min → PICKOFF ENABLE (Cleanse → Counter-engage)');
    }

    // Role-specific priority
    const role = state.role.toUpperCase();
    if (role === 'TOP') {
      recommendations.push({ type: 'CC', purpose: 'Gank setup (Nautilus E)', timing: 'Early/Mid', winRateImpact: 'High', priority: 1 });
      recommendations.push({ type: 'Flash', purpose: 'Escape flashes (reserved)', timing: 'All', winRateImpact: '82% survival', priority: 1 });
    } else if (role === 'JUNGLE') {
      recommendations.push({ type: 'Smite', purpose: 'Objective Secure (3 camps low)', timing: 'Objectives', winRateImpact: '59% secure rate', priority: 1 });
    } else if (role === 'SUPPORT') {
      recommendations.push({ type: 'Vision', purpose: 'Vision control (Bard E chain)', timing: 'All', winRateImpact: 'High', priority: 1 });
      recommendations.push({ type: 'Engage', purpose: 'Engage chains (Nautilus combo)', timing: 'Teamfights', winRateImpact: 'High', priority: 1 });
    }

    // Counterplay
    counterplay.push('ENEMY ENGAGE → Cleanse → Counter-engage');
    counterplay.push('ENEMY CC → Exhaust → Bait cooldowns');
    counterplay.push('ENEMY VISION → Oracle sweep → Deep wards');

    return {
      recommendations,
      decisionTreePath,
      counterplay,
      proBenchmarks
    };
  }
}
