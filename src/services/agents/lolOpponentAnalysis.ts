import { BaseAgentImpl } from './baseAgent';
import { AgentInput, AgentTool, AgentInsight } from '@/types/agents';
import { 
  LoLOpponentAnalysisOutput, 
  LoLOpponentProfile, 
  LoLOpponentArchetype 
} from '@/types/lolAgents';
import { CounterattackEngine } from '@/services/CounterattackEngine';

/**
 * LoLOpponentAnalysisAgent
 * 
 * Implements the 10-step player-friendly opponent analysis framework for LoL.
 */
export class LoLOpponentAnalysisAgent extends BaseAgentImpl {
  name = 'LoL Opponent Analysis Agent';
  role = 'opponent_scouting' as any; // Using existing role but extending functionality
  description = 'Player-friendly LoL opponent analysis based on the 10-step framework.';

  async execute(input: AgentInput): Promise<LoLOpponentAnalysisOutput> {
    const { match_context, opponent_data } = input;
    
    // Step 1: Identify Opponent Type
    const profile = await this.generateOpponentProfile(input);
    
    // Step 2 & 3 & 6: Power Windows, Key Abilities, Item Spikes (incorporated into profile)
    
    // Step 4: Lane Behavior Read
    const laneBehavior = await this.readLaneBehavior(input);
    
    // Step 5: Summoner Spell Tracking
    const summoners = this.trackSummonerSpells(input);
    
    // Step 7: Map Tendencies
    const mapTendencies = await this.analyzeMapTendencies(input);
    
    // Step 8: Mid-Game Reads
    const midGameReads = await this.generateMidGameReads(profile, input);
    
    // Step 9: Common Mistakes to Exploit
    const mistakes = this.identifyMistakesToExploit(profile, laneBehavior);
    
    // Step 10: One-Line Game Plan
    const gamePlan = this.generateOneLineGamePlan(profile, laneBehavior, midGameReads);

    const insights: AgentInsight[] = [
      {
        id: `lol-opp-arch-${profile.championName}`,
        type: 'scouting',
        title: `Opponent Type: ${profile.archetype}`,
        description: `Your opponent on ${profile.championName} wants to: ${this.getArchetypeGoal(profile.archetype)}`,
        severity: 0.8,
        actionable: true,
      },
      {
        id: `lol-opp-ability-${profile.keyAbility.key}`,
        type: 'tactical',
        title: `Respect: ${profile.keyAbility.name} (${profile.keyAbility.key})`,
        description: profile.keyAbility.impact,
        severity: 0.9,
        actionable: true,
      },
      {
        id: `lol-opp-plan`,
        type: 'strategy',
        title: 'Game Plan',
        description: gamePlan,
        severity: 1.0,
        actionable: true,
      }
    ];

    const recommendations = [
      gamePlan,
      `Watch for the ${profile.keyAbility.key} cooldown before trading.`,
      ...mistakes.map(m => `Exploit: ${m}`)
    ];

    const exploitablePatterns = this.buildLoLExploitablePatterns();

    // Infer playstyle from archetype/mid-game reads
    const primaryPlaystyle = this.inferLoLPlaystyle(profile);
    const engine = new CounterattackEngine();
    const liveCounter = engine.generateCounter({ game: 'LEAGUE', primary: primaryPlaystyle });

    return {
      ...this.createBaseOutput(insights, recommendations, 0.85),
      opponent_profile: {
        ...profile,
        summonerSpells: summoners,
        primary_playstyle: primaryPlaystyle,
      },
      game_plan: gamePlan,
      lane_behavior_read: laneBehavior,
      map_tendencies: mapTendencies,
      mid_game_read: midGameReads,
      mistakes_to_exploit: mistakes,
      exploitable_patterns: exploitablePatterns,
      live_counterattack: liveCounter,
    };
  }

  private async generateOpponentProfile(input: AgentInput): Promise<LoLOpponentProfile> {
    // In a real implementation, this would query a champion database or use LLM
    // Sampleing based on common champions
    const championName = (input.match_context?.opponent_team as string) || 'Renekton';
    
    const profiles: Record<string, Partial<LoLOpponentProfile>> = {
      'Renekton': {
        archetype: 'Lane Bully',
        powerWindows: [
          { phase: 'Early Game', timing: 'Levels 2–5', danger_level: 0.9 },
          { phase: 'Level 6', timing: 'Ultimate spike', danger_level: 0.8 }
        ],
        keyAbility: {
          name: 'Ruthless Predator',
          key: 'W',
          description: 'Empowered W stuns and hits multiple times when above 50 Fury',
          impact: 'If W is up and Renekton has >50 Fury, respect all-ins and avoid extended trades.'
        },
        itemSpikes: ['Executioner\'s Calling', 'Ironspike Whip', 'Goredrinker / Stridebreaker']
      },
      'Zed': {
        archetype: 'All-In Assassin',
        powerWindows: [
          { phase: 'Level 6', timing: 'Death Mark', danger_level: 1.0 },
          { phase: 'First Item', timing: 'Dirk completion', danger_level: 0.8 }
        ],
        keyAbility: {
          name: 'Living Shadow',
          key: 'W',
          description: 'Creates a shadow that mimics abilities',
          impact: 'If W is down, he has no mobility or long-range poke for ~20 seconds.'
        },
        itemSpikes: ['Serrated Dirk', 'Youmuu\'s Ghostblade']
      }
    };

    const baseProfile = profiles[championName] || profiles['Renekton'];
    
    return {
      championName,
      archetype: (baseProfile.archetype as LoLOpponentArchetype) || 'Lane Bully',
      powerWindows: baseProfile.powerWindows || [],
      keyAbility: baseProfile.keyAbility || { name: 'Unknown', key: 'Q', description: 'Primary tool', impact: 'Respect its cooldown.' },
      itemSpikes: baseProfile.itemSpikes || [],
      summonerSpells: { flash: true, ignite: true }
    };
  }

  private getArchetypeGoal(archetype: LoLOpponentArchetype): string {
    const goals = {
      'Lane Bully': 'Win early trades, deny CS',
      'Scaling Carry': 'Survive lane, scale late',
      'Roamer': 'Push wave, impact map',
      'All-In Assassin': 'Kill you once → snowball',
      'Utility / Tank': 'Survive, enable team'
    };
    return goals[archetype];
  }

  private async readLaneBehavior(input: AgentInput): Promise<string> {
    // Logic to analyze "first 3 waves" as per Step 4
    return "Over-aggressive: Steps up for every CS and autos on cooldown. Likely to overextend.";
  }

  private trackSummonerSpells(input: AgentInput) {
    // Step 5: Simple tracking
    return {
      flash: false, // Assume gone for the example
      ignite: true,
      last_used: Date.now() - 60000
    };
  }

  private async analyzeMapTendencies(input: AgentInput): Promise<string> {
    // Step 7
    return "Moves first to river for Scuttle/Grubs. Disappears from lane when wave is pushed.";
  }

  private async generateMidGameReads(profile: LoLOpponentProfile, input: AgentInput): Promise<string> {
    // Step 8
    return `The enemy ${profile.championName} is the primary threat. Must be peeled or exhausted in fights. Useless if they can't find an entry.`;
  }

  private identifyMistakesToExploit(profile: LoLOpponentProfile, behavior: string): string[] {
    // Step 9
    const mistakes = [
      "Fights without vision in river",
      "Overstays with low mana/HP after pushing",
    ];
    if (behavior.includes('aggressive')) {
      mistakes.push("Tunnels on kills, prone to ganks when overextended");
    }
    return mistakes;
  }

  private inferLoLPlaystyle(profile: LoLOpponentProfile): string {
    switch (profile.archetype) {
      case 'Lane Bully':
        return 'early_snowball';
      case 'Scaling Carry':
        return 'scaler';
      case 'Roamer':
        return 'pick_comp';
      case 'All-In Assassin':
        return 'pick_comp';
      case 'Utility / Tank':
        return 'teamfight';
      default:
        return 'teamfight';
    }
  }

  private generateOneLineGamePlan(profile: LoLOpponentProfile, behavior: string, midGame: string): string {
    // Step 10
    if (profile.archetype === 'Lane Bully') {
      return "I freeze and deny, don't chase, and wait for jungler gank.";
    }
    if (profile.archetype === 'Scaling Carry') {
      return "I shove and roam first to impact other lanes before they scale.";
    }
    return "I play safe, respect the key ability cooldown, and scale for teamfights.";
  }

  private buildLoLExploitablePatterns() {
    const patterns: import('@/types/opponentPatterns').ExploitablePattern[] = [
      {
        id: 'lol-lane-over-trading',
        category: 'Laning Patterns',
        pattern: 'Over-Trading for CS',
        what_you_see: ['Enemy steps up for every minion'],
        exploit: ['Hold abilities', 'Punish last-hit timing', 'Call jungler'],
        severity: 'high',
      },
      {
        id: 'lol-wave-predictable-clear',
        category: 'Laning Patterns',
        pattern: 'Predictable Wave Clear',
        what_you_see: ['Uses same ability on wave every time'],
        exploit: ['Trade during cooldown', 'Freeze wave', 'Force bad backs'],
        severity: 'medium',
      },
      {
        id: 'lol-jungle-same-clear',
        category: 'Jungle Pathing',
        pattern: 'Same Clear Every Game',
        what_you_see: ['Always starts bot side', 'Ganks same lane early'],
        exploit: ['Ward early', 'Track camps', 'Counter-gank or invade opposite side'],
        severity: 'high',
      },
      {
        id: 'lol-jungle-no-adapt',
        category: 'Jungle Pathing',
        pattern: 'No Adaptation After Fail',
        exploit: ['Punish repeat ganks', 'Deep vision', 'Steal camps'],
        severity: 'medium',
      },
      {
        id: 'lol-vision-same-wards',
        category: 'Vision Habits',
        pattern: 'Wards in Same Spots',
        exploit: ['Sweep predictable bushes', 'Fake vision control', 'Ambush'],
        severity: 'medium',
      },
      {
        id: 'lol-vision-facecheck',
        category: 'Vision Habits',
        pattern: 'Face-Checking',
        exploit: ['Bait objectives', 'Hide in fog', 'Don\'t show on map'],
        severity: 'high',
      },
      {
        id: 'lol-objective-fight-every-drake',
        category: 'Objective Decisions',
        pattern: 'Fight Every Dragon',
        exploit: ['Set vision traps', 'Trade Herald/towers', 'Force bad fights'],
        severity: 'high',
      },
      {
        id: 'lol-objective-no-baron-discipline',
        category: 'Objective Decisions',
        pattern: 'No Baron Discipline',
        what_you_see: ['Starting Baron without vision', 'Chasing instead of finishing'],
        exploit: ['Punish with collapse', 'Steal or wipe'],
        severity: 'critical',
      },
      {
        id: 'lol-items-greedy-damage',
        category: 'Itemization Mistakes',
        pattern: 'Greedy Damage Builds',
        exploit: ['Focus that player', 'Force burst', 'Build resist early'],
        severity: 'medium',
      },
      {
        id: 'lol-items-no-antiheal',
        category: 'Itemization Mistakes',
        pattern: 'No Anti-Heal / No MR',
        exploit: ['Lean into healing/damage', 'Force long fights'],
        severity: 'high',
      },
      {
        id: 'lol-teamfight-same-engage',
        category: 'Teamfight Positioning',
        pattern: 'Same Engage Angle',
        exploit: ['Hold peel', 'Kite backwards', 'Punish cooldowns'],
        severity: 'medium',
      },
      {
        id: 'lol-teamfight-carry-overextends',
        category: 'Teamfight Positioning',
        pattern: 'Carry Overextends',
        exploit: ['Flank', 'Fog of war engage', 'Force Flash early'],
        severity: 'high',
      },
      {
        id: 'lol-macro-aram-mid',
        category: 'Macro Patterns',
        pattern: 'ARAM Mid After 15',
        exploit: ['Side lane pressure', 'Vision control', 'Force map movement'],
        severity: 'medium',
      },
      {
        id: 'lol-macro-poor-reset',
        category: 'Macro Patterns',
        pattern: 'Poor Reset Timing',
        exploit: ['Start objectives after enemy resets', 'Punish item delays'],
        severity: 'high',
      },
      {
        id: 'lol-macro-no-boots-rush',
        category: 'Macro Patterns',
        pattern: 'Delayed Boots Timing',
        what_you_see: ['No boots at 5:30 while you have them', 'Enemy stuck in lane without mobility'],
        exploit: ['Force rotations', 'Invade jungle', 'Abuse MS advantage for skillshots'],
        severity: 'medium',
      },
    ];
    return patterns;
  }

  getTools(): AgentTool[] {
    return [];
  }
}

