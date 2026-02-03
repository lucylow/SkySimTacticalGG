import { BaseAgentImpl } from './baseAgent';
import { AgentInput, AgentTool, AgentInsight } from '@/types/agents';
import { 
  WorstCaseState, 
  RecoveryScript, 
  TrainingDrill, 
  Role,
  WorstCaseAnalysisOutput,
  TrainingSession
} from '@/types/worstCase';

const FAILURE_TRIGGERS: Record<string, string[]> = {
  // League of Legends
  TOP: ['counterpicked', 'level2_gank', 'perma_camped', 'tp_wasted'],
  JUNGLE: ['invaded_clear', 'camps_stolen', 'double_gank_lost'],
  MIDDLE: ['roam_death', 'wave_frozen', 'tower_dive_failed'],
  BOT: ['support_abandoned', 'jungle_ignore', 'tower_trade_lost'],
  SUPPORT: ['adc_feeding', 'engage_missed', 'vision_denied'],

  // Valorant
  DUELIST: ['first_duel_loss', 'entry_death_untraded', 'dry_peek'],
  INITIATOR: ['flash_missed', 'util_baited', 'info_denied'],
  CONTROLLER: ['smokes_late', 'molotov_wasted', 'postbox_lost'],
  SENTINEL: ['site_overrun', 'utility_destroyed', 'retake_failed'],
  IGL: ['team_silent', 'conflicting_calls', 'disorganized_exec']
};

const TILT_RESET: Record<string, string> = {
  'die_level2': '1 death = 0 information. Next.',
  'team_feeding': 'Focus MY CS. Their deaths = my farm.',
  'behind_20cs': 'CS compounds. Farm compounds harder.',
  'flamed': '/mute all. Execute script.',
  'missed_opener': 'One whiff. Utility returns. Patience.',
  'counterpicked': 'This is normal. Farm wins games.',
  'invaded_clear': 'Economy > revenge ganks.',
  'first_duel_loss': 'One death ≠ round loss.'
};

export class WorstCaseSimulatorAgent extends BaseAgentImpl {
  name = 'Worst Case Simulator';
  role = 'worst_case_simulator' as any;
  description = 'Simulates worst-case scenarios and provides recovery paths for LoL and Valorant.';

  async execute(input: AgentInput): Promise<WorstCaseAnalysisOutput> {
    const role = (input.match_context?.team_composition?.[0] as Role) || 'TOP';
    const trigger = input.previous_analysis?.trigger || FAILURE_TRIGGERS[role][0];
    
    const state: WorstCaseState = {
      role,
      failureTrigger: trigger,
      gameTime: 420, 
      resources: { 
        hp: 35, 
        mana: role === 'TOP' || role === 'MIDDLE' ? 25 : undefined, 
        utility: 1, 
        economy: 'eco' 
      },
      teamState: { coordination: 0.3, vision: 2, comms: false }
    };

    const recoveryScript = this.generateRecoveryScript(state);
    const drills = this.generateDrills(state);
    const tiltProtocol = TILT_RESET[trigger] || 'Breathe. Execute fallback.';

    const insights: AgentInsight[] = [
      {
        id: `wc-trigger-${trigger}`,
        type: 'strategy',
        title: `Worst Case Triggered: ${trigger.replace('_', ' ')}`,
        description: `Immediate recovery required for ${role} role.`,
        severity: 0.9,
        actionable: true,
      },
      {
        id: `wc-mental`,
        type: 'tactical',
        title: 'Mental Reset Protocol',
        description: tiltProtocol,
        severity: 0.7,
        actionable: true,
      }
    ];

    const recommendations = [
      ...recoveryScript.immediate.map(s => `IMMEDIATE: ${s}`),
      ...recoveryScript.positioning.map(s => `POSITION: ${s}`),
      `GOAL: ${recoveryScript.mental}`
    ];

    return {
      ...this.createBaseOutput(insights, recommendations, 0.9),
      state,
      recovery_script: recoveryScript,
      drills,
      tilt_protocol: tiltProtocol
    };
  }

  private generateRecoveryScript(state: WorstCaseState): RecoveryScript {
    const scripts: Partial<Record<Role, Record<string, RecoveryScript>>> = {
      TOP: {
        counterpicked: {
          immediate: ['/mute all', 'Ward tri-bush', 'Farm under tower'],
          positioning: ['Freeze near T1', 'Deny enemy CS', 'Call jungler'],
          macro: ['Give drake/Herald', 'Split T2 at 15min', 'Scale to 3 items'],
          mental: 'This is normal. Farm wins games.'
        }
      },
      JUNGLE: {
        invaded_clear: {
          immediate: ['Track enemy jungler', 'Ward enemy buff', 'Ping missing'],
          positioning: ['Crossmap farm', 'Steal enemy camps', 'Path opposite'],
          macro: ['Trade objectives', 'Farm to item parity', 'Gank winning lanes'],
          mental: 'Economy > revenge ganks.'
        }
      },
      DUELIST: {
        first_duel_loss: {
          immediate: ['Stop dry peeking', 'Ask for util support', 'Play contact duty'],
          positioning: ['Off-angle anchor', 'Crossfire setup', 'Lurk information'],
          macro: ['Delay executes', 'Stack for retake', 'Save for next half'],
          mental: 'One death ≠ round loss.'
        }
      },
      CONTROLLER: {
        smokes_late: {
          immediate: ['Smoke defensively', 'Delay pushes', 'Call for hold'],
          positioning: ['Play for retake', 'Hold deep angles', 'Reposition to safety'],
          macro: ['Optimize cooldowns', 'Save utility for post-plant', 'Communicate smoke status'],
          mental: 'Patience. Timing returns.'
        }
      }
    };

    return scripts[state.role]?.[state.failureTrigger] || {
      immediate: ['Slow down', 'Ward defensively', 'Farm safe'],
      positioning: ['Play off-angles', 'Avoid 1v1s', 'Wait for numbers'],
      macro: ['Trade objectives', 'Scale patiently', 'Avoid fights'],
      mental: 'Breathe. Execute fallback.'
    };
  }

  private generateDrills(state: WorstCaseState): TrainingDrill[] {
    const isLoL = ['TOP', 'JUNGLE', 'MIDDLE', 'BOT', 'SUPPORT'].includes(state.role);
    
    if (isLoL) {
      return [
        {
          name: 'Low HP Survival',
          hp: 35,
          objective: 'Farm 8 CS/min under tower',
          successMetric: '8+ CS/min, 0 deaths'
        },
        {
          name: 'Resource Deprivation',
          hp: 40,
          objective: 'Hold lane for 3 waves without using Ultimate',
          successMetric: '0 deaths, maintain XP parity'
        }
      ];
    } else {
      return [
        {
          name: 'Eco Round Trading',
          economy: 'eco',
          objective: 'Pistol damage > rifle economy',
          successMetric: '2+ kills OR force enemy save'
        },
        {
          name: 'Utility Denial Drill',
          utility: 0,
          objective: 'Hold site with sound cues only',
          successMetric: 'Delay plant for 20s'
        }
      ];
    }
  }

  public generateTrainingSession(role: Role): TrainingSession {
    const triggers = FAILURE_TRIGGERS[role] || [];
    const drills = triggers.map((trigger, i) => {
      // Sampleed state for simulation
      const state = {
        role,
        failureTrigger: trigger,
        gameTime: 420,
        resources: { hp: 35, utility: 1, economy: 'eco' as any },
        teamState: { coordination: 0.3, vision: 2, comms: false }
      };
      
      return {
        drill: i + 1,
        scenario: trigger,
        script: {
          ...this.generateRecoveryScript(state as any),
          ...state
        },
        practiceMode: i < 3 ? 'normals' as const : 'scrims' as const
      };
    });

    return {
      role,
      sessionTitle: `${role} Worst-Case Mastery`,
      drills,
      successCriteria: {
        survivalRate: 0.7,
        csPerMin: ['TOP', 'MIDDLE', 'BOT'].includes(role) ? 7.5 : undefined,
        tiltRecovery: 100
      }
    };
  }

  getTools(): AgentTool[] {
    return [];
  }
}

